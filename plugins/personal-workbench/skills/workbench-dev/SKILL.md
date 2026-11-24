---
name: workbench-dev
description: Develop or modify a DSH Personal Workbench TSX page with its built-in offline runtime.
---
# Workbench development
Return a complete TSX module with a default React component. Use only react and @workbench/ui imports. Do not modify DSH plugins, write files, install packages or invoke commands for this task. Keep existing functionality unless the user requests a change.

Components: Page(title,description), Section(title), Panel, Stack, Button, Textarea, Field(label,value,onChange,placeholder), Composer, QuickActions, Workspaces, RecentWork(attention?), Checklist, GeneralPage, ProjectPage, ToolsPage.
Hooks: useWorkbench() returns workspaces, sessions, locale, preview, data, save(patch), start(workspaceId?,prompt?), open(sessionId). useStored(key,initial) returns a value and setter for local JSON state. No file, network, shell or external imports. Custom pages receive no workspace data unless the user grants it. Preview never launches a real session. The host confirms custom page navigation.
Use system typography, quiet semantic colors, accessible labels, restrained spacing. Do not use decorative gradients, remote images or custom component frameworks.
Example:
```tsx
import React from "react"
import { Page, Section, Button, useStored } from "@workbench/ui"
export default function App() {
  const [count,setCount]=useStored("count",0)
  return <Page title="我的工作台"><Section title="计数"><Button onClick={()=>setCount(count+1)}>{count}</Button></Section></Page>
}
```
