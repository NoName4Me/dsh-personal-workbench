import { readFileSync } from "node:fs"
import { storeFor,visibleSources } from "./host/store.mjs"
export const inject=["skills","connection","profileContext"]
const PATH="/api/personal-workbench"
export function apply(ctx){
 const raw=readFileSync(new URL("./skills/workbench-dev/SKILL.md",import.meta.url),"utf8")
 ctx.skills.register({name:"workbench-dev",source:"runtime",description:"Develop and modify an offline Personal Workbench TSX page.",content:raw.replace(/^---[\s\S]*?---\s*/,"")})
 const store=storeFor(ctx)
 ctx.effect(()=>ctx.connection.fetch.register({
  path:PATH,methods:["GET","POST"],requestBody:"buffered",
  fetch:async request=>{
   try{
    if(request.method==="GET"){const s=store.snapshot();const revision=new URL(request.url).searchParams.get("revision");if(revision!==null&&Number(revision)===s.revision){delete s.state;s.unchanged=true}return Response.json(s,{headers:{"cache-control":"no-store"}})}
    if(!request.headers.get("content-type")?.startsWith("application/json"))return new Response("Expected JSON",{status:415})
    const text=await request.text()
    if(text.length>36_000_000)return new Response("Request too large",{status:413})
    const body=JSON.parse(text)
    let value
    switch(body.action){
     case "save":value=store.save(body.revision,body.state);break
     case "builder":value=store.bind(body.sessionId,{kind:"builder",boardId:body.boardId});break
     case "personal":{
      if(!Array.isArray(body.sessionIds)||body.sessionIds.length>100||body.sessionIds.some(id=>typeof id!=="string"))throw new Error("Invalid source selection")
      const ids=[...new Set(body.sessionIds)]
      if(visibleSources(ctx,store,ids).length!==ids.length)throw new Error("Some selected sessions are no longer available")
      value=store.bind(body.sessionId,{kind:"personal",sources:ids});break
     }
     case "revoke":value=store.revoke(body.sessionId);break
     case "preview":value=store.acknowledge(body);break
     default:return new Response("Unknown action",{status:400})
    }
    return Response.json(value,{headers:{"cache-control":"no-store"}})
   }catch(e){return Response.json({error:e instanceof Error?e.message:String(e)},{status:e.message==="WORKBENCH_CONFLICT"?409:400,headers:{"cache-control":"no-store"}})}
  }
 }),"personal-workbench owner route")
}
