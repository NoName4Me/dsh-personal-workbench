const zh={
 panel:"个人工作台",unnamed:"未命名",emptyPrompt:"请先在 DSH 中添加工作区。",start:"打开对话",edit:"定制",workspace:"工作区",defaultWorkspace:"沿用 DSH 默认工作区",
 back:"返回",selectBoard:"切换工作台",defaultMark:"默认",manage:"管理工作台",saveVersion:"保存版本",publish:"发布生效",backup:"备份原始数据",reset:"重置",dismiss:"关闭",
 storageBlocked:"本地存储不可用。请先备份或修复数据。",resetConfirm:"重置将删除本地工作台数据，确定继续？",boardLimit:"工作台数量达到上限。",fileTooLarge:"导入文件过大。",
 unpublished:"尚未发布",customNotice:"自定义页面默认无权读取工作区或会话信息。仅授权可信页面。",grant:"授权读取",revoke:"撤销授权",
 manageHint:"组织个人工作台、模板和历史版本。",import:"导入",export:"导出",myBoards:"我的工作台",open:"打开",setDefault:"设为默认",delete:"删除",deleteConfirm:"删除此工作台及其本地数据？",
 newFromTemplate:"从模板创建",template_general:"通用工作台",template_project:"项目工作台",template_tools:"工具工作台",template_blank:"空白工作台",
 desc_general:"对话、常用能力与近期工作",desc_project:"工作区与任务状态",desc_tools:"常用工具与个人清单",desc_blank:"从简单 React 页面开始",
 preview:"交互预览",refreshPreview:"运行预览",previewHint:"运行草稿以预览；预览使用隔离数据，不会发起真实会话。",draft:"草稿",boardName:"工作台名称",changeRequest:"修改需求",changePlaceholder:"例如：新增一个月末倒计时组件",askAI:"在 DSH 中请 AI 修改",aiHandoff:"在 DSH 原生会话中发送预填需求，完成后返回这里，导入 AI 结果并运行预览。你也可以粘贴源码。",importAI:"导入 AI 最新结果",returnAI:"返回 AI 会话",invalidAI:"AI 未返回完整的默认导出 TSX 模块。",startup:"启动时打开个人工作台",
 source:"工作台源码（TSX）",pasteCode:"从剪贴板导入 AI 代码",versionLabel:"版本说明（可选）",history:"历史版本",live:"生效中",editVersion:"继续编辑",restore:"恢复生效",restoreDraft:"用该版本替换当前编辑草稿？",restoreConfirm:"将该快照设为生效版本？业务数据不会回滚。",
 confirmAction:"确认工作台操作",cancel:"取消",confirm:"确认",missingSession:"会话已不可用。",missingWorkspace:"工作区已不可用。"
}
const en:Record<keyof typeof zh,string>={
 panel:"Personal workbench",unnamed:"Untitled",emptyPrompt:"Add a workspace in DSH first.",start:"Open conversation",edit:"Customize",workspace:"Workspace",defaultWorkspace:"Use DSH default workspace",
 back:"Back",selectBoard:"Switch workbench",defaultMark:"Default",manage:"Manage",saveVersion:"Save version",publish:"Publish",backup:"Back up raw data",reset:"Reset",dismiss:"Dismiss",
 storageBlocked:"Local storage is unavailable. Back up or repair it first.",resetConfirm:"Reset and delete local workbench data?",boardLimit:"Workbench limit reached.",fileTooLarge:"Import file is too large.",
 unpublished:"Not published",customNotice:"Custom pages cannot read workspace or session metadata by default. Grant only to trusted pages.",grant:"Grant access",revoke:"Revoke",
 manageHint:"Organize your workbenches, templates and versions.",import:"Import",export:"Export",myBoards:"My workbenches",open:"Open",setDefault:"Set default",delete:"Delete",deleteConfirm:"Delete this workbench and its local data?",
 newFromTemplate:"Create from template",template_general:"General",template_project:"Projects",template_tools:"Tools",template_blank:"Blank",
 desc_general:"Conversations, quick actions and recent work",desc_project:"Workspaces and task status",desc_tools:"Quick tools and personal checklist",desc_blank:"Start from a simple React page",
 preview:"Interactive preview",refreshPreview:"Run preview",previewHint:"Run the draft to preview it with isolated data; no real sessions will be launched.",draft:"Draft",boardName:"Name",changeRequest:"Change request",changePlaceholder:"For example, add a countdown to month end",askAI:"Ask AI in DSH",aiHandoff:"Send the prepared request in DSH, then return here to import the latest result and preview it. You can also paste source.",importAI:"Import latest AI result",returnAI:"Return to AI session",invalidAI:"AI did not return a complete default-export TSX module.",startup:"Open workbench at startup",
 source:"Workbench source (TSX)",pasteCode:"Import AI code from clipboard",versionLabel:"Version description (optional)",history:"Versions",live:"Published",editVersion:"Edit version",restore:"Restore",restoreDraft:"Replace the current draft with this version?",restoreConfirm:"Make this snapshot live? Business data will not be rolled back.",
 confirmAction:"Confirm workbench action",cancel:"Cancel",confirm:"Confirm",missingSession:"Session no longer available.",missingWorkspace:"Workspace no longer available."
}
export {zh,en}
