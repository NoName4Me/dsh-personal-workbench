import React from "react"
import { initialState } from "./templates"
import { studioSessionIds } from "./ai"
import { loadState, readState, type State } from "./model"
export type Candidate={id:string;boardId:string;sessionId:string;source:string}
export type Recommendation={title:string;description:string;sessionId:string;seq:number}
export type Snapshot={revision:number;state?:State|null;unchanged?:boolean;builders:{sessionId:string;boardId:string}[];personal:{sessionId:string;sessionIds:string[];active:boolean}[];internalIds?:string[];internalWorkspaceIds?:string[];pending:Candidate[];recommendations?:Record<string,Recommendation[]>}
type Carrier=(url:string|URL,init:RequestInit)=>Promise<Response>
export async function hostRequest<T>(body?:Record<string,unknown>,revision?:number,signal?:AbortSignal):Promise<T>{
 const url=new URL("api/personal-workbench",document.baseURI)
 if(revision!==undefined)url.searchParams.set("revision",String(revision))
 const carrier=(globalThis as typeof globalThis&{__DSH_TRANSPORT__?:{fetch?:Carrier}}).__DSH_TRANSPORT__?.fetch
 const init:RequestInit={method:body?"POST":"GET",credentials:"same-origin",cache:"no-store",signal,...body?{headers:{"content-type":"application/json"},body:JSON.stringify(body)}:{}}
 const response=await (carrier?carrier(url.href,init):fetch(url,init))
 const raw=await response.text()
 if(!response.ok){let message=raw.slice(0,500);try{message=JSON.parse(raw).error??message}catch{}throw new Error(message||"Workbench Host HTTP "+response.status)}
 return JSON.parse(raw) as T
}
const EMPTY:Snapshot={revision:-1,state:null,builders:[],personal:[],pending:[]}
export function useHostStore(){
 const [state,setState]=React.useState<State>(initialState)
 const [snapshot,setSnapshot]=React.useState<Snapshot>(EMPTY)
 const [ready,setReady]=React.useState(false),[error,setError]=React.useState("")
 const current=React.useRef(state),server=React.useRef(EMPTY),tail=React.useRef<Promise<void>>(Promise.resolve())
 const generation=React.useRef(0),busy=React.useRef(0),actions=React.useRef(0),loaded=React.useRef(false)
 const [retry,reload]=React.useReducer(x=>x+1,0)
 const [recoveryEpoch,setRecoveryEpoch]=React.useState(0)
 const accept=React.useCallback((next:Snapshot,applyState=true)=>{
  const previous=server.current
  if(next.revision<previous.revision)return
  const merged={...next,state:next.unchanged?previous.state:next.state}
  if(merged.state&&!next.unchanged)merged.state=readState(merged.state)
  const same=next.revision===previous.revision&&JSON.stringify(next.pending)===JSON.stringify(previous.pending)&&JSON.stringify(next.recommendations)===JSON.stringify(previous.recommendations)&&JSON.stringify(next.internalWorkspaceIds)===JSON.stringify(previous.internalWorkspaceIds)
  server.current=merged;if(!same)setSnapshot(merged)
  if(applyState&&merged.state&&(!next.unchanged||current.current!==merged.state)){current.current=merged.state;setState(merged.state)}
 },[])
 React.useEffect(()=>{
  const controller=new AbortController()
  loaded.current=false;setReady(false)
  const open=async()=>{
   try{
    let next=await hostRequest<Snapshot>(undefined,undefined,controller.signal)
    if(controller.signal.aborted)return
    if(next.state===null){
     const legacy=loadState(localStorage,initialState)
     try{next=await hostRequest<Snapshot>({action:"save",revision:next.revision,state:legacy,legacyIds:[...studioSessionIds(localStorage)]},undefined,controller.signal)}
     catch(e){const existing=await hostRequest<Snapshot>(undefined,undefined,controller.signal);if(!existing.state)throw e;next=existing}
    }
    if(controller.signal.aborted)return
    if(!next.state)throw new Error("Host returned no workbench state")
    accept(next);loaded.current=true;setReady(true);setError("")
   }catch(e){if(!controller.signal.aborted)setError(String(e))}
  }
  void open()
  let reading=false
  const timer=window.setInterval(async()=>{
   if(reading||!loaded.current||busy.current||controller.signal.aborted)return
   reading=true
   const epoch=generation.current,revision=server.current.revision
   try{
    const next=await hostRequest<Snapshot>(undefined,revision,controller.signal)
    if(!controller.signal.aborted&&!busy.current&&generation.current===epoch)accept(next)
   }catch(e){if(!controller.signal.aborted)setError(String(e))}finally{reading=false}
  },1000)
  return ()=>{controller.abort();window.clearInterval(timer)}
 },[accept,retry])
 function queue<T>(fn:()=>Promise<T>):Promise<T>{
  busy.current++
  const result=tail.current.then(fn)
  tail.current=result.then(()=>{},()=>{}).finally(()=>{busy.current--})
  return result
 }
 function commit(fn:(s:State)=>State):boolean{
  if(!loaded.current||actions.current){setError("Workbench storage is busy or unavailable; retry after the current operation");return false}
  try{
   const next=readState(fn(current.current)),epoch=generation.current
   current.current=next;setState(next);setError("")
   void queue(async()=>{
    if(epoch!==generation.current)return
    try{const saved=await hostRequest<Snapshot>({action:"save",revision:server.current.revision,state:next});accept(saved,false)}
    catch(e){generation.current++;setRecoveryEpoch(x=>x+1);setError(String(e));try{accept(await hostRequest<Snapshot>())}catch(err){loaded.current=false;setReady(false);setError(String(err))}}
   })
   return true
  }catch(e){setError(String(e));return false}
 }
 async function commitDurable(fn:(s:State)=>State):Promise<boolean>{
  if(!loaded.current||actions.current){setError("Workbench storage is busy or unavailable");return false}
  actions.current++
  try{return await queue(async()=>{
   if(!loaded.current||!server.current.state)throw new Error("Workbench storage is not ready")
   const next=readState(fn(server.current.state))
   accept(await hostRequest<Snapshot>({action:"save",revision:server.current.revision,state:next}))
   setError("");return true
  })}catch(e){setError(String(e));return false}finally{actions.current--}
 }
 async function action<T>(body:Record<string,unknown>):Promise<T>{
  actions.current++
  try{return await queue(async()=>{
   if(!loaded.current)throw new Error("Workbench storage is not ready")
   const result=await hostRequest<T>(body)
   accept(await hostRequest<Snapshot>())
   return result
  })}finally{actions.current--}
 }
 return {state,snapshot,ready,error,setError,current,commit,commitDurable,action,reload,recoveryEpoch}
}
export type HostStore=ReturnType<typeof useHostStore>
