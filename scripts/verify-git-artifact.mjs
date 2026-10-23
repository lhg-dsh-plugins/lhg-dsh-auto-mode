import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const receiptPath = 'lib/git-artifact.json'
const buildInputs = [
  'package.json',
  'pnpm-lock.yaml',
  'tsconfig.json',
  'tsconfig.client.json',
  'tsdown.config.ts',
  'scripts/clean.mjs',
  'scripts/verify-git-artifact.mjs',
]

async function filesUnder(root, directory) {
  const paths = []
  for (const entry of await readdir(resolve(root, directory), { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`
    if (entry.isDirectory()) paths.push(...await filesUnder(root, path))
    else if (entry.isFile()) paths.push(path)
    else throw new Error(`Git artifact must not contain symlinks or special files: ${path}`)
  }
  return paths.sort()
}

async function hashes(root, paths) {
  return Object.fromEntries(await Promise.all(paths.sort().map(async path => [
    path,
    // These source and generated files are text. Ignore Git checkout newline conversion.
    createHash('sha256').update((await readFile(resolve(root, path), 'utf8')).replaceAll('\r\n', '\n')).digest('hex'),
  ])))
}

/** Record build inputs and outputs after a successful build, or detect stale checked-in output. */
export async function verifyGitArtifact(root, { write = false } = {}) {
  const outputs = (await filesUnder(root, 'lib')).filter(path => path !== receiptPath)
  for (const required of ['lib/index.js', 'lib/index.d.ts', 'lib/client.js', 'lib/client.js.map', 'lib/client/index.d.ts']) {
    if (!outputs.includes(required)) throw new Error(`Git artifact is missing ${required}; run pnpm build`)
  }
  const current = {
    schemaVersion: 1,
    inputs: await hashes(root, [...buildInputs, ...await filesUnder(root, 'src')]),
    outputs: await hashes(root, outputs),
  }
  if (write) {
    await writeFile(resolve(root, receiptPath), `${JSON.stringify(current, null, 2)}\n`)
    return
  }
  let recorded
  try {
    recorded = JSON.parse(await readFile(resolve(root, receiptPath), 'utf8'))
  } catch (error) {
    throw new Error('Git artifact receipt is missing or invalid; run pnpm build and commit lib/', { cause: error })
  }
  if (JSON.stringify(recorded) !== JSON.stringify(current)) {
    throw new Error('Git artifact differs from its build inputs or output receipt; run pnpm build and commit lib/')
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  if (args.some(arg => arg !== '--write') || args.length > 1) {
    throw new Error('Usage: node scripts/verify-git-artifact.mjs [--write]')
  }
  await verifyGitArtifact(resolve(import.meta.dirname, '..'), { write: args.includes('--write') })
  console.log(args.includes('--write') ? 'Git artifact receipt written' : 'Git artifact inputs and outputs verified')
}
