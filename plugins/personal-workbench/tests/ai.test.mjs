import {test} from "node:test"
import assert from "node:assert/strict"
import {latestAssistantText} from "../src/ai.ts"
const row=(type,data)=>({event:{type,data}})
const answer=text=>row("assistant/message",{message:{content:[{type:"text",text}]}})
test("reads latest assistant text without using older turn",()=>{
 assert.equal(latestAssistantText([answer("old"),row("turn/start",{}),answer("new"),row("turn/end",{})]),"new")
 assert.throws(()=>latestAssistantText([answer("old"),row("turn/start",{})]))
})
