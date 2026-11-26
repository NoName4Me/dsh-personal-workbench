# DSH Personal Workbench · 个人工作台

为 [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/deepseek-harness) 提供可通过 AI 自主定制的个人首页。无需编程即可从模板开始组织工作，也可以将日常需求转化为可重复使用的个人界面。

> 当前为技术预览版，支持 DSH `v0.2.2-rc.5` 与 `v0.2.3-alpha.2`。尚未正式发布，真实 DSH Desktop 和内网模型仍待验收。请勿直接用于敏感业务数据。

## 功能

- **开箱即用**：个人首页、原生对话入口、常用办公能力、工作区、近期会话及任务提醒；基于近期活动的规则推荐，可编辑的办公快捷操作与个人清单。
- **多工作台**：通用、项目、工具和空白四种模板，支持新建、复制、切换、重命名、删除、设为默认及导入导出；项目模板独立维护项目、任务、优先级、期限及进度。
- **AI 定制**：在工作台内复用 DSH 原生定制会话，自动应用 AI 返回的页面到草稿并预览，确认后发布。
- **版本管理**：草稿、历史快照和生效版本相互独立；恢复历史版本不回滚业务数据。
- **离线运行**：组件和 TSX 编译器随插件打包，不依赖 CDN 或运行时 npm 下载。
- **视觉一致性**：继承 DSH 官方视觉规范及主题变量，使用 shadcn/ui（Radix）与 Lucide；通用、项目、工具模板分别采用首页、项目列表与可搜索工具布局，用户可自主覆盖页面风格。

## 本地开发（dev 模式）

使用 pnpm 10，并确保已全局安装受支持的 `dsh`。首次运行：

```bash
git clone https://github.com/NoName4Me/dsh-personal-workbench.git
cd dsh-personal-workbench
pnpm install
pnpm dev
```

`pnpm dev` 会构建 `dist/client.js`，把当前目录以 `link:` 方式安装到隔离的 `workbench-dev` profile，并启动 Web UI。首次运行会从现有 `web` profile 复制模型与 patch 配置，不修改原 `web` profile。默认端口 `5273`；`src/**` 改动会自动重建，已打开的页面通过 DSH client HMR 重载插件。

常用参数：

```bash
pnpm dev -- --profile web     # 装进真实的 web profile
pnpm dev -- --port 3080       # 指定端口
pnpm dev -- --no-open         # 不自动打开浏览器
pnpm dev -- --no-watch        # 只构建并启动
```

`index.js`、`cordis.patch.yml` 等宿主侧改动需要重新运行 `pnpm dev`。退出后插件仍保留在 `workbench-dev` profile 中，可再次启动或手动移除。

## 安装到 DSH

构建产物为 `dist/client.js`。在 DSH 插件管理界面加载本地插件目录；如果客户端需要安装包，手动执行 `pnpm pack` 并安装生成的 `dsh-personal-workbench-*.tgz`。安装后从左侧导航打开「个人工作台」。

启动时自动打开工作台可在工作台管理界面关闭。实际安装与离线部署兼容性仍需在目标客户端验证。

可选的本地检查：`pnpm check`（TypeScript）与 `pnpm test`（核心逻辑）。现阶段以完成需求、解决阻塞问题为主，待功能基本完成后集中进行真实客户端主流程验收；暂不配置 CI、自动化浏览器测试或自动发布。

## 定制工作台

打开「定制」或从模板创建，左侧自动运行草稿预览；右侧创建专用定制会话，发送预填任务后可连续对话，完成的页面源码自动应用至草稿。保存版本或发布前先确认预览。工作台日常发起的对话直接使用 DSH 原生会话，顶部提供返回工作台入口。

历史版本可载入草稿、预览并重新发布。开发指引及可用组件见 [workbench-dev Skill](skills/workbench-dev/SKILL.md)。

## 数据与安全边界

原生容器使用 DSH React/Slot API；内置模板和用户 TSX 页面共用离线 Sucrase 编译及 iframe 运行机制。CSP 限制常规网络连接、外部脚本、子框架和表单提交，宿主消息检查来源、token、参数和作用域。预览使用独立数据且不会发起真实会话。自定义页面默认无法读取工作区及会话元数据，授权仅在当前页面生命周期内有效，宿主导航需用户确认。

当前为实验性沙箱，未经安全审计，不能视为完整网络隔离。浏览器自导航、资源耗尽、Electron 集成差异仍需验证；未开放文件系统、shell、任意 RPC、网络代理或凭据接口。AI 使用 DSH 已配置的模型，不额外调用远程模型服务。

工作台定义、版本及 JSON 业务数据保存在当前客户端 origin 的 localStorage 中，清理客户端存储会丢失数据；暂不支持账户同步或多窗口并发编辑。导出只包含页面定义，不包含业务数据或历史记录。名称、数量、数据和版本均有限额，存储失败会保留上一次成功保存的状态。

真实环境验收建议：安装 → 左侧入口与默认启动 → 明暗主题及工作区/会话 → 内网模型定制 → 预览、发布、恢复及持久化 → 断网与安全验证。

第三方组件许可见 [THIRD_PARTY.md](THIRD_PARTY.md)。
