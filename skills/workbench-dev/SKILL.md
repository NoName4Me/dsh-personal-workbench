---
name: workbench-dev
description: Develop or modify a DSH Personal Workbench TSX page with its built-in offline runtime.
---
# Workbench development
Return a complete TSX module with a default React component. Use only react and @workbench/ui imports. Do not modify DSH plugins, write files, install packages or invoke commands for this task. Keep existing functionality unless the user requests a change.

Components: Page(title,description), Section(title), Panel, Stack, Button, Textarea, Input, Checkbox, ChoiceSelect(label,value,options,onChange), Select/SelectTrigger/SelectValue/SelectContent/SelectItem, Dialog/DialogTrigger/DialogContent/DialogTitle/DialogDescription/DialogFooter/DialogClose, Tabs/TabsList/TabsTrigger/TabsContent, Field(label,value,onChange,placeholder), Composer, QuickActions, Workspaces, RecentWork(attention?), Checklist, GeneralPage, ProjectPage, ToolsPage.
Hooks: useWorkbench() returns workspaces, sessions, locale, preview, data, save(patch), start(workspaceId?,prompt?), open(sessionId). useStored(key,initial) returns a value and setter for local JSON state. No file, network, shell or external imports. Custom pages receive no workspace data unless the user grants it. Preview never launches a real session. The host confirms custom page navigation.
Default to DSH's typography, semantic tokens and geometry. Use the packaged shadcn/Radix controls, not native select or hand-built dialogs. Keep labels accessible, align peers, and prefer clear spacing over decorative cards. Preserve existing style for small changes. If the user requests another visual style, honor it within the page using React style props or scoped CSS in a style element; there is no runtime Tailwind compiler. Use --wb-bg, --wb-fg, --wb-muted, --wb-muted-fg, --wb-border, --wb-primary, --wb-primary-fg and --wb-radius-* as default tokens. Do not load remote assets or component frameworks.
Example:
```tsx
import React from "react"
import { Page, Section, Button, useStored } from "@workbench/ui"
export default function App() {
  const [count,setCount]=useStored("count",0)
  return <Page title="我的工作台"><Section title="计数"><Button onClick={()=>setCount(count+1)}>{count}</Button></Section></Page>
}
```
