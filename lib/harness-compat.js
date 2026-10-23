import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { supportedHosts, recommendedHost } = require('../compatibility.json');
/** Reject old/mixed directly resolved API peers before a user turn.
 * The CLI doctor separately audits the full runtime and profile resolution graph. */
export function assertHarnessCompatibility() {
    const packages = ['dsh-permission-presets', 'dsh-tools', 'dsh-llm', 'dsh-session', 'dsh-user-approval'];
    const versions = packages.map(name => ({ name, version: require(`@deepseek-ai/${name}/package.json`).version }));
    const version = versions[0].version;
    if (!supportedHosts.some(host => host.version === version) || versions.some(entry => entry.version !== version)) {
        throw new Error(`Auto Mode: unsupported or mixed Harness packages (${versions.map(entry => `${entry.name}@${entry.version}`).join(', ')}). Install a coherent DeepSeek Harness ${recommendedHost} runtime and restart the profile. Supported exact hosts: ${supportedHosts.map(host => host.version).join(', ')}. Unlisted releases (including Harness 0.1.6-alpha.*) are not supported. To recover startup without Auto Mode, remove @nanmicoder/dsh-auto-mode from the affected profile with dsh plugin --profile <name> remove @nanmicoder/dsh-auto-mode. Do not rename the auto preset alone or bypass this check.`);
    }
}
/** Alpha.2 exposes events; Alpha.4+ exposes an exclusive seq and eventAt. */
export function* sessionEventsNewestFirst(session) {
    const reader = session;
    if (typeof reader.eventAt === 'function' && Number.isSafeInteger(reader.seq) && reader.seq >= 0) {
        for (let index = reader.seq - 1; index >= 0; index -= 1) {
            const event = reader.eventAt(index);
            if (event !== undefined)
                yield event;
        }
        return;
    }
    if (Array.isArray(reader.events)) {
        for (let index = reader.events.length - 1; index >= 0; index -= 1)
            yield reader.events[index];
        return;
    }
    throw new Error('Auto Mode: unsupported Harness session event reader; check the installed host package cohort');
}
//# sourceMappingURL=harness-compat.js.map