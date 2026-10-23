// Runs only inside an isolated dsh profile. No model calls or credentials.
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
export const inject = ['agents', 'sessions', 'permissionPresets', 'sessionPersistence'];
export function apply(ctx) {
  const out = process.env.AUTO_PERSISTENCE_DIR;
  const phase = process.env.AUTO_PERSISTENCE_PHASE;
  const cases = [
    { id: 'legacy-ask', sandbox: 'workspace-write', approval: 'ask', expected: 'sandbox-auto' },
    { id: 'legacy-never', sandbox: 'workspace-write', approval: 'never', expected: 'sandbox-auto' },
    { id: 'official-auto', sandbox: 'danger-full-access', approval: 'ask', expected: 'auto' },
  ];
  const results = [];
  const assert = (value, message) => { if (!value) throw new Error(message); };
  void (async () => {
    await ctx.get('loader').await();
    for (const item of cases) {
      const handle = phase === 'seed'
        ? await ctx.agents.create({ sessionId: item.id, meta: { cwd: '/tmp', ...(item.approval === 'never' ? { origin: 'subagent', parentSession: 'legacy-ask' } : {}) }, agentOptions: { provider: 'deepseek-official', model: 'deepseek-flash' } })
        : await ctx.agents.resume({ resumeSessionId: item.id, agentOptions: { provider: 'deepseek-official', model: 'deepseek-flash' } });
      const session = handle.agent.session;
      if (phase === 'seed') {
        session.append('sandbox/mode', { mode: item.sandbox });
        session.append('approval/policy', { policy: item.approval });
        session.append('permission/preset', { preset: 'auto' });
      }
      await ctx.sessions.flush(session);
      const events = session.snapshotEvents();
      const latest = type => events.findLast(event => event.type === type)?.data;
      assert(latest('sandbox/mode').mode === item.sandbox, item.id + ': sandbox changed');
      assert(latest('approval/policy').policy === item.approval, item.id + ': approval changed');
      if (phase !== 'seed') {
        const before = JSON.parse(readFileSync(join(out, 'seed-' + item.id + '.json'), 'utf8'));
        assert(JSON.stringify(events.slice(0, before.length)) === JSON.stringify(before), item.id + ': old events rewritten');
        assert(latest('permission/preset').preset === item.expected, item.id + ': wrong identity');
        const migrated = events.filter(event => event.type === 'permission/preset' && event.data.preset === 'sandbox-auto');
        assert(migrated.length === (item.expected === 'sandbox-auto' ? 1 : 0), item.id + ': non-idempotent migration');
      }
      writeFileSync(join(out, phase + '-' + item.id + '.json'), JSON.stringify(events, null, 2));
      results.push({ id: item.id, origin: session.header.origin, parentSession: session.header.parentSession, events: events.length, identity: latest('permission/preset').preset, sandbox: latest('sandbox/mode').mode, approval: latest('approval/policy').policy, projected: ctx.permissionPresets.current(session) });
      await handle.dispose();
    }
    writeFileSync(join(out, phase + '-result.json'), JSON.stringify({ passed: true, phase, pid: process.pid, results }, null, 2));
    ctx.get('appExit')(0);
  })().catch(error => {
    writeFileSync(join(out, phase + '-result.json'), JSON.stringify({ passed: false, phase, error: error.stack }, null, 2));
    ctx.get('appExit')(1);
  });
}
