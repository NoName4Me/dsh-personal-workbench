import React from "react"
import type { ContextData, Request } from "../protocol"
export interface RuntimeValue extends ContextData {
 data: Record<string,unknown>
 save: (value:Record<string,unknown>)=>void
 start: (workspaceId?:string,prompt?:string)=>void
 open: (sessionId:string)=>void
 personal: (prompt?:string)=>void
 preview:boolean
}
export const RuntimeContext=React.createContext<RuntimeValue|null>(null)
export function useWorkbench(){const context=React.useContext(RuntimeContext);if(!context)throw new Error("Workbench runtime unavailable");return context}
export function useStored<T>(key:string,initial:T):[T,(value:T)=>void]{
 const ctx=useWorkbench()
 const [value,setValue]=React.useState<T>(()=>Object.hasOwn(ctx.data,key)?ctx.data[key] as T:initial)
 return [value,(next:T)=>{setValue(next);ctx.save({[key]:next})}]
}
export type Send=(request:Request)=>void
