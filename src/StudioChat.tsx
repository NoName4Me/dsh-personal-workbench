import React from "react"
import type {ClientContext,SessionReference,StudioChatProps} from "./host"
export const STUDIO_SLOT="personal-workbench.studio.conversation"
export type StudioSlotProps={
 renderFactorySlot:(name:string,props:Record<string,unknown>,options?:Record<string,unknown>)=>React.ReactNode
}
type ViewProps={renderSlot:(name:string,props:Record<string,unknown>)=>React.ReactNode}
export function StudioConversation({renderFactorySlot}:StudioSlotProps){
 return <div className="wb-native-chat">{renderFactorySlot("conversation.content",{
  variant:"embedded",phase:"active",hero:false,onWorkspaceSelected:async()=>{}
 },{slots:{views:({renderSlot}:ViewProps)=>renderSlot("conversation.session",{view:"chat"})}})}</div>
}
export type NativeSeat={SessionProvider:React.ComponentType<{session:SessionReference;children?:React.ReactNode}>;renderSlot:(name:string,props:Record<string,unknown>)=>React.ReactNode}
export function StudioChat({ctx,seat,sessionId,prompt,onError,onPrefilled}:StudioChatProps&{ctx:ClientContext;seat:NativeSeat}){
 const [ref,setRef]=React.useState<SessionReference|null>(null),[failure,setFailure]=React.useState("")
 const latest=React.useRef({prompt,onError,onPrefilled});latest.current={prompt,onError,onPrefilled}
 React.useEffect(()=>{
  const controller=new AbortController()
  let reference:SessionReference|undefined
  setRef(null);setFailure("")
  const fail=(e:unknown)=>{if(!controller.signal.aborted){setFailure(String(e));latest.current.onError(String(e))}}
  try{
   reference=ctx.sessions.retain(sessionId,{source:"workbenchStudio",signal:controller.signal})
   const held=reference
   void held.ready.then(()=>{
    if(controller.signal.aborted)return
    const initialPrompt=latest.current.prompt
    if(initialPrompt){
     const binding=ctx.sessions.binding(sessionId)
     if(!binding)throw new Error("The conversation is not available")
     const result=ctx.conversation.input.requestDraftInitialization(binding,{prompt:initialPrompt,whenDraftExists:"keep"})
     if(result==="blocked")throw new Error("The conversation draft is busy")
     latest.current.onPrefilled?.()
    }
    setRef(held)
   }).catch(fail)
  }catch(e){fail(e)}
  return ()=>{controller.abort();reference?.release()}
 },[ctx,sessionId])
 if(!ref)return <div className="wb-native-chat-loading" role={failure?"alert":"status"}>{failure||"…"}</div>
 const Provider=seat.SessionProvider
 return <Provider session={ref}>{seat.renderSlot(STUDIO_SLOT,{})}</Provider>
}
