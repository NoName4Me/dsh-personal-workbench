# Personal Workbench / 个人工作台

基于 DeepSeek Harness Web/Desktop 插件机制的可定制工作台。目标版本：DSH dsh-v0.2.3-alpha.2。

## 使用

从 GitHub Actions 下载构建产物中的 tgz，在 DSH 插件管理中安装本地包；内网分发只需要预构建产物，无需下载 React、shadcn/ui 或编译器。实际 DSH 安装、Windows 客户端和内网模型仍需验收，当前为技术预览。

- 左侧打开「个人工作台」。通用模板包含原生会话入口、常用能力、工作区及会话提醒。启动打开可在管理中关闭。
- 管理工作台：创建、复制、删除、切换、设为默认、导入导出。内置通用、项目、工具及空白模板。
- 定制：描述需求并打开 DSH 原生会话，发送预填内容，完成后返回工作台，导入最新 AI 结果或粘贴完整 TSX；运行交互预览，保存历史快照或发布。
- 历史恢复会先载入草稿并预览，确认后发布；业务数据不随版本回滚。
- 用户自定义页面只使用 react 与 @workbench/ui 导入。SDK 见 skills/workbench-dev/SKILL.md。

## 边界与数据

原生插件容器使用 DSH React/Slot API。自定义 TSX 经离线 Sucrase 转译，在无同源权限的 iframe 中运行；CSP 禁止常规网络连接、外部脚本、子框架、表单提交等，宿主消息检查来源、token、参数与范围。预览不发起真实会话，数据独立；自定义页面默认不接收工作区/会话元数据，授权仅在当前页面生命周期有效，调用宿主导航需用户确认。内置模板使用相同运行器。

这不是经过审计的安全沙箱。浏览器自导航、资源耗尽、Electron 集成差异等仍需真实环境验证，不应将不可信源码或敏感数据直接投入生产；未开放文件系统、shell、任意 RPC、网络代理和凭据接口。不要把 iframe/CSP 视为全面的网络隔离。AI 使用 DSH 配置的模型，无独立远程模型服务。

工作台定义、快照及 JSON 业务数据保存在客户端当前 origin 的 localStorage；不等同于宿主文件系统或账户同步。清理客户端存储会丢失数据。导出只包含页面定义，不包含业务数据或历史记录。名称/数量/数据/版本有上限；达到浏览器配额时会显示保存失败，不覆盖上一个已保存状态。当前不支持多窗口并发编辑与数据同步。

## 开发与验收

- pnpm install --no-frozen-lockfile
- pnpm --filter dsh-personal-workbench check
- pnpm --filter dsh-personal-workbench test
- pnpm --filter dsh-personal-workbench build
- pnpm --filter dsh-personal-workbench exec playwright install chromium
- pnpm --filter dsh-personal-workbench test:browser
- pnpm --filter dsh-personal-workbench pack

CI 覆盖 Windows/Linux 编译、单元测试、包构建；浏览器主流程使用模拟 DSH adapter，不代表真实 DSH 已验收。

真实环境验收顺序：安装本地包 → 检查左侧入口与默认启动 → 检查亮暗主题与工作区/Session → 发起真实会话 → 使用内网模型生成 TSX 并导入 → 预览、发布、回滚、持久化 → 断网验证 → 安全测试。记录 DSH 版本与错误日志，不修改宿主客户端。

