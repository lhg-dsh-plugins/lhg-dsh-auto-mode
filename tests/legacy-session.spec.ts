import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import SessionStore, { Session, SessionId, type SessionEvent } from '@deepseek-ai/dsh-session'
import SessionProjectionRegistry from '@deepseek-ai/dsh-session-projection'
import PermissionPresetService from '@deepseek-ai/dsh-permission-presets'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import ToolRuntime, { defineTool, type ToolExecutionInput } from '@deepseek-ai/dsh-tools'
import { ToolCallId } from '@deepseek-ai/dsh-llm'
import * as AutoMode from '../src/index.js'

let context: Context | undefined
afterEach(async () => { await context?.fiber.dispose(); context = undefined })

function legacy(sandbox = 'workspace-write', approval = 'ask'): Session {
  const session = Session.create(SessionId('legacy-seed'))
  session.append('permission/preset', { preset: 'auto' })
  session.append('sandbox/mode', { mode: sandbox as 'workspace-write' })
  session.append('approval/policy', { policy: approval as 'ask' })
  return session
}

async function mounted(): Promise<Context> {
  context = new Context()
  await context.plugin(SessionStore)
  await context.plugin(SessionProjectionRegistry)
  context.provide('shell', { sandboxMode: 'workspace-write' })
  context.provide('approval', { config: { policy: 'ask' } })
  context.provide('llm', { stream: () => (async function* () {})() })
  await context.plugin(PermissionPresetService, {
    presets: {
      'workspace-write': { sandbox: 'workspace-write', approval: 'ask' },
      'sandbox-auto': { sandbox: 'workspace-write', approval: 'ask' },
      'danger-full-access': { sandbox: 'danger-full-access', approval: 'never' },
    },
  })
  await context.plugin(SystemPrompt)
  await context.plugin(ToolRuntime)
  return context
}

describe('legacy workspace Auto session migration', () => {
  it.each(['ask', 'never'])('renames only the durable identity and retains approval %s', approval => {
    const session = legacy('workspace-write', approval)
    const before = session.snapshotEvents()
    expect(AutoMode.migrateLegacyAutoSession(session)).toBe(true)
    expect(session.snapshotEvents().slice(0, before.length)).toEqual(before)
    expect(session.snapshotEvents().slice(before.length)).toMatchObject([
      { type: 'permission/preset', data: { preset: 'sandbox-auto' } },
    ])
    expect(AutoMode.migrateLegacyAutoSession(session)).toBe(false)
  })

  it('leaves official Auto and incomplete or changed selections untouched', () => {
    for (const session of [legacy('danger-full-access'), legacy('read-only'), Session.create(SessionId('empty'))]) {
      const before = session.snapshotEvents()
      expect(AutoMode.migrateLegacyAutoSession(session)).toBe(false)
      expect(session.snapshotEvents()).toEqual(before)
    }
    const switched = legacy()
    switched.append('permission/preset', { preset: 'workspace-write' })
    expect(AutoMode.migrateLegacyAutoSession(switched)).toBe(false)
  })

  it('publishes the migration before real permission restore admission and keeps it on re-adoption', async () => {
    const ctx = await mounted()
    await ctx.plugin(AutoMode)
    const published: SessionEvent[] = []
    ctx.on('session/event', (_session, event) => { published.push(event) })
    const seed = legacy()
    const restored = ctx.sessions.create(SessionId('restored'), { seed: seed.snapshotEvents() })
    expect(ctx.permissionPresets.current(restored)).toBe('sandbox-auto')
    expect(published.filter(event => event.type === 'permission/preset')).toMatchObject([
      { data: { preset: 'sandbox-auto' } },
    ])
    const reopened = ctx.sessions.create(SessionId('reopened'), { seed: restored.snapshotEvents() })
    expect(ctx.permissionPresets.current(reopened)).toBe('sandbox-auto')
    expect(reopened.snapshotEvents().filter(event => event.type === 'permission/preset')).toHaveLength(2)
  })

  it('migrates a prepared live session when the policy is installed before announcement', async () => {
    const ctx = await mounted()
    const pending = ctx.sessions.prepare(SessionId('pending'), { seed: legacy().snapshotEvents() })
    const detach = ctx.sessions.enter(pending)
    try {
      await ctx.plugin(AutoMode)
      expect(pending.snapshotEvents().at(-1)).toMatchObject({ type: 'permission/preset', data: { preset: 'sandbox-auto' } })
      ctx.sessions.announce(pending)
      expect(ctx.permissionPresets.current(pending)).toBe('sandbox-auto')
    } finally { detach() }
  })
  it('keeps a restored never-approval child supervised when the effective preset is custom and its parent is offline', async () => {
    const ctx = await mounted()
    ctx.provide('agents', { get: () => undefined })
    await ctx.plugin(AutoMode)
    const restored = ctx.sessions.create(SessionId('orphan'), {
      seed: legacy('workspace-write', 'never').snapshotEvents(),
      meta: { origin: 'subagent', parentSession: SessionId('offline'), cwd: '/tmp' },
    })
    expect(ctx.permissionPresets.current(restored)).toBe('custom')
    const agent = { session: restored } as NonNullable<ToolExecutionInput['agent']>
    let bodies = 0
    ctx.tools.register(defineTool({
      name: 'bash', description: 'Must not execute for an orphaned child.',
      parameters: { command: { type: 'string', required: true } },
      output: { schema: { type: 'boolean' }, render: () => [{ type: 'text', text: 'executed' }] },
      async execute() { bodies += 1; return true },
    }))
    const run = () => ctx.tools.execute({
      agent, callId: ToolCallId('orphan-call'), name: 'bash', arguments: { command: 'pwd' }, signal: new AbortController().signal,
    })
    await expect(run()).resolves.toMatchObject({ isError: true, error: { message: expect.stringContaining('parent authority unavailable') } })
    restored.append('sandbox/mode', { mode: 'danger-full-access' })
    await expect(run()).resolves.toMatchObject({ isError: true, error: { message: expect.stringContaining('parent authority unavailable') } })
    expect(bodies).toBe(0)
  })

})
