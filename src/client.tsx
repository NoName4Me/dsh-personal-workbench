import React from "react"
import { LayoutDashboard } from "lucide-react"
import { Workbench } from "./Workbench"
import { zh,en } from "./locale"
import { latestAssistantText } from "./ai"
import type { ClientContext } from "./host"
import css from "./compiled.css?text"
const PANEL_ID="personal-workbench",NS="personalWorkbench"
export const inject=["slots","locale","layout","uiWorkspace","sessions","conversation","remote.session"]
export function apply(ctx:ClientContext){
 ctx.effect(()=>ctx.locale.register(NS,{zh,en}),"personal-workbench: locale")
 const t=ctx.locale.bind(NS)
 let startupSelected=false
 ctx.slots.inject("main",()=>{const dispose=ctx.slots.register({name:"main",key:PANEL_ID,locale:NS,inject:()=>({startSession:(id?:string,prompt?:string)=>ctx.uiWorkspace.startSession(id,prompt?{prompt,whenDraftExists:"append"}:undefined),openSession:(id:string)=>ctx.uiWorkspace.openSession(id),askAI:async(workspaceId:string,prompt:string,onSession:(id:string)=>void)=>ctx.uiWorkspace.openWorkspace(workspaceId,id=>{const binding=ctx.sessions.binding(id);if(!binding)throw new Error("Session is unavailable");const outcome=ctx.conversation.input.requestDraftInitialization(binding,{prompt,whenDraftExists:"append"});if(outcome==="blocked")throw new Error("Session draft is busy");onSession(id)}),readAI:async(id:string,signal:AbortSignal)=>{const result=await ctx.remote.session.events({address:{kind:"session",sessionId:id},maxMessages:40},signal);if(!result.ok||!result.value)throw new Error(result.error?.message??"Unable to read the session");return latestAssistantText(result.value.records)}})},(props:React.ComponentProps<typeof Workbench>)=><><style>{css}</style><Workbench {...props}/></>);if(!startupSelected){startupSelected=true;try{if(localStorage.getItem("dsh-workbench:startup")!=="off")ctx.layout.selectPanel(PANEL_ID)}catch(e){console.warn("Workbench startup selection unavailable",e)}}return dispose})
 ctx.slots.inject("sidebar.panellist",()=>ctx.slots.register({name:"sidebar.panellist",id:PANEL_ID,order:-100,label:()=>t("panel"),locale:NS},({size}:{size?:number})=><LayoutDashboard size={size??18} aria-hidden="true"/>))
}
