import React from "react"
import { ArrowUpRight, FilePenLine, FileSearch, Folder, Files, Table2, Clock, Check, CircleAlert, MessageSquare, Plus, X, Search, ArrowRight, Circle, LayoutList } from "lucide-react"
import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"
import { Input } from "../ui/input"
import { Checkbox } from "../ui/checkbox"
import { ChoiceSelect } from "../ui/controls"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs"
import { useWorkbench, useStored } from "./sdk"
import type {SessionInfo} from "../protocol"
export { Button, Textarea, Input, Checkbox, ChoiceSelect, Tabs, TabsList, TabsTrigger, TabsContent, useWorkbench, useStored }
export { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "../ui/select"
export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "../ui/dialog"

export function Page({title,description,children,className}:{title:string;description?:string;children?:React.ReactNode;className?:string}){
 return <main className={["wb-content",className].filter(Boolean).join(" ")}><header className="wb-page-heading"><h1>{title}</h1>{description&&<p className="wb-subtitle">{description}</p>}</header>{children}</main>
}
export function Section({title,children}:{title:string;children?:React.ReactNode}){return <section className="wb-section"><h2>{title}</h2>{children}</section>}
export function Panel({children}:{children?:React.ReactNode}){return <div className="wb-panel">{children}</div>}
export function Stack({children}:{children?:React.ReactNode}){return <div className="wb-stack">{children}</div>}
export function Field({label,value,onChange,placeholder}:{label:string;value:string;onChange:(value:string)=>void;placeholder?:string}){return <label className="wb-field">{label}<Input value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/></label>}
function useCopy(){const {locale}=useWorkbench();return (zh:string,en:string)=>locale==="en"?en:zh}
type Copy=ReturnType<typeof useCopy>
const DEFAULT="@default"
export function Composer(){
 const ctx=useWorkbench(),t=useCopy()
 const [prompt,setPrompt]=React.useState(""),[target,setTarget]=React.useState(DEFAULT)
 const selected=ctx.workspaces.some(w=>w.id===target)?target:DEFAULT
 const submit=()=>ctx.start(selected===DEFAULT?undefined:selected,prompt.trim()||undefined)
 const disabled=!ctx.workspaces.length&&!!prompt.trim()
 return <form className="wb-composer" onSubmit={e=>{e.preventDefault();if(!disabled)submit()}}>
  <Textarea aria-label={t("工作需求","Task")} placeholder={t("描述你需要完成的工作…","Describe what you need to do…")} value={prompt} onChange={e=>setPrompt(e.target.value)} rows={3} className="wb-composer-input" onKeyDown={e=>{if((e.metaKey||e.ctrlKey)&&e.key==="Enter"&&!e.nativeEvent.isComposing&&!disabled){e.preventDefault();submit()}}}/>
  <div className="wb-composer-footer"><div className="wb-composer-target"><Folder size={16} aria-hidden="true"/><ChoiceSelect label={t("工作区","Workspace")} value={selected} onChange={setTarget} options={[{value:DEFAULT,label:t("默认工作区","Default workspace")},...ctx.workspaces.map(w=>({value:w.id,label:w.title}))]} className="wb-quiet-select"/></div><Button type="submit" size="sm" disabled={disabled}>{t("打开对话","Open conversation")}<ArrowUpRight/></Button></div>
  {!ctx.workspaces.length&&<p className="wb-empty wb-onboarding">{t("通过 DSH 侧栏添加工作区，即可带入任务描述。","Add a workspace from the DSH sidebar to prefill a task.")}</p>}
 </form>
}
function actions(t:Copy){return [
 {label:t("材料撰写","Write documents"),description:t("报告、通知、总结","Reports, notices, summaries"),hint:t("请协助我撰写材料，先确认用途、受众和资料。","Help me write a document; clarify purpose, audience and materials."),Icon:FilePenLine},
 {label:t("表格处理","Spreadsheets"),description:t("核对、汇总、分析","Compare, summarize, analyze"),hint:t("请协助我处理表格，先确认文件、操作和输出。","Help me process a spreadsheet; clarify inputs and output."),Icon:Table2},
 {label:t("文档分析","Analyze documents"),description:t("阅读、提炼、解读","Read, extract, interpret"),hint:t("请协助我分析文档，先确认资料和目标。","Help me analyze documents; clarify sources and objective."),Icon:FileSearch},
 {label:t("文件整理","Organize files"),description:t("分类、归档、命名","Classify, archive, rename"),hint:t("请协助整理文件，修改文件前请确认规则。","Help me organize files; confirm rules before changes."),Icon:Files}
]}
export function QuickActions(){const ctx=useWorkbench(),t=useCopy();return <Section title={t("常用能力","Quick actions")}><div className="wb-actions">{actions(t).map(({label,hint,Icon})=><Button key={label} variant="outline" className="wb-quick-action" disabled={!ctx.workspaces.length} onClick={()=>ctx.start(undefined,hint)}><Icon/>{label}</Button>)}</div></Section>}
export function Workspaces(){const ctx=useWorkbench(),t=useCopy();return <Section title={t("工作区","Workspaces")}>{ctx.workspaces.length?<div className="wb-workspaces">{ctx.workspaces.map(w=><Button key={w.id} variant="ghost" className="wb-workspace-row" onClick={()=>ctx.start(w.id)}><Folder/><span className="truncate">{w.title}</span><ArrowUpRight className="ml-auto"/></Button>)}</div>:<p className="wb-empty">{t("暂无工作区","No workspaces")}</p>}</Section>}
function statusLabel(s:SessionInfo,t:Copy){return s.status==="attention"?t("待确认","Needs input"):s.status==="running"?t("进行中","Running"):s.status==="completed"?t("未读更新","Unread update"):t("历史会话","History")}
function SessionRows({rows}:{rows:SessionInfo[]}){
 const ctx=useWorkbench(),t=useCopy()
 return rows.length?<div className="wb-session-list">{rows.map(s=>{const Icon=s.status==="attention"?CircleAlert:s.status==="running"?Clock:s.status==="completed"?Check:MessageSquare;return <Button variant="ghost" className="wb-session-row" key={s.id} onClick={()=>ctx.open(s.id)}><Icon className="wb-row-icon"/><span className="wb-session-title">{s.title}<small>{ctx.workspaces.find(w=>w.id===s.workspaceId)?.title??""}</small></span><span className="wb-status" data-status={s.status}>{s.status==="idle"?"":statusLabel(s,t)}</span><ArrowUpRight className="wb-row-arrow"/></Button>})}</div>:<p className="wb-empty wb-list-empty">{t("暂无会话","No conversations")}</p>
}
export function RecentWork({attention=false}:{attention?:boolean}){const ctx=useWorkbench(),t=useCopy();const rows=ctx.sessions.filter(s=>!attention||s.status==="attention"||s.status==="completed").slice(0,attention?5:8);if(attention&&!rows.length)return null;return <Section title={attention?t("需要关注","Needs attention"):t("继续工作","Recent work")}><SessionRows rows={rows}/></Section>}
export function Checklist(){
 const t=useCopy(),[list,setList]=useStored<{id:string;text:string;done:boolean}[]>("checklist",[]),[value,setValue]=React.useState("")
 const items=Array.isArray(list)?list.filter(x=>x&&typeof x.id==="string"&&typeof x.text==="string"):[]
 return <Section title={t("个人清单","Personal checklist")}><p className="wb-section-note">{t("只记录自己的事项。","Keep track of your own tasks.")} {items.length>0&&t("已完成 "+items.filter(x=>x.done).length+"/"+items.length,items.filter(x=>x.done).length+"/"+items.length+" done")}</p>
  <form className="wb-inline" onSubmit={e=>{e.preventDefault();if(value.trim()){setList([...items,{id:String(Date.now()),text:value.trim().slice(0,300),done:false}]);setValue("")}}}><Input aria-label={t("新事项","New item")} placeholder={t("添加一项待办…","Add a task…")} value={value} onChange={e=>setValue(e.target.value)}/><Button type="submit" variant="outline" size="icon-sm" aria-label={t("添加","Add")} disabled={!value.trim()}><Plus/></Button></form>
  {items.map(x=><div key={x.id} className="wb-check-row"><label className={x.done?"wb-task-done":undefined}><Checkbox aria-label={x.text} checked={!!x.done} onCheckedChange={()=>setList(items.map(i=>i.id===x.id?{...i,done:!i.done}:i))}/><span>{x.text}</span></label><Button variant="ghost" size="icon-sm" aria-label={t("删除","Delete")+" "+x.text} onClick={()=>setList(items.filter(i=>i.id!==x.id))}><X/></Button></div>)}
 </Section>
}
export function GeneralPage(){
 const t=useCopy(),ctx=useWorkbench()
 const attention=ctx.sessions.filter(s=>s.status==="attention"||s.status==="completed").slice(0,5)
 const recent=ctx.sessions.filter(s=>!attention.some(a=>a.id===s.id)).slice(0,8)
 return <Page title={t("今天做什么？","What are you working on?")} description={t("发起新的工作，或继续已有任务。","Start something new or continue your work.")} className="wb-general-page">
  <Composer/><QuickActions/>
  <div className="wb-general-lower"><div className="wb-main-column">{attention.length>0&&<Section title={t("需要关注","Needs attention")}><SessionRows rows={attention}/></Section>}<Section title={t("继续工作","Recent work")}><SessionRows rows={recent}/></Section></div><aside className="wb-side-column"><Workspaces/></aside></div>
 </Page>
}
export function ProjectPage(){
 const t=useCopy(),ctx=useWorkbench(),[target,setTarget]=React.useState(DEFAULT),[query,setQuery]=React.useState("")
 const selected=ctx.workspaces.some(w=>w.id===target)?target:DEFAULT
 const rows=ctx.sessions.filter(s=>(selected===DEFAULT||s.workspaceId===selected)&&s.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
 const tabs=[{id:"all",name:t("全部","All"),rows},{id:"attention",name:t("待关注","Attention"),rows:rows.filter(s=>s.status==="attention"||s.status==="completed")},{id:"running",name:t("进行中","Running"),rows:rows.filter(s=>s.status==="running")}]
 return <Page title={t("项目工作台","Project workbench")} description={t("在一个视图中查看工作区和会话进度。","Review workspaces and conversation progress in one view.")} className="wb-project-page">
  <div className="wb-project-layout"><aside className="wb-project-nav"><h2>{t("工作区","Workspaces")}</h2><Button variant="ghost" className="wb-project-nav-row" aria-pressed={selected===DEFAULT} onClick={()=>setTarget(DEFAULT)}><LayoutList/>{t("全部工作区","All workspaces")}</Button>{ctx.workspaces.map(w=><Button key={w.id} variant="ghost" className="wb-project-nav-row" aria-pressed={selected===w.id} onClick={()=>setTarget(w.id)}><Folder/><span>{w.title}</span></Button>)}</aside>
  <div className="wb-project-main"><div className="wb-project-heading"><h2>{selected===DEFAULT?t("所有会话","All conversations"):ctx.workspaces.find(w=>w.id===selected)?.title}</h2><Button size="sm" onClick={()=>ctx.start(selected===DEFAULT?undefined:selected)}><Plus/>{t("新建对话","New conversation")}</Button></div>
  <div className="wb-search"><Search size={16}/><Input aria-label={t("搜索会话","Search conversations")} placeholder={t("搜索会话…","Search conversations…")} value={query} onChange={e=>setQuery(e.target.value)}/></div>
  <Tabs defaultValue="all"><TabsList variant="line" className="wb-project-tabs">{tabs.map(tab=><TabsTrigger key={tab.id} value={tab.id}>{tab.name}<span className="wb-tab-count">{tab.rows.length}</span></TabsTrigger>)}</TabsList>{tabs.map(tab=><TabsContent key={tab.id} value={tab.id}><SessionRows rows={tab.rows}/></TabsContent>)}</Tabs>
  </div></div>
 </Page>
}
export function ToolsPage(){
 const t=useCopy(),ctx=useWorkbench(),[query,setQuery]=React.useState("")
 const visible=actions(t).filter(a=>(a.label+" "+a.description).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
 return <Page title={t("我的工具","My tools")} description={t("找到适合当前工作的操作，直接开始。","Find an action and get to work.")} className="wb-tools-page">
 <div className="wb-tools-layout"><div><div className="wb-search wb-tool-search"><Search size={18}/><Input aria-label={t("搜索工具","Search tools")} placeholder={t("搜索工具或办公操作…","Search tools or actions…")} value={query} onChange={e=>setQuery(e.target.value)}/></div><Section title={t("办公操作","Office actions")}><div className="wb-tool-list">{visible.map(({label,description,hint,Icon})=><Button key={label} variant="ghost" className="wb-tool-row" disabled={!ctx.workspaces.length} onClick={()=>ctx.start(undefined,hint)}><span className="wb-tool-icon"><Icon/></span><span className="wb-tool-copy">{label}<small>{description}</small></span><ArrowRight className="wb-row-arrow"/></Button>)}{!visible.length&&<p className="wb-empty wb-list-empty">{t("没有匹配的工具","No matching tools")}</p>}</div></Section>{!ctx.workspaces.length&&<p className="wb-section-note">{t("先在 DSH 侧栏添加工作区。","Add a workspace in DSH first.")}</p>}</div><aside className="wb-side-column"><Checklist/></aside></div>
 </Page>
}
