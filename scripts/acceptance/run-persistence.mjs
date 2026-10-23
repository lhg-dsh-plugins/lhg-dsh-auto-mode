// Three fresh product processes exercise durable permission-identity migration.
import { mkdirSync, symlinkSync, readFileSync, writeFileSync, existsSync, copyFileSync, readdirSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { loadHarnessYaml } from '../harness-dependencies.mjs';

const [runtimeArg, artifactArg, outArg] = process.argv.slice(2);
if (!runtimeArg || !artifactArg || !outArg) throw Error('Usage: node scripts/acceptance/run-persistence.mjs <runtime> <tgz> <new-report-dir>');
const runtime = resolve(runtimeArg), artifact = resolve(artifactArg), out = resolve(outArg);
if (existsSync(out)) throw Error('Use a new evidence directory; existing results are not overwritten');
let parent = dirname(out);
while (!existsSync(parent)) parent = dirname(parent);
const fromTmp = relative(realpathSync('/tmp'), realpathSync(parent));
if (fromTmp === '..' || fromTmp.startsWith('../') || isAbsolute(fromTmp)) throw Error('Persistence evidence must stay inside /tmp');
const require = createRequire(join(runtime, 'package.json'));
const cliManifest = require.resolve('@deepseek-ai/dsh/package.json');
const yaml = loadHarnessYaml(runtime);
const json = (path, value) => writeFileSync(path, JSON.stringify(value, null, 2) + '\n');
const profile = join(out, 'home/profiles/headless');
for (const path of [profile, join(out, 'artifact'), join(out, 'user-home'), join(profile, 'node_modules/@deepseek-ai'), join(profile, 'node_modules/@nanmicoder')]) mkdirSync(path, { recursive: true });
const artifactSnapshot = join(out, 'input.tgz');
copyFileSync(artifact, artifactSnapshot);
const entries = execFileSync('tar', ['-tzf', artifactSnapshot], { encoding: 'utf8' }).split(/\r?\n/).filter(Boolean);
if (!entries.every(path => path.startsWith('package/') && !path.split('/').includes('..'))) throw Error('Artifact contains a path outside package/');
execFileSync('tar', ['-xzf', artifactSnapshot, '-C', join(out, 'artifact')]);
symlinkSync(join(runtime, 'node_modules'), join(out, 'artifact/package/node_modules'));
symlinkSync(join(out, 'artifact/package'), join(profile, 'node_modules/@nanmicoder/dsh-auto-mode'));
// Normal npm trees expose these directly; isolated pnpm trees also keep a
// hoisted dependency directory. Both link back to the selected runtime cohort.
for (const root of [join(runtime, 'node_modules/@deepseek-ai'), join(runtime, 'node_modules/.pnpm/node_modules/@deepseek-ai')]) {
  if (!existsSync(root)) continue;
  for (const name of readdirSync(root)) {
    const destination = join(profile, 'node_modules/@deepseek-ai', name);
    if (!existsSync(destination)) symlinkSync(join(root, name), destination);
  }
}
json(join(profile, 'package.json'), { name: 'auto-mode-persistence-acceptance', private: true, type: 'module', dsh: { profile: { bundles: ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-headless', '@nanmicoder/dsh-auto-mode'], patchReload: 'startup' } } });
copyFileSync(join(dirname(fileURLToPath(import.meta.url)), 'persistence-driver.mjs'), join(profile, 'persistence-driver.mjs'));
const permission = yaml.parse(readFileSync(join(out, 'artifact/package/cordis.patch.yml'), 'utf8')).find(patch => patch.id === 'permission')?.config;
if (!permission?.presets?.['sandbox-auto']) throw Error('Artifact lacks Sandbox Auto configuration');
writeFileSync(join(profile, 'cordis.patch.yml'), yaml.stringify([
  { id: 'headless-startup', disabled: true }, { id: 'headless-runner', disabled: true },
  { id: 'permission', config: { ...permission, defaultPreset: 'workspace-write' } },
  { id: 'session-persistence-jsonl', config: { root: join(out, 'sessions'), compression: 'none' } },
  { insert: [{ id: 'official-auto-review', name: '@deepseek-ai/dsh-experimental-auto-review' }, { id: 'persistence-acceptance', name: './persistence-driver.mjs' }] },
]));
const phases = [], diskChecks = [];
for (const phase of ['seed', 'restore', 'restart']) {
  const result = spawnSync(process.execPath, [join(dirname(cliManifest), 'lib/bin.js'), '--profile', 'headless'], {
    cwd: '/tmp', env: { PATH: process.env.PATH, HOME: join(out, 'user-home'), DSH_HOME: join(out, 'home'), DSH_TELEMETRY_DISABLED: '1', AUTO_PERSISTENCE_DIR: out, AUTO_PERSISTENCE_PHASE: phase },
    encoding: 'utf8', timeout: 45000,
  });
  writeFileSync(join(out, phase + '.log'), (result.stdout ?? '') + (result.stderr ?? ''));
  if (result.error) throw result.error;
  if (result.status !== 0) throw Error(phase + ' failed; inspect ' + join(out, phase + '.log'));
  const phaseResult = JSON.parse(readFileSync(join(out, phase + '-result.json'), 'utf8'));
  if (!phaseResult.passed) throw Error(phase + ' reported failed checks');
  phases.push(phaseResult);
  for (const id of ['legacy-ask', 'legacy-never', 'official-auto']) {
    const bytes = readFileSync(join(out, 'sessions/--tmp--', id, 'session.v4.jsonl'));
    writeFileSync(join(out, phase + '-' + id + '.jsonl'), bytes);
    if (phase !== 'seed') {
      const previous = phase === 'restore' ? 'seed' : 'restore';
      const before = readFileSync(join(out, previous + '-' + id + '.jsonl'));
      const preserved = bytes.subarray(0, before.length).equals(before);
      diskChecks.push({ phase, id, previousBytes: before.length, currentBytes: bytes.length, preserved });
      if (!preserved) throw Error(id + ': on-disk prefix changed');
    }
  }
  console.log(JSON.stringify({ phase, passed: true, pid: phaseResult.pid }));
}
json(join(out, 'summary.json'), {
  passed: true, entry: 'dsh --profile headless', runtime, hostVersion: require('@deepseek-ai/dsh/package.json').version,
  artifact, artifactSnapshot, artifactSha256: createHash('sha256').update(readFileSync(artifactSnapshot)).digest('hex'), phases, diskChecks,
  scope: 'Native V4 logs with legacy Auto permission identity, including subagent lineage. Does not test V3-to-V4 artifact-format migration.',
});
console.log(JSON.stringify({ passed: true, report: join(out, 'summary.json') }));
