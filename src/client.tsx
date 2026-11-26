import React from "react"
import { LayoutDashboard } from "lucide-react"
import { Workbench } from "./Workbench"
import { StudioChat, StudioConversation, STUDIO_SLOT, type NativeSeat } from "./StudioChat"
import { zh,en } from "./locale"
import type { ClientContext,WorkbenchProps,CreateSessionOptions } from "./host"
import css from "./compiled.css?text"
const PANEL_ID="personal-workbench",NS="personalWorkbench"
export const inject=["slots","locale","layout","sessions","conversation"]
export function apply(ctx:ClientContext){
 ctx.effect(()=>ctx.locale.register(NS,{zh,en}),"personal-workbench: locale")
 const t=ctx.locale.bind(NS)
 let startupSelected=false
 ctx.slots.inject("main",()=>{
  const dispose=ctx.slots.register({
   name:"main",key:PANEL_ID,locale:NS,children:{[STUDIO_SLOT]:{kind:"single",scope:"session"}},
   inject:()=>({createSession:(opts:CreateSessionOptions)=>ctx.sessions.create(opts)})
  },(props:Omit<WorkbenchProps,"renderStudio">&NativeSeat)=><><style>{css}</style><Workbench {...props} renderStudio={p=><StudioChat key={p.sessionId} ctx={ctx} seat={props} {...p}/>}/></>)
  if(!startupSelected){startupSelected=true;try{if(localStorage.getItem("dsh-workbench:startup")!=="off")ctx.layout.selectPanel(PANEL_ID)}catch(e){console.warn("Workbench startup selection unavailable",e)}}
  return dispose
 })
 ctx.slots.inject(STUDIO_SLOT,()=>ctx.slots.register({name:STUDIO_SLOT},StudioConversation))
 ctx.slots.inject("sidebar.panellist",()=>ctx.slots.register({name:"sidebar.panellist",id:PANEL_ID,order:-100,label:()=>t("panel"),locale:NS},({size}:{size?:number})=><LayoutDashboard size={size??18} aria-hidden="true"/>))
}
