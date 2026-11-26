type Event = { type:string; data:unknown }
const obj=(x:unknown):Record<string,unknown>|null=>typeof x==="object"&&x!==null?x as Record<string,unknown>:null
export function latestAssistantText(records:readonly {event:Event}[]):string{
 // Only the latest completed user turn is eligible. Never import an earlier answer after a newer user message.
 for(let i=records.length-1;i>=0;i--){
  const e=records[i].event
  if(e.type==="user/message"||e.type==="turn/start")break
  if(e.type!=="assistant/message")continue
  const message=obj(obj(e.data)?.message)
  if(!Array.isArray(message?.content))continue
  const text=message.content.map(x=>{const b=obj(x);return b?.type==="text"&&typeof b.text==="string"?b.text:""}).join("")
  if(text.trim())return text
 }
 throw new Error("No assistant answer found in the latest turn")
}


/** Only a durable completed turn can change the editable page. */
export function latestCompletedAssistantText(records:readonly {event:Event}[]):string{
 const messages:string[]=[]
 let ended=false
 for(let i=records.length-1;i>=0;i--){
  const e=records[i].event
  if(e.type==="turn/end"){
   if(ended)break
   const reason=obj(obj(e.data)?.reason)
   if(reason?.kind==="error"||reason?.kind==="cancelled"||reason?.kind==="canceled"||reason?.kind==="aborted")throw new Error("Latest turn did not complete successfully")
   ended=true
   continue
  }
  if(e.type==="turn/start"||e.type==="user/message"){
   if(!ended)throw new Error("Latest turn is not complete")
   break
  }
  if(e.type!=="assistant/message")continue
  if(!ended)throw new Error("Latest turn is not complete")
  const message=obj(obj(e.data)?.message)
  if(!Array.isArray(message?.content))continue
  const text=message.content.map(x=>{const b=obj(x);return b?.type==="text"&&typeof b.text==="string"?b.text:""}).join("")
  if(text.trim())messages.unshift(text)
 }
 if(!ended||!messages.length)throw new Error("No completed assistant answer")
 return messages.join("\n\n")
}
export function studioSessionIds(storage:Storage):Set<string>{
 try{const ids:unknown=JSON.parse(storage.getItem("dsh-workbench:studio-sessions")??"[]");return new Set(Array.isArray(ids)?ids.filter((x):x is string=>typeof x==="string"):[])}catch{return new Set()}
}
export function rememberStudioSession(storage:Storage,sessionId:string){
 const ids=studioSessionIds(storage);ids.add(sessionId);storage.setItem("dsh-workbench:studio-sessions",JSON.stringify([...ids].slice(-300)))
}
