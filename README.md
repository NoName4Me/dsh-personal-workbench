# DSH Personal Workbench · 个人工作台

[![Build](https://github.com/NoName4Me/dsh-personal-workbench/actions/workflows/check.yml/badge.svg)](https://github.com/NoName4Me/dsh-personal-workbench/actions/workflows/check.yml)

为 [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/deepseek-harness) 提供可通过 AI 自主定制的个人首页。无需编程即可从模板开始组织工作，也可以将日常需求转化为可重复使用的个人界面。

> 当前为技术预览版，开发基线 DSH `v0.2.3-alpha.2`。自动化构建及模拟宿主浏览器测试已建立，真实 DSH Desktop 和内网模型仍待验收。请勿直接用于敏感业务数据。

## 功能

- **开箱即用**：个人首页、原生对话入口、常用办公能力、工作区、近期会话及任务提醒。
- **多工作台**：通用、项目、工具和空白四种模板，支持新建、复制、切换、重命名、删除、设为默认及导入导出。
- **AI 定制**：通过 DSH 原生会话描述修改需求，导入 AI 返回的 TSX，交互预览后发布；也可直接编辑源码。
- **版本管理**：草稿、历史快照和生效版本相互独立；恢复历史版本不回滚业务数据。
- **离线运行**：组件和 TSX 编译器随插件打包，不依赖 CDN 或运行时 npm 下载。
- **视觉一致性**：使用 shadcn/ui、Lucide 和 DSH 主题变量。

## 安装

1. 在 [GitHub Actions](https://github.com/NoName4Me/dsh-personal-workbench/actions/workflows/check.yml) 中打开最新成功的构建，下载相应平台的 artifact。
2. 解压 ZIP，取得 `dsh-personal-workbench-*.tgz`。
3. 在 DSH 插件管理界面添加本地插件包。安装后从左侧导航打开「个人工作台」。

启动时自动打开工作台可在工作台管理界面关闭。实际安装与离线部署兼容性仍需在目标客户端验证。

## 定制工作台

打开「定制」，填写需求并进入 DSH 原生 AI 会话，发送预填内容。AI 完成后返回工作台，选择「导入 AI 最新结果」，运行交互预览，保存版本或发布。也可以粘贴完整 TSX 源码。

历史版本可载入草稿、预览并重新发布。开发指引及可用组件见 [workbench-dev Skill](skills/workbench-dev/SKILL.md)。

## 开发

使用 Node.js 24（DSH 当前基线要求 24.22.3 或更高的 24.x 版本）和 pnpm 10。

```bash
pnpm install --no-frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm pack
```

浏览器主流程测试：

```bash
pnpm exec playwright install chromium
pnpm test:browser
```

构建产物位于 `dist/client.js`，`pnpm pack` 生成可分发的插件包。CI 覆盖 Windows/Linux 构建、单元测试及 Linux Chromium 浏览器测试，浏览器测试采用模拟 DSH adapter，不代表真实客户端集成测试。

## 数据与安全边界

原生容器使用 DSH React/Slot API；内置模板和用户 TSX 页面共用离线 Sucrase 编译及 iframe 运行机制。CSP 限制常规网络连接、外部脚本、子框架和表单提交，宿主消息检查来源、token、参数和作用域。预览使用独立数据且不会发起真实会话。自定义页面默认无法读取工作区及会话元数据，授权仅在当前页面生命周期内有效，宿主导航需用户确认。

当前为实验性沙箱，未经安全审计，不能视为完整网络隔离。浏览器自导航、资源耗尽、Electron 集成差异仍需验证；未开放文件系统、shell、任意 RPC、网络代理或凭据接口。AI 使用 DSH 已配置的模型，不额外调用远程模型服务。

工作台定义、版本及 JSON 业务数据保存在当前客户端 origin 的 localStorage 中，清理客户端存储会丢失数据；暂不支持账户同步或多窗口并发编辑。导出只包含页面定义，不包含业务数据或历史记录。名称、数量、数据和版本均有限额，存储失败会保留上一次成功保存的状态。

真实环境验收建议：安装 → 左侧入口与默认启动 → 明暗主题及工作区/会话 → 内网模型定制 → 预览、发布、恢复及持久化 → 断网与安全验证。

第三方组件许可见 [THIRD_PARTY.md](THIRD_PARTY.md)。
