import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'

/** Resolve YAML through its real Harness owner, including isolated pnpm dependency layouts. */
export function loadHarnessYaml(runtime) {
  const runtimeRequire = createRequire(join(resolve(runtime), 'package.json'))
  const hostRequire = createRequire(runtimeRequire.resolve('@deepseek-ai/dsh/package.json'))
  const bootRequire = createRequire(hostRequire.resolve('@deepseek-ai/dsh-app-boot/package.json'))
  return bootRequire('yaml')
}
