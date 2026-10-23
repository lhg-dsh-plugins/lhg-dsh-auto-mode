# 桌面端 0.2.0 预适配候选记录

当前工作区已实现插件 `0.2.0-alpha.1` 候选版，目标是 Harness `0.1.7-rc.2` 对应的 master `21638c56315ae6a2b552d6091945d3144c9af32e`。这不是对未来正式 `0.2.0` 安装包的兼容承诺。本预览版发布到 npm `next`；稳定版 `latest` 保持 `0.1.10`。

## 已实施的适配

- 使用独立 preset `sandbox-auto`，显示为 `Sandbox Auto` / `沙箱自动审批`，保持 `workspace-write + ask`。不接管官方 `auto` / Auto review 的无沙箱策略。
- 旧会话仅在最新记录为 `auto + workspace-write + ask/never` 时追加新的 preset identity，不改写旧事件，也不扩大 sandbox 或 approval。官方 `auto + danger-full-access` 保持不变。
- 分类器和恢复提示使用 producer-owned `plugin:auto-permission-mode` 消息来源，避免继续写入被 V4 拒绝的旧 `kind: plugin`。
- 初始化同步验证目标 preset 必须是 workspace-write + ask；错误配置在安装任何策略前失败。
- 子代理从在线人类根会话取得授权。带有我方持久化 identity 的子代理即使 projection 为 `custom` 也继续受监管；父会话不可用时拒绝执行，不能自行取得一次性提权。
- 客户端只匹配我方显示名，保留风险确认及中英文切换；覆盖新版 `/permission` 的 Tab 提交路径，不拦截官方 Auto review。
- Git 安装使用受版本控制的 `lib` 产物，移除消费端 `prepare` 构建。分发前仍需重建、检查产物和打包。

## 安装候选版

在本工作区执行 `pnpm install --frozen-lockfile`、`pnpm build`、`pnpm pack --pack-destination /tmp`，再通过应用的“插件 → 添加插件”输入生成 tarball 的绝对路径。Desktop 使用自己的 profile 和插件管理入口，不能用 CLI `--profile desktop` 代替。

npm 预览安装输入为 `@nanmicoder/dsh-auto-mode@next`，精确版本为 `@nanmicoder/dsh-auto-mode@0.2.0-alpha.1`。GitHub 默认分支同步提供预构建产物；固定版本可使用 `github:NanmiCoder/dsh-auto-mode#v0.2.0-alpha.1`。npm 页面 URL 不是包名安装 spec。

## 验收结果（2026-09-28）

以下结果对应同一候选 tarball，SHA256 `12cf13e4f0ce0d5c00fbf4671f6295f963f6cf8315f9bdc17d613be9cb1ab2af`。这是预验收包的哈希；最终发布会重新打包并运行真实 API 验收，准确哈希及证据见仓库 `release-candidate.json`。

| 验收 | 结果与证据 |
| --- | --- |
| 类型检查、构建、单元测试、包契约 | `pnpm verify` 通过；217 项测试通过、5 项跳过；产物/依赖解析 gate 6 项通过 |
| 新宿主依赖图 | 干净安装，273 个唯一 DSH 包，doctor 无问题；Schemastery 3.18.4、Cordis 4.0.4、group 1.0.4 |
| 0.1.7-rc.2 产品入口 | 实际 `dsh --profile headless` + 确定性模型，13 个工具分支和全部断言通过；`/tmp/auto-mode-pre020-fixture-rc2-v2/result.json` |
| 真实 DeepSeek API | 15 次请求、24 项检查全过，包含原生编辑器、精确提权、拒绝、多余提权字段恢复；`/tmp/auto-mode-pre020-real-api-editor-fix/real-api-result.json` |
| 旧会话落盘恢复 | 三个独立进程，旧 ask/never 与子代理父链保留、迁移幂等、官方 Auto 不变、JSONL 逐字节保留旧前缀；`/tmp/auto-mode-pre020-persistence-v4/summary.json`。覆盖旧权限身份，不等同于 V3→V4 格式转换验收 |
| 历史 0.1.5-rc.2 | 新装 231 包精确依赖组合，真实产品入口 fixture 全部断言通过；`/tmp/auto-mode-pre020-legacy015rc2/result.json` |
| master 桌面 Host | 官方源码构建并启动 Electron，真实 desktop profile 的“添加插件”接受候选 tarball，详情显示 v0.2.0-alpha.1、组件运行中；完整桌面重启后仍运行 |
| 桌面账号模型 | 用户授权状态 `credential-stored/succeeded`；通过“DeepSeek 账号”模型在 `/tmp` 创建、读取并精确核对测试文件，模式为“沙箱自动审批”；`/tmp/auto-mode-pre020-candidate/desktop-account-smoke.png` |
| npm 包名入口 | 桌面 UI 从临时 loopback npm registry 安装精确候选成功并启用；元数据保留实际产物创建时间，生产依赖来自官方 registry。没有发布到公网；`/tmp/auto-mode-pre020-candidate/desktop-npm-candidate.png` |
| Git 桌面入口 | 桌面 UI 输入临时 Git 仓库的精确候选提交，成功安装并启用；`/tmp/auto-mode-pre020-candidate/desktop-git-candidate.png`。此证据不等同于已推送后的 GitHub URL 验收 |
| Git 分发 | 桌面配套 pnpm 11.7 + Node 24.21，全新 consumer/store，无 build allowlist，临时 Git 精确提交安装成功；58 个 lib 文件与候选包逐字节一致。仅加回 prepare 的负对照准确复现拒绝；`/tmp/auto-mode-git-install-bhedJl/result.json` |
| 独立审查 | 三个 agent 分别审查 Host、客户端和分发依赖；复审发现并修复 custom 子代理绕过识别，新增真实 projection 回归通过 |

桌面版本：Electron 44.0.0，Host 内置 Node 24.18.1，primary runtime 外置 Node 24.21.0，pnpm 11.7.0。上述普通 headless 新版运行使用本机 Node 26.7.0；历史与 Git 安装测试使用外置 Node 24.21.0。UI 操作由 Ego 浏览器连接 **Electron 启动的同一 Host/profile loopback** 完成，并非直接操作 Electron renderer。

## 发布收尾

1. 当前公开 npm `latest` 0.1.10 的精确 peer 范围拒绝新宿主；当前 GitHub 地址的 prepare 被新版 pnpm 拒绝。这两项已经复现，并由本候选的精确依赖范围和无安装期构建分发方式修复。候选发布/推送后，还需用公开地址完成最终安装验证。
2. 正式 Harness 0.2.0 发布时，核对最终 SHA/cohort；若只改版本号，追加该精确版本到 `compatibility.json` 并同步 peer、版本守卫及 CI 矩阵，再执行产品验收；若有新契约变化，按 diff 补适配。
3. 尚未执行原生 Windows、其余历史版本全部矩阵、直接 Electron renderer 全量交互。不得由本轮 macOS 结果扩大为这些平台已通过。
4. 保留历史验收文档，新的发布证据单独记录在 `validation/0.2.0-alpha.1`。
