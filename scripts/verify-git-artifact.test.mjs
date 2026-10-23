import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, writeFile, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { verifyGitArtifact } from './verify-git-artifact.mjs'

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'auto-mode-git-artifact-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const paths = [
    'package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'tsconfig.client.json',
    'tsdown.config.ts', 'scripts/clean.mjs', 'scripts/verify-git-artifact.mjs', 'src/index.ts',
    'lib/index.js', 'lib/index.d.ts', 'lib/client.js', 'lib/client.js.map', 'lib/client/index.d.ts',
  ]
  for (const path of paths) {
    await mkdir(dirname(join(root, path)), { recursive: true })
    await writeFile(join(root, path), `fixture ${path}\n`)
  }
  await verifyGitArtifact(root, { write: true })
  return root
}

test('verifies a built artifact without any Git index and tolerates checkout newlines', async t => {
  const root = await fixture(t)
  await verifyGitArtifact(root)
  await writeFile(join(root, 'src/index.ts'), 'fixture src/index.ts\r\n')
  await verifyGitArtifact(root)
})

test('rejects stale source and dependency lock changes', async t => {
  for (const path of ['src/index.ts', 'pnpm-lock.yaml']) {
    const root = await fixture(t)
    await writeFile(join(root, path), 'changed\n')
    await assert.rejects(verifyGitArtifact(root), /differs/)
  }
})

test('rejects modified or extra runtime output', async t => {
  for (const path of ['lib/index.js', 'lib/unexpected.js']) {
    const root = await fixture(t)
    await writeFile(join(root, path), 'changed\n')
    await assert.rejects(verifyGitArtifact(root), /differs/)
  }
})

test('rejects a missing public entry even when creating a new receipt', async t => {
  const root = await fixture(t)
  await unlink(join(root, 'lib/client.js'))
  await assert.rejects(verifyGitArtifact(root, { write: true }), /missing lib\/client.js/)
})

test('rejects missing receipt instead of implicitly accepting output', async t => {
  const root = await fixture(t)
  await unlink(join(root, 'lib/git-artifact.json'))
  await assert.rejects(verifyGitArtifact(root), /receipt is missing or invalid/)
})
