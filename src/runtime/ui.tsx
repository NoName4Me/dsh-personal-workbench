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
import { ShortcutLibrary,Suggestions } from "./office"
import { ProjectManager } from "./projects"
export { ShortcutLibrary,Suggestions,ProjectManager }
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
 const submit=()=>selected===DEFAULT?ctx.personal(prompt.trim()||undefined):ctx.start(selected,prompt.trim()||undefined)
 const disabled=false
 return <div className="wb-composer">
  <Textarea aria-label={t("工作需求","Task")} placeholder={t("描述你需要完成的工作…","Describe what you need to do…")} value={prompt} onChange={e=>setPrompt(e.target.value)} rows={3} className="wb-composer-input" onKeyDown={e=>{if((e.metaKey||e.ctrlKey)&&e.key==="Enter"&&!e.nativeEvent.isComposing&&!disabled){e.preventDefault();submit()}}}/>
  <div className="wb-composer-footer"><div className="wb-composer-target"><Folder size={16} aria-hidden="true"/><ChoiceSelect label={t("工作区","Workspace")} value={selected} onChange={setTarget} options={[{value:DEFAULT,label:t("个人助手","Personal assistant")},...ctx.workspaces.map(w=>({value:w.id,label:w.title}))]} className="wb-quiet-select"/></div><Button type="button" onClick={submit} size="sm" disabled={disabled}>{t("打开对话","Open conversation")}<ArrowUpRight/></Button></div>
  {selected===DEFAULT&&<p className="wb-empty wb-onboarding">{t("个人助手可读取你明确授权的近期会话；修改业务文件请选择工作区。","Personal assistant reads only approved conversations. Choose a workspace for file changes.")}</p>}
 </div>
}
export function QuickActions(){return <ShortcutLibrary compact/>}
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
 const add=()=>{if(value.trim()){setList([...items,{id:String(Date.now()),text:value.trim().slice(0,300),done:false}]);setValue("")}}
 return <Section title={t("个人清单","Personal checklist")}><p className="wb-section-note">{t("只记录自己的事项。","Keep track of your own tasks.")} {items.length>0&&t("已完成 "+items.filter(x=>x.done).length+"/"+items.length,items.filter(x=>x.done).length+"/"+items.length+" done")}</p>
  <div className="wb-inline"><Input aria-label={t("新事项","New item")} placeholder={t("添加一项待办…","Add a task…")} value={value} onChange={e=>setValue(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.nativeEvent.isComposing){e.preventDefault();add()}}}/><Button type="button" onClick={add} variant="outline" size="icon-sm" aria-label={t("添加","Add")} disabled={!value.trim()}><Plus/></Button></div>
  {items.map(x=><div key={x.id} className="wb-check-row"><label className={x.done?"wb-task-done":undefined}><Checkbox aria-label={x.text} checked={!!x.done} onCheckedChange={()=>setList(items.map(i=>i.id===x.id?{...i,done:!i.done}:i))}/><span>{x.text}</span></label><Button variant="ghost" size="icon-sm" aria-label={t("删除","Delete")+" "+x.text} onClick={()=>setList(items.filter(i=>i.id!==x.id))}><X/></Button></div>)}
 </Section>
}
export function GeneralPage(){
 const t=useCopy(),ctx=useWorkbench()
 const attention=ctx.sessions.filter(s=>s.status==="attention"||s.status==="completed").slice(0,5)
 const recent=ctx.sessions.filter(s=>!attention.some(a=>a.id===s.id)).slice(0,8)
 return <Page title={t("今天做什么？","What are you working on?")} description={t("开始新的工作，继续手头任务。","Start something new or pick up where you left off.")} className="wb-general-page">
 <Composer/><Suggestions/><ShortcutLibrary compact/>
 <div className="wb-general-lower"><div className="wb-main-column">{attention.length>0&&<Section title={t("需要关注","Needs attention")}><SessionRows rows={attention}/></Section>}<Section title={t("继续工作","Recent work")}><SessionRows rows={recent}/></Section></div><aside className="wb-side-column"><Checklist/><Workspaces/></aside></div>
 </Page>
}
export function ProjectPage(){return <ProjectManager/>}
export function ToolsPage(){
 const t=useCopy()
 return <Page title={t("我的工具","My tools")} description={t("把重复的工作整理成自己的操作入口。","Organize recurring tasks into your own actions.")} className="wb-tools-page">
 <div className="wb-tools-layout"><div><ShortcutLibrary/><Composer/></div><aside className="wb-side-column"><Checklist/><Suggestions/></aside></div>
 </Page>
}
