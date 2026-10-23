import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { loadHarnessYaml } from './harness-dependencies.mjs'

test('loads YAML from app-boot ownership without a root YAML dependency', async t => {
  const root = await mkdtemp(join(tmpdir(), 'auto-mode-harness-dependencies-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const host = 'node_modules/@deepseek-ai/dsh'
  const boot = `${host}/node_modules/@deepseek-ai/dsh-app-boot`
  const files = {
    'package.json': '{}',
    [`${host}/package.json`]: '{"name":"@deepseek-ai/dsh"}',
    [`${boot}/package.json`]: '{"name":"@deepseek-ai/dsh-app-boot"}',
    [`${boot}/node_modules/yaml/package.json`]: '{"name":"yaml","main":"index.cjs"}',
    [`${boot}/node_modules/yaml/index.cjs`]: 'module.exports = { owner: "app-boot" };',
  }
  for (const [path, content] of Object.entries(files)) {
    await mkdir(dirname(join(root, path)), { recursive: true })
    await writeFile(join(root, path), content)
  }
  assert.equal(loadHarnessYaml(root).owner, 'app-boot')
})
