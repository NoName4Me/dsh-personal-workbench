import React from "react"
import { LayoutDashboard,ArrowLeft } from "lucide-react"
import { Workbench } from "./Workbench"
import { StudioChat, StudioConversation, STUDIO_SLOT, type NativeSeat } from "./StudioChat"
import { zh,en } from "./locale"
import { latestCompletedAssistantText } from "./ai"
import type { ClientContext,WorkbenchProps } from "./host"
import css from "./compiled.css?text"
const PANEL_ID="personal-workbench",NS="personalWorkbench"
export const inject=["slots","locale","layout","uiWorkspace","sessions","conversation","remote.session"]
export function apply(ctx:ClientContext){
 ctx.effect(()=>ctx.locale.register(NS,{zh,en}),"personal-workbench: locale")
 const t=ctx.locale.bind(NS)
 let startupSelected=false
 let fromWorkbench=false
 const listeners=new Set<()=>void>()
 const mark=(value:boolean)=>{if(fromWorkbench===value)return;fromWorkbench=value;for(const f of listeners)f()}
 const subscribe=(f:()=>void)=>{listeners.add(f);return ()=>{listeners.delete(f)}}
 const ReturnButton=()=>{
  const visible=React.useSyncExternalStore(subscribe,()=>fromWorkbench)
  if(!visible)return null
  return <button type="button" aria-label={t("returnWorkbench")} onClick={()=>{ctx.layout.selectPanel(PANEL_ID);mark(false)}} style={{display:"inline-flex",alignItems:"center",gap:6,border:0,background:"transparent",color:"var(--dsw-alias-label-primary)",font:"inherit",fontSize:13,padding:"6px 8px",cursor:"pointer",borderRadius:"var(--dsw-radius-sm,8px)"}}><ArrowLeft size={16}/>{t("returnWorkbench")}</button>
 }
 ctx.slots.inject("main",()=>{
  const dispose=ctx.slots.register({
   name:"main",key:PANEL_ID,locale:NS,children:{[STUDIO_SLOT]:{kind:"single",scope:"session"}},
   inject:()=>({
    startSession:(id?:string,prompt?:string)=>{mark(true);ctx.uiWorkspace.startSession(id,prompt?{prompt,whenDraftExists:"append"}:undefined)},
    openSession:(id:string)=>{mark(true);ctx.uiWorkspace.openSession(id)},
    createStudio:(workspaceId:string)=>ctx.sessions.create({workspaceId}),
    readAI:async(id:string,signal:AbortSignal)=>{const result=await ctx.remote.session.events({address:{kind:"session",sessionId:id},maxMessages:40},signal);if(!result.ok||!result.value)throw new Error(result.error?.message??"Unable to read the session");return latestCompletedAssistantText(result.value.records)}
   })
  },(props:Omit<WorkbenchProps,"renderStudio">&NativeSeat)=><><style>{css}</style><Workbench {...props} renderStudio={p=><StudioChat key={p.sessionId} ctx={ctx} seat={props} {...p}/>}/></>)
  if(!startupSelected){startupSelected=true;try{if(localStorage.getItem("dsh-workbench:startup")!=="off")ctx.layout.selectPanel(PANEL_ID)}catch(e){console.warn("Workbench startup selection unavailable",e)}}
  return dispose
 })
 ctx.slots.inject(STUDIO_SLOT,()=>ctx.slots.register({name:STUDIO_SLOT},StudioConversation))
 ctx.slots.inject("conversation.header.leading",()=>ctx.slots.register({name:"conversation.header.leading",locale:NS},ReturnButton))
 ctx.slots.inject("sidebar.panellist",()=>ctx.slots.register({name:"sidebar.panellist",id:PANEL_ID,order:-100,label:()=>t("panel"),locale:NS},({size}:{size?:number})=><LayoutDashboard size={size??18} aria-hidden="true"/>))
}
