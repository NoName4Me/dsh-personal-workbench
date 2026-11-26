import { mkdirSync, readFileSync, writeFileSync, renameSync, unlinkSync } from "node:fs"
import { join, resolve } from "node:path"
import { randomUUID } from "node:crypto"
import { readState, compile, sourceOK, replaceBoard } from "../dist/host-model.js"

const stores=new Map()
const MAX_GRANTS=500
const validId=x=>typeof x==="string"&&/^[a-zA-Z0-9_-]{1,100}$/.test(x)
export function storeFor(ctx){
 const profile=ctx.get("profileContext")
 if(!profile?.dir)throw new Error("Workbench requires a DSH profile")
 const dir=resolve(profile.dir,"personal-workbench")
 if(!stores.has(dir))stores.set(dir,new Store(dir))
 return stores.get(dir)
}
export class Store {
 constructor(dir){
  this.dir=dir;this.file=join(dir,"state.json");this.pending=new Map()
  mkdirSync(dir,{recursive:true,mode:0o700})
  this.cwd=join(dir,"agent-work");mkdirSync(this.cwd,{recursive:true,mode:0o700})
 }
 read(){
  try{
   const d=JSON.parse(readFileSync(this.file,"utf8"))
   if(d.schema!==1||!Number.isSafeInteger(d.revision)||d.revision<0||!d.grants||typeof d.grants!=="object"||Array.isArray(d.grants))throw new Error("Invalid workbench store")
   return {...d,state:readState(d.state)}
  }catch(e){if(e.code==="ENOENT")return {schema:1,revision:0,state:null,grants:{}};throw e}
 }
 write(d){
  const tmp=this.file+"."+randomUUID()+".tmp"
  try{writeFileSync(tmp,JSON.stringify(d),{mode:0o600,flag:"wx"});renameSync(tmp,this.file)}finally{try{unlinkSync(tmp)}catch{}}
  return d
 }
 snapshot(){const d=this.read();return {revision:d.revision,state:d.state,builders:Object.entries(d.grants).filter(([,g])=>g.kind==="builder").map(([sessionId,g])=>({sessionId,boardId:g.boardId})),personal:Object.entries(d.grants).filter(([,g])=>g.kind==="personal").map(([sessionId,g])=>({sessionId,sessionIds:g.sources})),pending:[...this.pending.values()].map(({id,boardId,sessionId,source})=>({id,boardId,sessionId,source}))}}
 save(revision,state){
  const d=this.read();if(d.revision!==revision)throw new Error("WORKBENCH_CONFLICT")
  const next=readState(state)
  // A browser state update cannot silently replace a candidate's base draft.
  for(const p of this.pending.values())if(next.boards.find(b=>b.id===p.boardId)?.draft!==p.base)throw new Error("A customization is being validated")
  this.write({...d,revision:d.revision+1,state:next});return this.snapshot()
 }
 bind(sessionId,grant){
  if(!validId(sessionId))throw new Error("Invalid session id")
  const d=this.read();if(!d.state)throw new Error("Workbench has not been initialized")
  if(Object.hasOwn(d.grants,sessionId))throw new Error("Session is already bound")
  if(Object.keys(d.grants).length>=MAX_GRANTS)throw new Error("Workbench session limit reached")
  if(grant.kind==="builder"&&!d.state.boards.some(b=>b.id===grant.boardId))throw new Error("Unknown workbench")
  if(grant.kind!=="builder"&&grant.kind!=="personal")throw new Error("Invalid grant")
  this.write({...d,revision:d.revision+1,grants:{...d.grants,[sessionId]:grant}})
  return {cwd:this.cwd,revision:d.revision+1}
 }
 grant(id,kind){const d=this.read(),g=Object.hasOwn(d.grants,id)?d.grants[id]:null;if(g?.kind!==kind)throw new Error("This session is not authorized for the workbench capability");return g}
 builder(id){
  const g=this.grant(id,"builder"),d=this.read(),b=d.state.boards.find(b=>b.id===g.boardId)
  if(!b)throw new Error("Workbench no longer exists")
  return b
 }
 revoke(id){
  const d=this.read();if(!Object.hasOwn(d.grants,id))return this.snapshot()
  const grants={...d.grants};delete grants[id];this.write({...d,revision:d.revision+1,grants})
  for(const p of this.pending.values())if(p.sessionId===id)p.finish(new Error("Customization session revoked"))
  return this.snapshot()
 }
 async candidate(sessionId,source,signal){
  const board=this.builder(sessionId)
  if(!sourceOK(source)||!/\bexport\s+default\b/.test(source))throw new Error("Provide a complete TSX module with a default React component")
  compile(source)
  if([...this.pending.values()].some(p=>p.boardId===board.id))throw new Error("Another change is awaiting preview")
  signal?.throwIfAborted()
  const id=randomUUID()
  return new Promise((res,rej)=>{
   const finish=(err,value)=>{if(!this.pending.delete(id))return;clearTimeout(timer);signal?.removeEventListener("abort",abort);err?rej(err):res(value)}
   const abort=()=>finish(new Error("Customization cancelled"))
   const timer=setTimeout(()=>finish(new Error("Preview did not acknowledge the candidate. Keep the Studio open and retry.")),45000)
   this.pending.set(id,{id,boardId:board.id,sessionId,source,base:board.draft,finish})
   signal?.addEventListener("abort",abort,{once:true})
  })
 }
 acknowledge({id,sessionId,ok,detail}){
  const p=this.pending.get(id)
  if(!p||p.sessionId!==sessionId)throw new Error("Preview candidate expired")
  if(ok!==true){p.finish(new Error("Preview failed: "+String(detail??"Unknown render error").slice(0,1500)));return this.snapshot()}
  try{
   const d=this.read(),b=this.builder(sessionId)
   if(b.id!==p.boardId||b.draft!==p.base)throw new Error("Draft changed during preview; read and retry")
   this.write({...d,revision:d.revision+1,state:replaceBoard(d.state,{...b,draft:p.source})})
   p.finish(null,"Draft updated and initial preview rendered. Published version unchanged.")
  }catch(e){p.finish(e);throw e}
  return this.snapshot()
 }
}
export function visibleSources(ctx,store,ids){
 const registry=ctx.get("workspaceRegistry")
 if(!registry)throw new Error("DSH Workspace registry unavailable")
 const archived=new Set(registry.archivedSessionIds)
 const internal=new Set(Object.keys(store.read().grants))
 const visible=new Map()
 for(const w of registry.list())for(const id of w.sessionIds)if(!archived.has(id)&&!internal.has(id))visible.set(id,{workspaceId:w.id,title:w.title})
 return ids.filter(id=>visible.has(id)).map(id=>({id,...visible.get(id)}))
}
