import * as React from "react"
import { LayoutDashboard } from "lucide-react"
import { Workbench } from "./Workbench"
import { zh,en } from "./locale"
import type { ClientContext } from "./host"
import css from "./compiled.css?text"

const PANEL_ID = "personal-workbench"
const NS = "personalWorkbench"
export const inject = ["slots","locale","layout","uiWorkspace"]
export function apply(ctx: ClientContext) {
  ctx.effect(()=>ctx.locale.register(NS,{zh,en}),"personal-workbench: locale")
  const t=ctx.locale.bind(NS)
  ctx.slots.inject("main",()=>ctx.slots.register({
    name:"main", key:PANEL_ID, locale:NS,
    inject:()=>({startSession:(id?:string,prompt?:string)=>ctx.uiWorkspace.startSession(id,prompt?{prompt,whenDraftExists:"keep"}:undefined)})
  }, (props: React.ComponentProps<typeof Workbench>)=><><style>{css}</style><Workbench {...props}/></>))
  ctx.slots.inject("sidebar.panellist",()=>ctx.slots.register({
    name:"sidebar.panellist", id:PANEL_ID, order:-100, label:()=>t("panel"), locale:NS
  }, ({size}: {size?:number})=><LayoutDashboard size={size ?? 18} aria-hidden="true"/>))
}
