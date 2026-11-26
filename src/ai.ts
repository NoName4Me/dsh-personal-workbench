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
