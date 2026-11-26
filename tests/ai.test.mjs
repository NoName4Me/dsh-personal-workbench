import {test} from "node:test"
import assert from "node:assert/strict"
import {latestAssistantText,latestCompletedAssistantText} from "../src/ai.ts"
const row=(type,data)=>({event:{type,data}})
const answer=text=>row("assistant/message",{message:{content:[{type:"text",text}]}})
test("reads latest assistant text without using older turn",()=>{
 assert.equal(latestAssistantText([answer("old"),row("turn/start",{}),answer("new"),row("turn/end",{})]),"new")
 assert.throws(()=>latestAssistantText([answer("old"),row("turn/start",{})]))
})

test("automatic application requires durable completion and does not reuse old turns",()=>{
 const start=row("turn/start",{}),end=row("turn/end",{}),failed=row("turn/end",{reason:{kind:"error"}})
 assert.equal(latestCompletedAssistantText([start,answer("code"),answer("summary"),end]),"code\n\nsummary")
 assert.throws(()=>latestCompletedAssistantText([start,answer("code")]))
 assert.throws(()=>latestCompletedAssistantText([start,answer("code"),failed]))
 assert.throws(()=>latestCompletedAssistantText([start,answer("old"),end,start]))
})
