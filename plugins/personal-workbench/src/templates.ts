import { newBoard, type State } from "./model"

export const GENERAL = 'import React from "react"\nimport { GeneralPage } from "@workbench/ui"\nexport default function App() { return <GeneralPage /> }'
export const PROJECT = 'import React from "react"\nimport { ProjectPage } from "@workbench/ui"\nexport default function App() { return <ProjectPage /> }'
export const TOOLS = 'import React from "react"\nimport { ToolsPage } from "@workbench/ui"\nexport default function App() { return <ToolsPage /> }'
export const BLANK = 'import React from "react"\nimport { Page, Button } from "@workbench/ui"\nexport default function App() { const [count,setCount]=React.useState(0); return <Page title="我的工作台"><Button onClick={()=>setCount(count+1)}>计数：{count}</Button></Page> }'
export const TEMPLATES = [{id:"general",title:"通用工作台",description:"AI 对话、常用办公能力和最近工作",source:GENERAL},{id:"project",title:"项目工作台",description:"工作区、待关注任务和会话",source:PROJECT},{id:"tools",title:"工具工作台",description:"常用能力与本地个人清单",source:TOOLS},{id:"blank",title:"空白工作台",description:"从简单 React 页面开始",source:BLANK}] as const
export function initialState():State {const b=newBoard("通用工作台",GENERAL,true);return {schema:1,active:b.id,defaultId:b.id,boards:[b]}}
export function isBuiltin(source:string){return source===GENERAL||source===PROJECT||source===TOOLS}
