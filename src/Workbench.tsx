import React from "react"
import { ArrowLeft, ChevronDown, Code2, Download, History, Plus, Save, Upload, WandSparkles } from "lucide-react"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { Input } from "./ui/input"
import { Checkbox } from "./ui/checkbox"
import { ChoiceSelect, ConfirmDialog } from "./ui/controls"
import { PortalContext } from "./ui/portal"
import { Sandbox } from "./Sandbox"
import { TemplatePreview } from "./TemplatePreview"
import { compile, extractSource } from "./compile"
import { initialState, TEMPLATES, isBuiltin } from "./templates"
import { loadState, storeState, newBoard, replaceBoard, deleteBoard, saveDraft, publishDraft, editVersion, published, exportBoard, importBoard, MAX_BOARDS, MAX_SOURCE, type Board, type State } from "./model"
import type { ContextData } from "./protocol"
import type { Status, UseSessionStatus, WorkbenchProps } from "./host"

const EMPTY_DATA: Record<string,unknown>={}
const NO_CONTEXT:ContextData={workspaces:[],sessions:[],locale:"zh"}
const NO_STATUSES:ReadonlyMap<string,Status>=new Map()
function useNoSessionStatus<T>(select:(snapshot:ReadonlyMap<string,Status>)=>T):T{return select(NO_STATUSES)}
type Mode="home"|"manage"|"edit"
type Action={type:"start";id?:string;prompt?:string}|{type:"open";id:string}
function aiPrompt(source:string,request:string){
 return [
 "你正在修改 DSH Personal Workbench 的 React/TSX 页面。请遵循 workbench-dev Skill。只输出完整 TSX 源码（一个代码块），不要创建插件、读写文件或执行命令。",
 "可导入 react 和 @workbench/ui。后者提供 Page, Section, Panel, Stack, Button, Textarea, Input, Checkbox, ChoiceSelect, Tabs, TabsList, TabsTrigger, TabsContent, Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger, Field, Composer, QuickActions, Workspaces, RecentWork, Checklist, GeneralPage, ProjectPage, ToolsPage, useWorkbench, useStored。",
 "必须 export default function App()。useWorkbench() 返回 workspaces、sessions、data、save(patch)、start(workspaceId?,prompt?)、open(sessionId)、preview、locale。useStored(key,initial) 返回 [value,setValue]。不使用网络、外部依赖或宿主 API。默认继承 DSH 主题，优先使用成熟内置组件（选择器、弹窗、复选框不要自行实现）。用户指定的风格可以覆盖默认样式，使用 React style 或页面局部 CSS；运行时没有动态 Tailwind 编译。保存业务数据时使用 useStored，避免存储敏感信息。",
 "当前源码：",source,"修改要求：",request
 ].join("\n\n")
}
function download(name:string,text:string){
 const u=URL.createObjectURL(new Blob([text],{type:"application/json"}))
 const a=document.createElement("a");a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)
}
export function Workbench({useWorkspaces,useSessions,useSessionStatus=useNoSessionStatus as UseSessionStatus,startSession,openSession,askAI,readAI,t}:WorkbenchProps){
 const [boot]=React.useState(()=>{try{const state=loadState(localStorage,initialState);return {state,error:""}}catch(e){return {state:initialState(),error:String(e)}}})
 const [state,setState]=React.useState(()=>{try{const saved=sessionStorage.getItem("dsh-workbench:resume");if(saved&&boot.state.boards.some(b=>b.id===saved))return {...boot.state,active:saved}}catch{}return {...boot.state,active:boot.state.defaultId}})
 const current=React.useRef(state)
 const [error,setError]=React.useState(boot.error)
 const [storageBlocked,setStorageBlocked]=React.useState(!!boot.error)
 const [mode,setMode]=React.useState<Mode>(()=>{try{return sessionStorage.getItem("dsh-workbench:resume")===state.active?"edit":"home"}catch{return "home"}})
 const [aiSession,setAiSession]=React.useState(()=>{try{return sessionStorage.getItem("dsh-workbench:ai-session:"+state.active)??""}catch{return ""}})
 const [aiBusy,setAiBusy]=React.useState(false)
 const [startup,setStartup]=React.useState(()=>{try{return localStorage.getItem("dsh-workbench:startup")!=="off"}catch{return true}})
 const aiAbort=React.useRef<AbortController|null>(null)
 React.useEffect(()=>()=>aiAbort.current?.abort(),[])
 const [request,setRequest]=React.useState("")
 const [versionLabel,setVersionLabel]=React.useState("")
 const [title,setTitle]=React.useState("")
 const [preview,setPreview]=React.useState<{source:string;nonce:number}|null>(null)
 const [previewStatus,setPreviewStatus]=React.useState<"loading"|"ready"|"error">("loading")
 const [runtimeError,setRuntimeError]=React.useState("")
 const [previewData,setPreviewData]=React.useState<Record<string,unknown>>({})
 const [grant,setGrant]=React.useState("")
 const [action,setAction]=React.useState<Action|null>(null)
 const [portal,setPortal]=React.useState<HTMLDivElement|null>(null)
 const [confirmation,setConfirmation]=React.useState<{description:string;run:()=>void;destructive?:boolean}|null>(null)
 const [aiWorkspace,setAiWorkspace]=React.useState("")
 const fileRef=React.useRef<HTMLInputElement>(null)
 const workspaces=useWorkspaces(s=>s.items)
 const archived=useWorkspaces(s=>s.archivedSessionIds)
 const sessions=useSessions(s=>s)
 const statuses=useSessionStatus(s=>s)
 const context=React.useMemo<ContextData>(()=>{
   const ws=workspaces.map(w=>({id:w.workspaceId,title:w.title||t("unnamed")}))
   const archivedIds=new Set(archived??[])
   const owners=new Map(workspaces.flatMap(w=>(w.sessionIds??[]).map(s=>[s,w.workspaceId] as const)))
   const rows=sessions.ids.flatMap(id=>{const s=sessions.byId[id];if(!s||s.blank||s.origin==="subagent"||archivedIds.has(id))return [];const status=statuses.get(id);return [{id,title:s.title||s.displayTitle||t("unnamed"),workspaceId:owners.get(id),updatedAt:s.updatedAt??0,status:status?.pendingInteraction?"attention" as const:status?.running||s.running?"running" as const:status?.completionUnread?"completed" as const:"idle" as const}]})
   rows.sort((a,b)=>b.updatedAt-a.updatedAt)
   return {workspaces:ws,sessions:rows.slice(0,100),locale:t("panel")==="Personal workbench"?"en":"zh"}
 },[workspaces,archived,sessions,statuses,t])
 const board=state.boards.find(b=>b.id===state.active)!
 const live=published(board)
 const builtin=!!live&&isBuiltin(live.source)
 const canRead=builtin||grant===board.id+":"+live?.id
 const liveContext=React.useMemo(()=>canRead?context:{...NO_CONTEXT,locale:context.locale},[canRead,context])
 const previewContext=React.useMemo(()=>({...NO_CONTEXT,locale:context.locale}),[context.locale])
 const selectedWorkspace=workspaces.some(w=>w.workspaceId===aiWorkspace)?aiWorkspace:workspaces[0]?.workspaceId
 function commit(fn:(s:State)=>State){
   if(storageBlocked){setError(t("storageBlocked"));return false}
   try{const next=fn(current.current);storeState(localStorage,next);current.current=next;setState(next);setError("");return true}catch(e){setError(String(e));return false}
 }
 function update(fn:(b:Board)=>Board){return commit(s=>replaceBoard(s,fn(s.boards.find(b=>b.id===s.active)!)))}
 function changeMode(next:Mode){aiAbort.current?.abort();setAiBusy(false);try{if(next==="edit"){sessionStorage.setItem("dsh-workbench:resume",current.current.active);setAiSession(sessionStorage.getItem("dsh-workbench:ai-session:"+current.current.active)??"")}else sessionStorage.removeItem("dsh-workbench:resume")}catch{}setMode(next);setAction(null);setRuntimeError("");if(next==="edit"){setPreview(null);setPreviewStatus("loading");setRequest("");setVersionLabel("")}}
 function select(id:string){if(commit(s=>({...s,active:id}))){setGrant("");changeMode("home")}}
 function create(template:string,name:string){if(commit(s=>{if(s.boards.length>=MAX_BOARDS)throw new Error(t("boardLimit"));const b=newBoard(name,template);return {...s,active:b.id,boards:[...s.boards,b]}}))changeMode("edit")}
 async function launchAI(){if(!selectedWorkspace||!request.trim())return;setAiBusy(true);try{const boardId=board.id;await askAI(selectedWorkspace,aiPrompt(board.draft,request.trim()),sessionId=>{sessionStorage.setItem("dsh-workbench:resume",boardId);sessionStorage.setItem("dsh-workbench:ai-session:"+boardId,sessionId);setAiSession(sessionId)})}catch(e){setError(String(e))}finally{setAiBusy(false)}}
 async function importAI(){if(!aiSession||aiBusy)return;if(sessions.byId[aiSession]?.running){setError(t("aiRunning"));return;}setAiBusy(true);const controller=new AbortController();aiAbort.current?.abort();aiAbort.current=controller;const boardId=board.id;try{const text=await readAI(aiSession,controller.signal);if(controller.signal.aborted)return;const source=extractSource(text);compile(source);if(!/export\s+default\b/.test(source))throw new Error(t("invalidAI"));commit(s=>replaceBoard(s,{...s.boards.find(b=>b.id===boardId)!,draft:source}));setPreview(null)}catch(e){if(!controller.signal.aborted)setError(String(e))}finally{if(!controller.signal.aborted)setAiBusy(false)}}
 function runPreview(){try{compile(board.draft);setPreviewData({});setPreviewStatus("loading");setRuntimeError("");setPreview(p=>({source:board.draft,nonce:(p?.nonce??0)+1}))}catch(e){setRuntimeError(String(e));setPreviewStatus("error")}}
 function requestAction(a:Action){if(builtin){perform(a);return}setAction(a)}
 function perform(a:Action){try{if(a.type==="open"){if(!context.sessions.some(s=>s.id===a.id))throw new Error(t("missingSession"));openSession(a.id)}else{if(a.id&&!context.workspaces.some(w=>w.id===a.id))throw new Error(t("missingWorkspace"));if(a.prompt&&!context.workspaces.length)throw new Error(t("emptyPrompt"));startSession(a.id,a.prompt)}setAction(null)}catch(e){setError(String(e));setAction(null)}}
 async function importFile(file:File){try{if(file.size>MAX_SOURCE*6)throw new Error(t("fileTooLarge"));const b=importBoard(await file.text());if(commit(s=>{if(s.boards.length>=MAX_BOARDS)throw new Error(t("boardLimit"));return {...s,active:b.id,boards:[...s.boards,b]}}))changeMode("edit")}catch(e){setError(String(e))}}
 const previewMatches=preview?.source===board.draft&&previewStatus==="ready"&&!runtimeError&&!!board.title.trim()
 const setAsDefault=()=>commit(s=>({...s,defaultId:board.id}))
 const back=()=>changeMode("home")
 return <PortalContext.Provider value={portal}><div className="dsh-wb wb-shell" ref={setPortal}>
 <header className="wb-toolbar">
   <div className="wb-toolbar-main">{mode!=="home"&&<Button variant="ghost" size="icon-sm" onClick={back} aria-label={t("back")}><ArrowLeft/></Button>}
   <span className="wb-brand">{t("panel")}</span>
   {mode==="home"?<ChoiceSelect label={t("selectBoard")} value={state.active} onChange={select} options={state.boards.map(b=>({value:b.id,label:b.title+(state.defaultId===b.id?" · "+t("defaultMark"):"")}))} className="wb-quiet-select wb-board-select"/>:<span className="wb-current">{board.title}</span>}</div>
   <div className="wb-toolbar-actions">{mode==="home"?<><Button size="sm" variant="ghost" onClick={()=>changeMode("manage")}>{t("manage")}</Button><Button size="sm" variant="outline" onClick={()=>changeMode("edit")}><WandSparkles/>{t("edit")}</Button></>:mode==="edit"?<><Button variant="outline" size="sm" onClick={()=>update(b=>saveDraft(b,versionLabel))}><Save/>{t("saveVersion")}</Button><Button size="sm" disabled={!previewMatches} onClick={()=>{if(update(b=>publishDraft(b,versionLabel))){setGrant("");back()}}}>{t("publish")}</Button></>:null}</div>
 </header>
 {error&&<div className="wb-notice" role="alert">{error}{storageBlocked?<><Button variant="outline" size="sm" onClick={()=>{const raw=localStorage.getItem("dsh-personal-workbench:state:v1");if(raw)download("workbench-recovery.json",raw)}}>{t("backup")}</Button><Button variant="outline" size="sm" onClick={()=>setConfirmation({description:t("resetConfirm"),destructive:true,run:()=>{try{const next=initialState();storeState(localStorage,next);current.current=next;setState(next);setStorageBlocked(false);setError("")}catch(e){setError(String(e))}}})}>{t("reset")}</Button></>:<Button size="sm" variant="ghost" onClick={()=>setError("")}>{t("dismiss")}</Button>}</div>}
 {mode==="home"&&<div className="wb-home">
   {!live?<div className="wb-content"><h1>{board.title}</h1><p className="wb-subtitle">{t("unpublished")}</p><Button className="mt-4" onClick={()=>changeMode("edit")}>{t("edit")}</Button></div>:<>
   {!builtin&&<div className="wb-permission"><span>{t("customNotice")}</span><Button size="sm" variant="outline" onClick={()=>{setAction(null);setGrant(canRead?"":board.id+":"+live.id)}}>{canRead?t("revoke"):t("grant")}</Button></div>}
   <Sandbox key={board.id+":"+live.id+":"+String(canRead)} source={live.source} context={liveContext} data={board.data} preview={false} onSave={data=>{if(JSON.stringify(data)!==JSON.stringify(board.data))update(b=>({...b,data}))}} onStart={(id,prompt)=>requestAction({type:"start",id,prompt})} onOpen={id=>requestAction({type:"open",id})} onStatus={()=>{}}/>
   </>}
 </div>}
 {mode==="manage"&&<main className="wb-content wb-manage">
   <div className="wb-heading"><div><h1>{t("manage")}</h1><p className="wb-subtitle">{t("manageHint")}</p><label className="wb-setting"><Checkbox aria-label={t("startup")} checked={startup} onCheckedChange={checked=>{try{localStorage.setItem("dsh-workbench:startup",checked===true?"on":"off");setStartup(checked===true)}catch(err){setError(String(err))}}}/>{t("startup")}</label></div><Button size="sm" variant="outline" onClick={()=>fileRef.current?.click()}><Upload/>{t("import")}</Button><input type="file" ref={fileRef} accept=".json,application/json" hidden onChange={e=>{const f=e.target.files?.[0];e.target.value="";if(f)void importFile(f)}}/></div>
   <section className="wb-section"><h2>{t("myBoards")}</h2>{state.boards.map(b=><div className="wb-board-row" key={b.id}><div className="wb-row-title"><strong>{b.title}</strong><small>{b.id===state.defaultId?t("defaultMark")+" · ":""}{published(b)?.label??t("unpublished")}</small></div><Button variant="ghost" size="sm" onClick={()=>select(b.id)}>{t("open")}</Button><Button variant="ghost" size="sm" onClick={()=>{if(commit(s=>({...s,active:b.id})))changeMode("edit")}}>{t("edit")}</Button><Button variant="ghost" size="sm" disabled={b.id===state.defaultId||!published(b)} onClick={()=>commit(s=>({...s,defaultId:b.id}))}>{t("setDefault")}</Button><Button variant="ghost" size="icon-sm" aria-label={t("export")} onClick={()=>download(b.title.replace(/[\\/:*?"<>|]/g,"_")+".workbench.json",exportBoard(b))}><Download/></Button><Button variant="ghost" size="sm" onClick={()=>create(published(b)?.source??b.draft,b.title+" · "+t("copy"))}>{t("copy")}</Button><Button variant="ghost" size="sm" onClick={()=>setConfirmation({description:t("deleteConfirm"),destructive:true,run:()=>{commit(s=>deleteBoard(s,b.id))}})} disabled={state.boards.length<=1}>{t("delete")}</Button></div>)}</section>
   <section className="wb-section"><h2>{t("newFromTemplate")}</h2><div className="wb-template-grid">{TEMPLATES.map(template=><button className="wb-template" key={template.id} onClick={()=>create(template.source,t("template_"+template.id))}><TemplatePreview kind={template.id}/><strong>{t("template_"+template.id)}</strong><small>{t("desc_"+template.id)}</small></button>)}</div></section>
 </main>}
 {mode==="edit"&&<div className="wb-studio">
   <section className="wb-preview-col"><div className="wb-sectionbar"><strong>{t("preview")}</strong><Button size="sm" variant="outline" onClick={runPreview}>{t("refreshPreview")}</Button></div>{runtimeError&&<div className="wb-notice" role="alert">{runtimeError}</div>}{preview?<Sandbox key={board.id+":"+preview.nonce} source={preview.source} context={previewContext} data={previewData} preview onSave={setPreviewData} onStart={()=>{}} onOpen={()=>{}} onStatus={(status,detail)=>{setPreviewStatus(status);setRuntimeError(detail??"")}}/>:<div className="wb-placeholder">{t("previewHint")}</div>}</section>
   <section className="wb-editor-col"><div className="wb-sectionbar"><strong>{t("edit")}</strong><small>{t("draft")}</small></div>
   <label className="wb-field">{t("boardName")}<Input value={board.title} maxLength={80} onChange={e=>update(b=>({...b,title:e.target.value}))}/></label>
   <label className="wb-field">{t("changeRequest")}<Textarea rows={3} value={request} onChange={e=>setRequest(e.target.value)} placeholder={t("changePlaceholder")}/></label>
   <label className="wb-field">{t("workspace")}<ChoiceSelect label={t("workspace")} value={selectedWorkspace??""} onChange={setAiWorkspace} disabled={!workspaces.length} placeholder={t("emptyPrompt")} options={workspaces.map(w=>({value:w.workspaceId,label:w.title||t("unnamed")}))} className="wb-editor-select"/></label>
   <Button size="sm" onClick={()=>void launchAI()} disabled={!request.trim()||!workspaces.length||aiBusy}><WandSparkles/>{t("askAI")}</Button>
   <p className="wb-help">{t("aiHandoff")}</p>
   {aiSession&&<div className="wb-inline"><Button variant="outline" size="sm" disabled={aiBusy} onClick={()=>void importAI()}>{t("importAI")}</Button><Button variant="ghost" size="sm" onClick={()=>openSession(aiSession)}>{t("returnAI")}</Button></div>}
   <label className="wb-field">{t("source")}<Textarea className="wb-code" spellCheck={false} value={board.draft} maxLength={MAX_SOURCE} onChange={e=>{const value=e.target.value;update(b=>({...b,draft:value}))}} rows={12}/></label>
   <Button variant="outline" size="sm" onClick={async()=>{try{const source=extractSource(await navigator.clipboard.readText());compile(source);update(b=>({...b,draft:source}))}catch(e){setError(String(e))}}}>{t("pasteCode")}</Button>
   <label className="wb-field">{t("versionLabel")}<Input value={versionLabel} onChange={e=>setVersionLabel(e.target.value)} maxLength={80}/></label>
   <div className="wb-sectionbar"><strong><History size={16}/> {t("history")}</strong>{live&&<Button size="sm" variant="ghost" onClick={setAsDefault} disabled={state.defaultId===board.id}>{t("setDefault")}</Button>}</div>
   {[...board.versions].reverse().map(v=><div key={v.id} className="wb-version"><div className="wb-row-title"><strong>{v.label}{v.id===board.published?" · "+t("live"):""}</strong><small>{new Date(v.createdAt).toLocaleString()}</small></div><Button size="sm" variant="ghost" onClick={()=>setConfirmation({description:t("restoreDraft"),run:()=>{update(b=>editVersion(b,v.id))}})}>{t("editVersion")}</Button><Button size="sm" variant="ghost" disabled={v.id===board.published} onClick={()=>setConfirmation({description:t("restoreConfirm"),run:()=>{if(update(b=>editVersion(b,v.id))){setPreviewData({});setPreviewStatus("loading");setRuntimeError("");setPreview(p=>({source:v.source,nonce:(p?.nonce??0)+1}))}}})}>{t("restore")}</Button></div>)}
   </section>
 </div>}
 <ConfirmDialog open={!!action||!!confirmation} title={t("confirmAction")} description={confirmation?.description??(action?.type==="open"?context.sessions.find(s=>s.id===action.id)?.title??"":action?.prompt||t("start"))} cancel={t("cancel")} confirm={t("confirm")} destructive={confirmation?.destructive} onCancel={()=>{setAction(null);setConfirmation(null)}} onConfirm={()=>{if(confirmation){setConfirmation(null);confirmation.run()}else if(action)perform(action)}}/>
 </div></PortalContext.Provider>
}
