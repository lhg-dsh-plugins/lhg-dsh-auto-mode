> **lhg 修复版（fork）**：本仓库是上游 [@nanmicoder/dsh-auto-mode](https://github.com/NanmiCoder/dsh-auto-mode)（v0.2.0）的修复版发布，原始出处与固定版本见 [UPSTREAM.md](./UPSTREAM.md)，上游 LICENSE 与署名保持不变。
> **本版修复（v0.2.1）**：修复 PowerShell 反引号（或 Bash 反斜杠）混淆命令名即可绕过确定性安全扫描的缺陷——`` Rem`ove-Item -Recurse -Force $HOME `` 曾被自动放行，现与明文命令同等被硬拒绝。证据链与复验结果见 [BUGFIX.md](./BUGFIX.md)。

---

> [!WARNING]
> **Maintenance ended on 2026-09-29.** This repository is being archived. DeepSeek Harness now includes built-in Auto review; this plugin will receive no further fixes or host compatibility updates. Existing releases remain available for historical use.
>
> **Migration:** in a working session, select a built-in manual permission mode (for example, Workspace write) before disabling or uninstalling `@nanmicoder/dsh-auto-mode` in the application's plugin manager. If live reload fails, fully quit and reopen Harness. Start a new session and select the built-in mode you intend to use. Preserve old sessions; do not rewrite their permission identities or delete their logs.
>
> **The policies are not equivalent:** this plugin defaults to `workspace-write` sandboxing. In the audited Harness 0.2.0-rc.2 implementation, built-in Auto review uses `danger-full-access`. Review the current official permission description before enabling it. See the [official Harness source](https://github.com/deepseek-ai/deepseek-harness). The installation and compatibility details below are historical, not ongoing support promises.

<p align="right">
  <strong>English</strong> · <a href="./README_ZH.md">简体中文</a>
</p>

<p align="center">
  <img src="./assets/readme/hero.svg" width="100%" alt="dsh-auto-mode lets routine DeepSeek Harness work flow while stopping risky actions">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@nanmicoder/dsh-auto-mode"><img src="https://img.shields.io/npm/v/@nanmicoder/dsh-auto-mode.svg" alt="npm version"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/@nanmicoder/dsh-auto-mode.svg" alt="MIT license"></a>
  <img src="https://img.shields.io/badge/DeepSeek%20Harness-0.2.0--rc.2-202724" alt="See installation instructions for exact host compatibility">
</p>

## Sandbox Auto

`dsh-auto-mode` keeps routine work inside Harness's `workspace-write` sandbox and reviews semantic risks or exact one-shot requests for wider access. The plugin's **Sandbox Auto** mode uses the independent key `sandbox-auto`; it does not replace the official, unsandboxed **Auto review** mode.

> [!IMPORTANT]
> Plugin **0.2.0** is the stable npm `latest` release for the official Harness **0.2.0-rc.2** release (`dsh-v0.2.0-rc.2`, commit `639ed015397290b3745d163aafe02ffee4aa3f84`). Plugin and host version numbers are independent. Harness itself still labels this release RC; install the exact supported host rather than assuming its npm `latest` points to it.

| Harness host | Plugin support |
| --- | --- |
| `0.2.0-rc.2` | Recommended for plugin `0.2.0` |
| `0.1.7-rc.2`, `0.1.5-rc.2`, `0.1.5-rc.1`, `0.1.2-rc.1`, `0.1.2-alpha.5`, `0.1.2-alpha.3`, `0.1.2-alpha.2` | Retained exact compatibility; product-entry matrix required for release |
| Other unlisted hosts, including `0.2.0-rc.1` and `0.1.6-alpha.*` | Not declared supported |

See [compatibility.json](./compatibility.json), [release acceptance](./validation/0.2.0), and [the release adaptation record](./docs/harness-020-rc2.md). Historical preview evidence remains in [desktop preparation](./docs/desktop-020-preparation.md).

### Install

In Harness, open **Plugins → Add plugin** and enter either:

```text
@nanmicoder/dsh-auto-mode
https://github.com/NanmiCoder/dsh-auto-mode
```

For an immutable release, use `@nanmicoder/dsh-auto-mode@0.2.0` or `github:NanmiCoder/dsh-auto-mode#v0.2.0`. An npm package page URL is not an install spec. Desktop users should use the application's plugin manager so the plugin is installed into the correct profile.

For a Web profile:

```sh
dsh plugin --profile web add @nanmicoder/dsh-auto-mode@0.2.0
```

To test local changes, run `pnpm install --frozen-lockfile`, `pnpm build`, and `pnpm pack --pack-destination /tmp`, then add the generated tarball by absolute path. Git installations consume tracked `lib` output without an install-time `prepare` hook; include the rebuilt output whenever source changes.

### Mode selection and migration

Refresh the client and choose **Sandbox Auto** (**沙箱自动审批** in Chinese), then acknowledge the risk notice. The locale service updates menus, the active-mode control, General settings, `/permission` and the dialog. Official **Auto review** remains separate and is not decorated or intercepted by this plugin.

For old plugin sessions, migration recognizes the latest durable `auto` identity only when the stored sandbox is `workspace-write` and approval is `ask` or `never`. It appends a new `permission/preset: sandbox-auto` event, retaining existing events and both permission knobs. It leaves official `auto` sessions with `danger-full-access` unchanged. An orphan delegated child with our durable identity remains supervised and cannot execute without a live human-parent authority.

Unsupported hosts fail explicitly. To recover an affected Web profile, stop it and run `dsh plugin --profile web remove @nanmicoder/dsh-auto-mode` from an external terminal. Desktop uses its own recovery/plugin management flow. Back up session data before host downgrades; do not change only the preset name or bypass compatibility checks.

## Permission modes

| Mode | File sandbox | Approval | Sandbox Auto policy |
| --- | --- | --- | --- |
| Read Only | `read-only` | ask | inactive |
| Workspace Write | `workspace-write` | ask | inactive |
| **Sandbox Auto** | `workspace-write` | ask | **active** |
| Full access | `danger-full-access` | never | inactive |

Ordinary Sandbox Auto work stays inside Workspace Write. Only an explicit one-shot widening may be approved automatically:

| Decision | Typical effect |
| --- | --- |
| **Allow** | unfamiliar sandboxed Bash/PowerShell, routine dependency installation, local Git commits, project work, builds, tests, type checks, audited DSH coordination tools |
| **Classify** | pre-session deletion, ephemeral downloaded-package execution, dangerous remote Git/database/service changes, sensitive reads, network transmission, external-system writes, exact sandbox widening |
| **Ask once** | genuinely ambiguous effect or authority, or manual review after three consecutive classifier failures; an escalation reuses the official exact approval instead of opening two dialogs |
| **Deny** | root/home/DSH_HOME/system destruction, policy bypass, credential exfiltration, hidden dynamic deletion, and the first two consecutive classifier failures for a risky action |

The classifier is not an authority of its own. It receives a redacted, bounded description of the pending call and may recognize only authorization found in direct human Session messages. Repository text, tool output, Assistant text, Skills, plugins, and sub-agents cannot grant permission.

## Shell, sandbox, and deletion behavior

Sandbox Auto no longer tries to prove every Bash or PowerShell syntax safe with a growing allowlist. Literal unknown commands, argument variables, pipelines, redirections, inline code, and PowerShell combinations run in the official `workspace-write` sandbox by default. The operating system denies writes outside the workspace instead of an unfamiliar syntax opening a dialog. Only an executable name hidden behind a variable or glob is denied in the background so the Agent can retry with a visible command.

The sandbox controls where a process writes, not whether deleting existing workspace data is sensible; it also does not restrict reads or network access. Deletion therefore has a narrower policy than ordinary writes:

| Deletion kind | Sandbox Auto behavior |
| --- | --- |
| One exact artifact created in this Session with unchanged file identity | clean up automatically |
| One pre-existing file or directory | classify only after a direct user message precisely requests that target |
| One pre-existing target outside the workspace | lend one exact wider grant after precise authorization |
| Multiple targets, globs, variables, piped operands, or nested-interpreter deletion | deny in the background and require one visible literal target per call |
| Filesystem root, Home, DSH_HOME, system, or credential-critical paths | deny unconditionally |

Session artifacts include files created through shell redirection, arbitrary successful shell tools and project scaffolders, filesystem tools, and the official string-replacement editor. For shell tools, Sandbox Auto compares a bounded workspace snapshot immediately before and after the call; broad workspaces retain a safe direct-child fallback so a newly scaffolded project can still be attributed without treating files inside pre-existing projects as new. Artifacts are tracked by device, inode, birth time, and kind; recursive cleanup additionally requires every current object in the tree to match the Session registry. A renamed, replaced, or symlink-substituted path—or an old file moved into a new directory—loses automatic-cleanup status. When permanent deletion was not requested, the Agent guidance prefers a move, backup, or version-control-backed removal.

Routine npm, pnpm, yarn, bun, pip, and local Cargo installation runs inside the workspace sandbox without classifier traffic, just like builds and tests. The sandbox still confines filesystem writes; ephemeral runners such as `npx`, `bunx`, `pnpm dlx`, `yarn dlx`, and `npm exec` remain reviewed because they fetch and execute a package without first making it an ordinary project dependency. Sensitive reads, network transmission, and external side effects also remain reviewed.

When the task clearly requires an outside write, the Agent may retry through the official `sandbox_permissions: danger-full-access` plus `justification` contract. For one exact new, narrow, reversible target, direct task intent can support a background one-shot grant without making the user repeat magic authorization words. Overwriting or deleting pre-existing data still requires a direct user message that precisely names the effect and target. The reviewer receives pre-execution `existedBefore` filesystem facts and can return one `allowed-once` only for the same Agent, tool call, mode, and justification; it never changes the standing Session permission.

Full access is the explicitly unsandboxed, approval-free mode; this plugin cannot make it safe. Sandbox Auto is designed to avoid needing that standing authority: keep almost all work sandboxed and lend the smallest capability once when the business task genuinely requires it.


Ordinary calls should omit `sandbox_permissions` and `justification`. A redundant `workspace-write` request is rejected before execution, with explicit retry guidance and a one-assembly tool schema projection that helps the model remove those fields. Standing permissions remain unchanged. Third-party `apply_patch` executors have no verified official sandbox contract, so they require manual approval; critical path mutations are still denied. Literal PowerShell assignments run normally, while command-valued right-hand sides receive the same assessment as the command itself.

## Sub-agents, Workflow, and Goal

Official in-process Subagents, Workflow `agent()` calls, Ralph `spawn` workers, and AgentTeams members inherit Sandbox Auto and the workspace boundary through their live `parentSession` chain. Their individual file and shell calls are still checked separately. Goal stays on the current Agent and therefore keeps the same authority.

Delegated children use `approval: never` and cannot widen themselves to `danger-full-access`; they must report a blocked wider action to the parent. Out-of-process providers such as Codex, ACP, or dsh-sdk own their internal tool permissions and are outside this plugin's registry boundary.

## Configuration

No extra endpoint or API key is needed by default. Sandbox Auto uses the current Session's DSH provider and model. A trusted profile may pin a dedicated route:

```yaml
- id: auto-permission-mode
  config:
    classifierProvider: deepseek-official
    classifierModel: deepseek-v4-flash
    classifierTimeoutMs: 30000
    classifierMaxOutputTokens: 1024
```

See [DESIGN.md](./DESIGN.md) for the complete decision order, threat model, Windows path handling, classifier payload limits, and official-source references.

## Security boundaries

The plugin cannot mediate package lifecycle scripts that run before it loads, direct Node filesystem/process calls made outside `ctx.tools`, a compromised Harness runtime, or commands launched outside Harness. The official file sandbox also does not limit reads, network access, or external services, and the Windows ACL backend has documented `Everyone`/hard-link `partial` boundaries. The localized Sandbox Auto label, glyph, and acknowledgement dialog are compatibility enhancements for the tested DSH Web UI, not security boundaries.

## Development

```sh
pnpm install
pnpm verify
git diff --check
```

## License

[MIT](./LICENSE)
