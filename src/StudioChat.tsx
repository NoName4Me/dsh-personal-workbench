import React from "react"
import type {ClientContext,SessionReference,StudioChatProps} from "./host"
export const STUDIO_SLOT="personal-workbench.studio.conversation"
export type StudioSlotProps={
 renderFactorySlot:(name:string,props:Record<string,unknown>,options?:Record<string,unknown>)=>React.ReactNode
}
type ViewProps={renderSlot:(name:string,props:Record<string,unknown>)=>React.ReactNode}
export function StudioConversation({renderFactorySlot}:StudioSlotProps){
 // A dedicated Session always uses the regular docked composer. It is never
 // redirected by the blank-hero workspace picker.
 return <div className="wb-native-chat">{renderFactorySlot("conversation.content",{
  variant:"embedded",phase:"active",hero:false,onWorkspaceSelected:async()=>{}
 },{slots:{views:({renderSlot}:ViewProps)=>renderSlot("conversation.session",{view:"chat"})}})}</div>
}
export type NativeSeat={SessionProvider:React.ComponentType<{session:SessionReference;children?:React.ReactNode}>;renderSlot:(name:string,props:Record<string,unknown>)=>React.ReactNode}
export function StudioChat({ctx,seat,sessionId,initialPrompt,onError}:StudioChatProps&{ctx:ClientContext;seat:NativeSeat}){
 const [ref,setRef]=React.useState<SessionReference|null>(null)
 const errorRef=React.useRef(onError);errorRef.current=onError
 React.useEffect(()=>{
  const controller=new AbortController()
  let reference:SessionReference|undefined
  setRef(null)
  try{
   reference=ctx.sessions.retain(sessionId,{source:"workbenchStudio",signal:controller.signal})
   const held=reference
   void held.ready.then(()=>{
    if(controller.signal.aborted)return
    if(initialPrompt){
     const binding=ctx.sessions.binding(sessionId)
     if(!binding)throw new Error("The customization session is not available")
     const result=ctx.conversation.input.requestDraftInitialization(binding,{prompt:initialPrompt,whenDraftExists:"keep"})
     if(result==="blocked")throw new Error("The customization draft is busy")
    }
    setRef(held)
   }).catch(e=>{if(!controller.signal.aborted)errorRef.current(String(e))})
  }catch(e){errorRef.current(String(e))}
  return ()=>{controller.abort();reference?.release()}
 },[ctx,sessionId,initialPrompt])
 if(!ref)return <div className="wb-native-chat-loading" role="status">…</div>
 const Provider=seat.SessionProvider
 return <Provider session={ref}>{seat.renderSlot(STUDIO_SLOT,{})}</Provider>
}
