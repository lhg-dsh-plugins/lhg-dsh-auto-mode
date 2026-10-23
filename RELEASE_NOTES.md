Sandbox Auto 0.2.0 is now the stable npm `latest` release, targeting official Harness 0.2.0-rc.2 (tag dsh-v0.2.0-rc.2, commit 639ed015397290b3745d163aafe02ffee4aa3f84).

- Admit the exact newly released host in package peers and the runtime guard, and pin the full official development dependency cohort.
- Retain the independent Sandbox Auto preset, workspace sandbox, exact one-shot approvals, delegated child protections, and append-only old-session migration from the preview.
- Keep prebuilt Git distribution compatible with the desktop installer. Install using `@nanmicoder/dsh-auto-mode`, `@nanmicoder/dsh-auto-mode@0.2.0`, or the GitHub repository URL.
- Preserve seven previously supported exact hosts and verify the release artifact through the product-entry matrix, real provider calls and persistence acceptance. See validation/0.2.0 and docs/harness-020-rc2.md for exact evidence and scope.

---

Sandbox Auto 0.2.0-alpha.1 prepares for the upcoming Harness desktop release against verified Harness 0.1.7-rc.2 and master 21638c56315ae6a2b552d6091945d3144c9af32e. Install from npm with `@nanmicoder/dsh-auto-mode@next` (or the exact version). Stable `latest` remains 0.1.10.

- Rename the plugin-owned permission preset to `sandbox-auto` (Sandbox Auto / 沙箱自动审批), preserving workspace-write + ask while keeping the host's official full-access Auto separate.
- Migrate legacy workspace-sandboxed Auto sessions by appending identity events; preserve approval settings and delegated lineage. Real disk and restart acceptance verifies migration is idempotent and official Auto remains unchanged.
- Adopt producer-owned message sources for V4 logs. Keep delegated children supervised even when the host projects their mode as custom; deny actions when the live human root authority is unavailable.
- Ship checked-in build outputs and remove install-time prepare so Git installs work under the desktop package manager. CI verifies source/output consistency and the packed package.
- Update exact DSH dependencies, client labels, risk acknowledgement and slash-command Tab handling. Test desktop plugin installation, activation, restart and an actual signed-in account conversation.
- This is a preview for the verified source revision. The final official Harness 0.2.0 version and cohort will receive a separate compatibility check when released. See docs/desktop-020-preparation.md and validation/0.2.0-alpha.1 for evidence and platform limits.

---

Auto Mode 0.1.10 supports Harness `0.1.5-rc.2`, the recommended RC pairing, while retaining all five previously supported exact hosts.

- Fix startup on `0.1.5-rc.2`: version 0.1.9 rejected it in the plugin compatibility guard. The consumed RC permission, tool, approval, session and Web menu implementations are unchanged, so approval policy remains unchanged.
- Pin the development dependency cohort and include RC.2 in the CI artifact matrix; add regression tests for RC.2, mixed cohorts and unverified versions.
- Document exact installation commands, RC-first support and recovery with `dsh plugin --profile <name> remove @nanmicoder/dsh-auto-mode`.
- Harness `0.1.6-alpha.*` is not supported. Alpha.2 reserves `auto`; renaming only the preset or bypassing the guard is not a fix. Unsupported versions remain fail-closed rather than silently leaving Auto without its policy.
- Locally validated the same tarball through six exact Harness CLI cohorts, real DeepSeek API flows on RC.2, and the actual Web UI in Ego Lite. See VALIDATION.md and validation/0.1.10 for sanitized evidence. Windows and Linux checks run separately in CI.

---

Auto Mode 0.1.9 supports the exact Harness cohort `0.1.5-rc.1`, `0.1.2-rc.1`, `0.1.2-alpha.5`, `0.1.2-alpha.3`, and `0.1.2-alpha.2`. `0.1.5-rc.1` is the current npm `latest` host and is now the recommended pair; installs on it previously failed because the plugin declared support only up to `0.1.2-rc.1`. Use `dsh --version` to check the running host before upgrading the plugin. Harness `0.1.1-rc.2` must migrate to a supported pair; this release does not backport the old host API.

- Support the exact `0.1.5-rc.1` host cohort. The resolved closure gained 17 packages and lost 4 relative to `0.1.2-rc.1`, so the override list was regenerated from the resolved graph rather than re-versioned in place. The previously failing `plugin tree failed to load ... unsupported or mixed Harness packages` report is reproduced and fixed.
- Keep the existing four `0.1.2-*` hosts on the same build: the permission, tool-pipeline, session-event and approval seams Auto Mode consumes are unchanged across this range, so no runtime branches were added.
- Read the real-API model id from the running host settings instead of a hard-coded `deepseek-v4-flash`; `0.1.5-rc.1` renamed the default to `deepseek-flash` and the id is a pass-through wire value.
- Mount the official `@deepseek-ai/dsh-tool-str-replace-editor` package in the acceptance profile, because `0.1.5-rc.1` removed it from the base composition, so the native-editor acceptance keeps exercising the real tool.
- Repair the real-API boundary-guidance probe, which matched a string the guidance never contained and therefore always reported false.
- Verify the Web surface in a real browser on `0.1.5-rc.1`: localized access-mode menu and risk acknowledgement, acknowledgement-gated confirmation, a real-API authorized deletion through the classifier, and Auto plus the injected icon surviving a reload.
- Vendor nine pinned community maintenance skills instead of seven, and refresh them to the reviewed upstream commit: adds the `0.1.3-alpha.1`/`0.1.3-alpha.2` migration cards, the precision checklist, `inject-lint`, `dsh-plugin-development`, `plugin-heavy-dep` and `dsh-benchmark-case`. The migration cards still stop at `0.1.3-alpha.2`; `0.1.5-rc.1` was verified against the exact host artifacts and this project's own probes instead.

---

Auto Mode 0.1.7 supports the exact Harness cohort `0.1.2-rc.1`, `0.1.2-alpha.5`, `0.1.2-alpha.3`, and `0.1.2-alpha.2`. Use `dsh --version` to check the running host before upgrading the plugin. Harness `0.1.1-rc.2` must migrate to a supported pair; this release does not backport the old host API.

- Read modern Session events through `seq`/`eventAt`, retain the Alpha event-array fallback, and fail early on old or mixed peer versions instead of crashing during a user turn (#13).
- Restore translated Auto labels and icons in current Chinese permission menus (#10).
- Explain permission boundaries before tool use and recover from redundant `workspace-write` arguments without changing standing authority (#8, #12; adapted from #11).
- Build Git installs through `prepare`, while registry packages retain prebuilt server and browser entries (#7).
- Expand classifier secret redaction and encoded URL credential detection; conservatively inspect patch paths and keep third-party patch execution behind manual approval (#6, sanitizer concern in #4).
- Allow literal PowerShell assignments and recursively review command-valued assignments; preserve dynamic execution and critical deletion guards (selected correction from #3).
- Vendor seven pinned community maintenance skills; verify exact host cohorts, diagnose profile/artifact identity, and publish only the tarball verified by the full CI matrix.

Contribution decisions and reproduction/verification details are in [the maintenance record](https://github.com/NanmiCoder/dsh-auto-mode/blob/main/docs/maintenance-2026-09-06/README.md). PR #3's authorization cache and blanket retry, PR #4's content-based write restriction, and PR #6's broad patch auto-approval are intentionally not included.
