# BUGFIX — v0.2.1

## Bug 标题

转义符混淆命令名绕过确定性安全扫描：PowerShell 反引号 `` Rem`ove-Item `` 被自动放行，连 `$HOME` 删除的硬拒绝熔断一并失效

## 证据链（修复前）

`src/shell.ts` 的分词器对 PowerShell 反引号一律判 `opaque`（无法静态读），随后 `assessShell()` 的 opaque 回退路径与 `hardDenyShellReason()` 的全行熔断都声称「仍能识别敏感/破坏性效果」——但它们全部只对**未去转义的原文**做正则识别。而在 PowerShell 中反引号是转义符，`` Rem`ove-Item `` 与明文 `Remove-Item` 是同一个命令名；一个反引号插进命令名中间，即可让该名称对全部确定性扫描隐形。

用上游自有测试同款入口（`resolveRoots` + `ArtifactRegistry` + `assessShell`/`hardDenyShellReason`）离线复现，修复前输出：

- 明文 `Remove-Item -Recurse -Force ./important-data` → `decision=ask`（删除未观察数据需授权，符合预期）
- 混淆 `` Rem`ove-Item -Recurse -Force ./important-data `` → `decision=allow, classifierEligible=false`，理由 "pwsh syntax remains confined by the workspace-write sandbox even though static decomposition is unavailable"——**自动放行且不经任何语义复核**
- 混淆 `` Rem`ove-Item -Recurse -Force $HOME `` → `decision=allow`；而明文同命令为 `decision=deny`（硬熔断 "dynamic deletion targeting the user home is not permitted"）——**连无条件硬拒绝都被绕过**
- 同类问题在 Bash 侧存在镜像：`r\m -rf ./important-data` 单独出现时分词器能还原反斜杠（→ ask），但只要同行另有 `$(...)` 使整行判 opaque（`echo $(date); r\m -rf ./important-data`），回退扫描同样看不见 `rm`

复现脚本在基线（`git stash` 回退修复）下断言失败、复跑逐字一致；修复后全部断言通过。

## 根因

识别层与解释层对转义符的理解不一致：解释器（及分词器在可分解时）会把 `` `x `` / `\x` 还原为字符 `x`，但 opaque 回退识别与全行硬拒绝扫描直接匹配原文，命令名被转义符从中间切断后，`destructiveNestedSource`、`sensitiveReadMarker`、`opaqueSemanticReason` 及硬拒绝的四条全行规则全部落空，最终落入 opaque 路径的默认 `allow`。

## 改动文件

- `src/shell.ts`（唯一逻辑改动）：新增仅供识别扫描使用的 `scanText()`——把 `` `c ``（pwsh）/ `\c`（bash）还原为 `c`，得到与解释器一致的扫描文本；`hardDenyShellReason()` 的四条全行规则与 `assessShell()` opaque 分支的三个识别器改为**原文与扫描文本任一命中即算命中**（只增不减，既有命中不丢失）。分词/opaque 判定与执行语义未动。
- `tests/shell.spec.ts`：新增 1 条回归用例（混淆删除 → deny、`$HOME`/sudo 混淆 → 硬熔断命中、Bash 镜像、字符串内良性反引号仍 allow），上游既有用例未改。
- `lib/shell.js`、`lib/shell.d.ts.map`、`lib/shell.js.map`、`lib/git-artifact.json`：由上游 `pnpm run build` 重新生成（该仓 `lib/` 随仓提交）。
- `package.json`：version 0.2.0 → 0.2.1；`repository.url` 改指本 fork 落点仓。
- `README.md`：顶部追加中文 lhg fork 头，上游原文一字未删；`LICENSE` 原样保留；新增 `UPSTREAM.md` / 本文件。

注：`release-candidate.json` 与 `validation/0.2.0/` 是 v0.2.0 的历史发版记录（内含该版产物 SHA），非活版本戳，未改动；`pnpm-lock.yaml` 无根包版本字段。

## 复验结果

- 回归用例：修复前失败（混淆命令 = allow）→ 修复后全过（混淆命令 = deny，与「opaque 行中可见破坏性命令」的既有口径一致；`$HOME` 变体与明文同为硬拒绝；良性字符串反引号仍 allow 不误伤）。
- 全量验证（`pnpm verify` 的四步逐项执行）：typecheck 退出 0；`pnpm test` 197 通过 / 27 跳过（基线 196 通过 / 27 跳过，+1 为新增回归，跳过项均为平台限定用例，零回归）；build 成功；`node scripts/verify-package.mjs` 输出 "package contract and Git artifact verified"。

## 验证边界

- 未做真实宿主端到端验证，也未在真实 PowerShell 中执行混淆命令（沙箱无 pwsh）：结论建立在插件自身的分类函数与上游自有测试同款调用方式之上；「反引号转义后字符即命令名字符」是 PowerShell 的既定语义（`` I`nvoke-Expression `` 等为公开已知的混淆手法）。
- 扫描文本只用于识别层：去转义可能把引号内字面文本拼成敏感词形，方向上只会多触发 ask/deny（与既有全行扫描连引号内 `sudo` 也命中的保守口径一致），不会新增放行。
- 上游 open issue #16 针对的是 v0.1.9 在 DSH 0.1.6-alpha.1 上的保留预设名冲突；当前 HEAD（v0.2.0）的 `cordis.patch.yml` 已改用 `sandbox-auto` 预设名、且 compatibility.json 未声明支持 0.1.6-alpha.*，该 issue 在本基线不可复现，故未选用，本版修的是上述静态实锤缺陷。
