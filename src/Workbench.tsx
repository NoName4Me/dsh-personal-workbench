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
import { compile } from "./compile"
import { useHostStore,type Candidate } from "./host-store"
import { Dialog,DialogContent,DialogTitle,DialogDescription,DialogFooter } from "./ui/dialog"
import { studioSessionIds } from "./ai"
import { initialState, TEMPLATES, isBuiltin } from "./templates"
import { newBoard, replaceBoard, deleteBoard, saveDraft, publishDraft, editVersion, published, exportBoard, importBoard, MAX_BOARDS, MAX_SOURCE, type Board, type State } from "./model"
import type { ContextData } from "./protocol"
import type { Status, UseSessionStatus, WorkbenchProps } from "./host"

const NO_CONTEXT:ContextData={workspaces:[],sessions:[],locale:"zh"}
const NO_STATUSES:ReadonlyMap<string,Status>=new Map()
function useNoSessionStatus<T>(select:(snapshot:ReadonlyMap<string,Status>)=>T):T{return select(NO_STATUSES)}
type Mode="home"|"manage"|"edit"|"conversation"
type Action={type:"start";id?:string;prompt?:string}|{type:"open";id:string}|{type:"personal";prompt?:string;recommend?:boolean}
type Chat={sessionId:string;prompt?:string;personal?:boolean;title:string}
type Scope={kind:"personal"|"workspace";prompt?:string;selected:string[];workspaceId:string;recommend?:boolean}
function download(name:string,text:string){
 const u=URL.createObjectURL(new Blob([text],{type:"application/json"}))
 const a=document.createElement("a");a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)
}
export function Workbench({useWorkspaces,useSessions,useSessionStatus=useNoSessionStatus as UseSessionStatus,createSession,renderStudio,t}:WorkbenchProps){
 const host=useHostStore()
 const {state,commit,ready,error,setError,snapshot}=host
 const [mode,setMode]=React.useState<Mode>("home")
 const [chat,setChat]=React.useState<Chat|null>(null)
 const [scope,setScope]=React.useState<Scope|null>(null)
 const [chatBusy,setChatBusy]=React.useState(false)
 const [studioPrompt,setStudioPrompt]=React.useState<string|undefined>()
 const [aiNotice,setAiNotice]=React.useState("")
 const aiGeneration=React.useRef(0)
 const [aiBusy,setAiBusy]=React.useState(false)
 const [aiSessionOverride,setAiSessionOverride]=React.useState<string|undefined>()
 const [startup,setStartup]=React.useState(()=>{try{return localStorage.getItem("dsh-workbench:startup")!=="off"}catch{return true}})
 React.useEffect(()=>()=>{aiGeneration.current++},[])
 const [request,setRequest]=React.useState("")
 const [versionLabel,setVersionLabel]=React.useState("")
 const [preview,setPreview]=React.useState<{source:string;nonce:number;candidate?:Candidate}|null>(null)
 const acknowledged=React.useRef(new Set<string>())
 const [previewStatus,setPreviewStatus]=React.useState<"loading"|"ready"|"error">("loading")
 const [runtimeError,setRuntimeError]=React.useState("")
 const [previewData,setPreviewData]=React.useState<Record<string,unknown>>({})
 const [grant,setGrant]=React.useState("")
 const [action,setAction]=React.useState<Action|null>(null)
 const [portal,setPortal]=React.useState<HTMLDivElement|null>(null)
 const [confirmation,setConfirmation]=React.useState<{description:string;run:()=>void;destructive?:boolean}|null>(null)
 const fileRef=React.useRef<HTMLInputElement>(null)
 const allWorkspaces=useWorkspaces(s=>s.items)
 const workspaces=React.useMemo(()=>allWorkspaces.filter(w=>!snapshot.internalWorkspaceIds?.includes(w.workspaceId)),[allWorkspaces,snapshot.internalWorkspaceIds])
 const archived=useWorkspaces(s=>s.archivedSessionIds)
 const sessions=useSessions(s=>s)
 const statuses=useSessionStatus(s=>s)
 const board=state.boards.find(b=>b.id===state.active)!
 const currentStudio=snapshot.builders.filter(x=>x.boardId===board.id).at(-1)?.sessionId??""
 const aiSession=aiSessionOverride??currentStudio
 const personalIds=React.useMemo(()=>new Set(snapshot.personal.map(x=>x.sessionId)),[snapshot.personal])
 const internalIds=React.useMemo(()=>new Set([...(snapshot.internalIds??[]),...studioSessionIds(localStorage)]),[snapshot.internalIds])
 const context=React.useMemo<ContextData>(()=>{
   const ws=workspaces.map(w=>({id:w.workspaceId,title:w.title||t("unnamed")}))
   const archivedIds=new Set(archived??[])
   const owners=new Map(workspaces.flatMap(w=>(w.sessionIds??[]).map(s=>[s,w.workspaceId] as const)))
   const rows=sessions.ids.flatMap(id=>{const s=sessions.byId[id];if(!s||s.blank||s.origin==="subagent"||archivedIds.has(id)||(internalIds.has(id)&&!personalIds.has(id)))return [];const status=statuses.get(id);return [{id,title:s.title||s.displayTitle||t("unnamed"),workspaceId:personalIds.has(id)?undefined:owners.get(id),updatedAt:s.updatedAt??0,status:status?.pendingInteraction?"attention" as const:status?.running||s.running?"running" as const:status?.completionUnread?"completed" as const:"idle" as const}]})
   rows.sort((a,b)=>b.updatedAt-a.updatedAt)
   return {workspaces:ws,sessions:rows.slice(0,100),locale:t("panel")==="Personal workbench"?"en":"zh"}
 },[workspaces,archived,sessions,statuses,t,internalIds,personalIds])
 const live=published(board)
 const builtin=!!live&&isBuiltin(live.source)
 const canRead=builtin||grant===board.id+":"+live?.id
 const liveContext=React.useMemo(()=>canRead?{...context,recommendations:builtin?(snapshot.recommendations?.[board.id]??[]).filter(r=>context.sessions.some(s=>s.id===r.sessionId)):[]}: {...NO_CONTEXT,locale:context.locale},[canRead,builtin,context,snapshot.recommendations,board.id])
 const previewContext=React.useMemo(()=>isBuiltin(board.draft)?context:{...NO_CONTEXT,locale:context.locale},[board.draft,context])
 function update(fn:(b:Board)=>Board){return commit(s=>replaceBoard(s,fn(s.boards.find(b=>b.id===s.active)!)))}
 function changeMode(next:Mode){
  aiGeneration.current++;setAiBusy(false);setAiNotice("");setStudioPrompt(undefined);setAiSessionOverride(undefined);setMode(next);setAction(null);setRuntimeError("")
  if(next==="edit"){setPreview(null);setPreviewStatus("loading");setRequest("");setVersionLabel("")}
  if(next!=="conversation")setChat(null)
 }
 function select(id:string){if(commit(s=>({...s,active:id}))){setGrant("");changeMode("home")}}
 function create(template:string,name:string){if(commit(s=>{if(s.boards.length>=MAX_BOARDS)throw new Error(t("boardLimit"));const b=newBoard(name,template);return {...s,active:b.id,boards:[...s.boards,b]}}))changeMode("edit")}
 async function launchAI(){
  if(!request.trim()||aiBusy||!ready)return
  const generation=++aiGeneration.current,boardId=board.id,sessionId="session-"+crypto.randomUUID();setAiBusy(true)
  try{
   const grant=await host.action<{cwd:string}>({action:"builder",sessionId,boardId})
   let id:string
   try{id=await createSession({sessionId,cwd:grant.cwd,agentPreset:"personal-workbench-builder"});if(id!==sessionId)throw new Error("DSH did not preserve the bound session identity")}
   catch(e){await host.action({action:"revoke",sessionId}).catch(()=>{});throw e}
   if(generation!==aiGeneration.current){await host.action({action:"revoke",sessionId});return}
   setStudioPrompt(request.trim());try{await host.action({action:"activate",sessionId:id})}catch(e){await host.action({action:"revoke",sessionId:id}).catch(()=>{});throw e}if(generation!==aiGeneration.current){await host.action({action:"revoke",sessionId:id});return}setAiSessionOverride(id);setAiNotice(t("studioDraftReady"))
  }catch(e){if(generation===aiGeneration.current)setError(String(e))}
  finally{if(generation===aiGeneration.current)setAiBusy(false)}
 }
 async function resetStudio(){
  aiGeneration.current++;setAiBusy(true);setAiNotice("");setStudioPrompt(undefined)
  try{if(aiSession)await host.action({action:"revoke",sessionId:aiSession});setAiSessionOverride("")}
  catch(e){setError(String(e))}
  finally{setAiBusy(false)}
 }
 const candidate=mode==="edit"?snapshot.pending.find(x=>x.boardId===board.id&&x.sessionId===aiSession):undefined
 function runPreview(){
  const source=candidate?.source??board.draft
  try{
   compile(source);setPreviewData(isBuiltin(source)?structuredClone(board.data):{});setPreviewStatus("loading");setRuntimeError("")
   setPreview(p=>({source,nonce:(p?.nonce??0)+1,candidate}))
  }catch(e){
   setRuntimeError(String(e));setPreviewStatus("error")
   if(candidate&&!acknowledged.current.has(candidate.id)){acknowledged.current.add(candidate.id);void host.action({action:"preview",id:candidate.id,sessionId:candidate.sessionId,ok:false,detail:String(e)}).catch(err=>setError(String(err)))}
  }
 }
 React.useEffect(()=>{if(ready&&mode==="edit")runPreview()},[ready,mode,board.id,board.draft,candidate?.id])
 function onPreviewStatus(status:"loading"|"ready"|"error",detail?:string){
  setPreviewStatus(status);setRuntimeError(detail??"")
  const c=preview?.candidate
  if(!c||candidate?.id!==c.id||status==="loading"||acknowledged.current.has(c.id))return
  acknowledged.current.add(c.id)
  void host.action({action:"preview",id:c.id,sessionId:c.sessionId,ok:status==="ready",detail}).then(()=>{setAiNotice(status==="ready"?t("studioApplied"):t("studioCompileError")+": "+(detail??""))}).catch(e=>setError(String(e)))
 }
 function requestAction(a:Action){if(builtin){void perform(a);return}setAction(a)}
 function eligibleSources(){return context.sessions.filter(s=>!!s.workspaceId)}
 async function perform(a:Action){
  setAction(null)
  if(chatBusy)return
  try{
   if(a.type==="open"){
    const s=context.sessions.find(s=>s.id===a.id)
    const personal=snapshot.personal.some(p=>p.sessionId===a.id)
    if(!s&&!personal)throw new Error(t("missingSession"))
    setChat({sessionId:a.id,title:s?.title??t("personalAssistant"),personal});setMode("conversation");return
   }
   if(a.type==="personal"){
    setScope({kind:"personal",prompt:a.prompt,selected:[],workspaceId:"",recommend:a.recommend});return
   }
   if(!a.id){
    setScope({kind:"workspace",prompt:a.prompt,selected:[],workspaceId:context.workspaces.length===1?context.workspaces[0].id:""});return
   }
   const target=context.workspaces.find(w=>w.id===a.id)
   if(!target)throw new Error(t("missingWorkspace"))
   setChatBusy(true)
   const id=await createSession({workspaceId:target.id})
   setChat({sessionId:id,prompt:a.prompt,title:target.title});setMode("conversation")
  }catch(e){setError(String(e))}
  finally{setChatBusy(false)}
 }
 async function launchScope(){
  if(!scope||chatBusy)return
  if(scope.kind==="workspace"){
   const target=scope.workspaceId
   if(!target)return
   const prompt=scope.prompt;setScope(null);await perform({type:"start",id:target,prompt});return
  }
  setChatBusy(true)
  const sessionId="session-"+crypto.randomUUID()
  try{
   const allowed=new Set(eligibleSources().map(s=>s.id))
   const selected=scope.selected.filter(id=>allowed.has(id))
   if(selected.length!==scope.selected.length)throw new Error(t("missingSession"))
   const g=await host.action<{cwd:string}>({action:"personal",sessionId,sessionIds:selected,boardId:board.id,allowRecommendations:scope.recommend===true})
   let id:string
   try{id=await createSession({sessionId,cwd:g.cwd,agentPreset:"personal-workbench-personal"});if(id!==sessionId)throw new Error("DSH did not preserve the bound session identity")}
   catch(e){await host.action({action:"revoke",sessionId}).catch(()=>{});throw e}
   try{await host.action({action:"activate",sessionId:id})}catch(e){await host.action({action:"revoke",sessionId:id}).catch(()=>{});throw e}setChat({sessionId:id,prompt:scope.prompt,title:t("personalAssistant"),personal:true});setScope(null);setMode("conversation")
  }catch(e){setError(String(e))}
  finally{setChatBusy(false)}
 }
 async function importFile(file:File){try{if(file.size>MAX_SOURCE*6)throw new Error(t("fileTooLarge"));const b=importBoard(await file.text());if(commit(s=>{if(s.boards.length>=MAX_BOARDS)throw new Error(t("boardLimit"));return {...s,active:b.id,boards:[...s.boards,b]}}))changeMode("edit")}catch(e){setError(String(e))}}
 const previewMatches=!candidate&&preview?.source===board.draft&&previewStatus==="ready"&&!runtimeError&&!!board.title.trim()
 const setAsDefault=()=>commit(s=>({...s,defaultId:board.id}))
 const back=()=>changeMode("home")
 if(!ready)return <div className="dsh-wb wb-shell"><div className="wb-content"><h1>{t("panel")}</h1><p role="status">{error||t("hostLoading")}</p>{error&&<><Button onClick={host.reload}>{t("retry")}</Button><Button variant="outline" onClick={()=>{try{const raw=localStorage.getItem("dsh-personal-workbench:state:v1");if(raw)download("workbench-recovery.json",raw)}catch(e){setError(String(e))}}}>{t("backup")}</Button></>}</div></div>
 return <PortalContext.Provider value={portal}><div className="dsh-wb wb-shell" ref={setPortal}>
 <header className="wb-toolbar">
   <div className="wb-toolbar-main">{mode!=="home"&&<Button variant="ghost" size="icon-sm" onClick={back} aria-label={mode==="conversation"?t("returnWorkbench"):t("back")}><ArrowLeft/></Button>}
   <span className="wb-brand">{t("panel")}</span>
   {mode==="home"?<ChoiceSelect label={t("selectBoard")} value={state.active} onChange={select} options={state.boards.map(b=>({value:b.id,label:b.title+(state.defaultId===b.id?" · "+t("defaultMark"):"")}))} className="wb-quiet-select wb-board-select"/>:<span className="wb-current">{mode==="conversation"?chat?.title:board.title}</span>}</div>
   <div className="wb-toolbar-actions">{mode==="home"?<><Button size="sm" variant="ghost" onClick={()=>changeMode("manage")}>{t("manage")}</Button><Button size="sm" variant="outline" onClick={()=>changeMode("edit")}><WandSparkles/>{t("edit")}</Button></>:mode==="edit"?<><Button variant="outline" size="sm" disabled={!!candidate||previewStatus!=="ready"||preview?.source!==board.draft} onClick={()=>{void host.commitDurable(s=>replaceBoard(s,saveDraft(s.boards.find(b=>b.id===board.id)!,versionLabel)))}}><Save/>{t("saveVersion")}</Button><Button size="sm" disabled={!previewMatches} onClick={()=>{void host.commitDurable(s=>replaceBoard(s,publishDraft(s.boards.find(b=>b.id===board.id)!,versionLabel))).then(ok=>{if(ok){setGrant("");back()}})}}>{t("publish")}</Button></>:null}</div>
 </header>
 {error&&<div className="wb-notice" role="alert">{error}<Button size="sm" variant="ghost" onClick={()=>setError("")}>{t("dismiss")}</Button></div>}
 {(mode==="home"||mode==="conversation")&&<div className="wb-home" style={mode==="conversation"?{display:"none"}:undefined}>
   {!live?<div className="wb-content"><h1>{board.title}</h1><p className="wb-subtitle">{t("unpublished")}</p><Button className="mt-4" onClick={()=>changeMode("edit")}>{t("edit")}</Button></div>:<>
   {!builtin&&<div className="wb-permission"><span>{t("customNotice")}</span><Button size="sm" variant="outline" onClick={()=>{setAction(null);setGrant(canRead?"":board.id+":"+live.id)}}>{canRead?t("revoke"):t("grant")}</Button></div>}
   <Sandbox key={board.id+":"+live.id+":"+String(canRead)+":"+host.recoveryEpoch} source={live.source} context={liveContext} data={board.data} preview={false} onSave={data=>{if(JSON.stringify(data)!==JSON.stringify(board.data))update(b=>({...b,data}))}} onStart={(id,prompt)=>requestAction({type:"start",id,prompt})} onPersonal={(prompt,recommend)=>requestAction({type:"personal",prompt,recommend})} onOpen={id=>requestAction({type:"open",id})} onStatus={()=>{}}/>
   </>}
 </div>}
 {mode==="conversation"&&chat&&<div className="wb-full-conversation">{chat.personal&&<div className="wb-personal-scope"><span>{t("personalReadOnly")} · {snapshot.personal.find(x=>x.sessionId===chat.sessionId)?.sessionIds.length??0} {t("approvedSources")}</span><Button variant="ghost" size="sm" onClick={()=>setConfirmation({description:t("revokeSourcesConfirm"),run:()=>{void host.action({action:"revoke",sessionId:chat.sessionId}).then(()=>changeMode("home")).catch(e=>setError(String(e)))}})}>{t("revoke")}</Button></div>}{renderStudio({sessionId:chat.sessionId,variant:"main",prompt:chat.prompt,onPrefilled:()=>setChat(c=>c?{...c,prompt:undefined}:c),onError:setError})}</div>}
 {mode==="manage"&&<main className="wb-content wb-manage">
   <div className="wb-heading"><div><h1>{t("manage")}</h1><p className="wb-subtitle">{t("manageHint")}</p><label className="wb-setting"><Checkbox aria-label={t("startup")} checked={startup} onCheckedChange={checked=>{try{localStorage.setItem("dsh-workbench:startup",checked===true?"on":"off");setStartup(checked===true)}catch(err){setError(String(err))}}}/>{t("startup")}</label></div><Button size="sm" variant="outline" onClick={()=>fileRef.current?.click()}><Upload/>{t("import")}</Button><input type="file" ref={fileRef} accept=".json,application/json" hidden onChange={e=>{const f=e.target.files?.[0];e.target.value="";if(f)void importFile(f)}}/></div>
   <section className="wb-section"><h2>{t("myBoards")}</h2>{state.boards.map(b=><div className="wb-board-row" key={b.id}><div className="wb-row-title"><strong>{b.title}</strong><small>{b.id===state.defaultId?t("defaultMark")+" · ":""}{published(b)?.label??t("unpublished")}</small></div><Button variant="ghost" size="sm" onClick={()=>select(b.id)}>{t("open")}</Button><Button variant="ghost" size="sm" onClick={()=>{if(commit(s=>({...s,active:b.id})))changeMode("edit")}}>{t("edit")}</Button><Button variant="ghost" size="sm" disabled={b.id===state.defaultId||!published(b)} onClick={()=>commit(s=>({...s,defaultId:b.id}))}>{t("setDefault")}</Button><Button variant="ghost" size="icon-sm" aria-label={t("export")} onClick={()=>download(b.title.replace(/[\\/:*?"<>|]/g,"_")+".workbench.json",exportBoard(b))}><Download/></Button><Button variant="ghost" size="sm" onClick={()=>create(published(b)?.source??b.draft,b.title+" · "+t("copy"))}>{t("copy")}</Button><Button variant="ghost" size="sm" onClick={()=>setConfirmation({description:t("deleteConfirm"),destructive:true,run:()=>{commit(s=>deleteBoard(s,b.id))}})} disabled={state.boards.length<=1}>{t("delete")}</Button></div>)}</section>
   <section className="wb-section"><h2>{t("newFromTemplate")}</h2><div className="wb-template-grid">{TEMPLATES.map(template=><button className="wb-template" key={template.id} onClick={()=>create(template.source,t("template_"+template.id))}><TemplatePreview kind={template.id}/><strong>{t("template_"+template.id)}</strong><small>{t("desc_"+template.id)}</small></button>)}</div></section>
 </main>}
 {mode==="edit"&&<div className="wb-studio">
   <section className="wb-preview-col"><div className="wb-sectionbar"><strong>{t("preview")}</strong><Button size="sm" variant="outline" onClick={runPreview}>{t("refreshPreview")}</Button></div>{runtimeError&&<div className="wb-notice" role="alert">{runtimeError}</div>}{preview?<Sandbox key={board.id+":"+preview.nonce} source={preview.source} context={previewContext} data={previewData} preview onSave={setPreviewData} onStart={()=>{}} onPersonal={()=>{}} onOpen={()=>{}} onStatus={onPreviewStatus}/>:<div className="wb-placeholder">{t("previewHint")}</div>}</section>
   <section className="wb-editor-col wb-chat-editor">
    <div className="wb-sectionbar wb-chat-heading"><strong><WandSparkles size={16}/>{t("studioTitle")}</strong><small>{t("draft")}</small>{aiSession&&<Button size="xs" variant="ghost" disabled={aiBusy} onClick={()=>setConfirmation({description:t("newStudioConfirm"),run:()=>{void resetStudio()}})}>{t("newStudio")}</Button>}</div>
    <details className="wb-studio-settings"><summary>{t("boardSettings")}</summary><div className="wb-stack"><label className="wb-field">{t("boardName")}<Input value={board.title} maxLength={80} onChange={e=>update(b=>({...b,title:e.target.value}))}/></label><label className="wb-field">{t("versionLabel")}<Input value={versionLabel} onChange={e=>setVersionLabel(e.target.value)} maxLength={80}/></label><div className="wb-sectionbar"><strong><History size={16}/> {t("history")}</strong>{live&&<Button size="sm" variant="ghost" onClick={setAsDefault} disabled={state.defaultId===board.id}>{t("setDefault")}</Button>}</div>
    {[...board.versions].reverse().map(v=><div key={v.id} className="wb-version"><div className="wb-row-title"><strong>{v.label}{v.id===board.published?" · "+t("live"):""}</strong><small>{new Date(v.createdAt).toLocaleString()}</small></div><Button size="sm" variant="ghost" disabled={!!candidate} onClick={()=>setConfirmation({description:t("restoreDraft"),run:()=>{if(update(b=>editVersion(b,v.id)))void resetStudio()}})}>{t("editVersion")}</Button></div>)}</div></details>
    {aiNotice&&<div className="wb-ai-notice" role="status">{aiNotice}<Button size="icon-xs" variant="ghost" aria-label={t("dismiss")} onClick={()=>setAiNotice("")}>×</Button></div>}
    {aiSession?<div className="wb-studio-conversation">{renderStudio({sessionId:aiSession,prompt:studioPrompt,onPrefilled:()=>setStudioPrompt(undefined),onError:setError})}</div>:<div className="wb-studio-intro"><h2>{t("studioIntro")}</h2><p className="wb-help">{t("studioHint")}</p><label className="wb-field">{t("changeRequest")}<Textarea rows={4} value={request} onChange={e=>setRequest(e.target.value)} placeholder={t("changePlaceholder")}/></label><Button size="sm" onClick={()=>void launchAI()} disabled={!request.trim()||aiBusy}><WandSparkles/>{t("startStudio")}</Button></div>}

   </section>
 </div>}
 <Dialog open={!!scope} onOpenChange={v=>{if(!v&&!chatBusy)setScope(null)}}><DialogContent showCloseButton={false}><DialogTitle>{scope?.kind==="personal"?t("personalScopeTitle"):t("chooseWorkspace")}</DialogTitle><DialogDescription>{scope?.kind==="personal"?(scope.recommend?t("recommendScopeHint"):t("personalScopeHint")):t("workspaceScopeHint")}</DialogDescription>{scope?.kind==="personal"?<div className="wb-source-picker"><div className="wb-sectionbar"><small>{scope.selected.length} {t("approvedSources")}</small><Button variant="ghost" size="sm" disabled={chatBusy} onClick={()=>setScope(s=>s?{...s,selected:s.selected.length?[]:eligibleSources().map(x=>x.id)}:s)}>{scope.selected.length?t("clearSelection"):t("selectAllVisible")}</Button></div>{context.workspaces.map(w=>{const rows=eligibleSources().filter(s=>s.workspaceId===w.id);if(!rows.length)return null;const all=rows.every(s=>scope.selected.includes(s.id));return <section key={w.id} className="wb-source-group"><label><Checkbox aria-label={w.title} disabled={chatBusy} checked={all?true:rows.some(s=>scope.selected.includes(s.id))?"indeterminate":false} onCheckedChange={v=>setScope(old=>old?{...old,selected:v===true?[...new Set([...old.selected,...rows.map(s=>s.id)])]:old.selected.filter(id=>!rows.some(s=>s.id===id))}:old)}/><strong>{w.title}</strong></label>{rows.map(s=><label key={s.id} className="wb-source-row"><Checkbox aria-label={s.title} disabled={chatBusy} checked={scope.selected.includes(s.id)} onCheckedChange={v=>setScope(old=>old?{...old,selected:v===true?[...new Set([...old.selected,s.id])]:old.selected.filter(id=>id!==s.id)}:old)}/><span>{s.title}</span></label>)}</section>})}{!eligibleSources().length&&<p className="wb-empty">{t("noSources")}</p>}</div>:scope&&<ChoiceSelect label={t("workspace")} value={scope.workspaceId} placeholder={t("chooseWorkspace")} disabled={chatBusy} options={context.workspaces.map(w=>({value:w.id,label:w.title}))} onChange={v=>setScope(s=>s?{...s,workspaceId:v}:s)}/>}<DialogFooter><Button variant="outline" disabled={chatBusy} onClick={()=>setScope(null)}>{t("cancel")}</Button><Button disabled={chatBusy||(scope?.kind==="workspace"&&!scope.workspaceId)||(scope?.recommend&&!scope.selected.length)} onClick={()=>void launchScope()}>{t("start")}</Button></DialogFooter></DialogContent></Dialog>
 <ConfirmDialog open={!!action||!!confirmation} title={t("confirmAction")} description={confirmation?.description??(action?.type==="open"?context.sessions.find(s=>s.id===action.id)?.title??"":action?.prompt||t("start"))} cancel={t("cancel")} confirm={t("confirm")} destructive={confirmation?.destructive} onCancel={()=>{setAction(null);setConfirmation(null)}} onConfirm={()=>{if(confirmation){setConfirmation(null);confirmation.run()}else if(action)void perform(action)}}/>
 </div></PortalContext.Provider>
}
