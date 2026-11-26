import { test } from "node:test"
import assert from "node:assert/strict"
import { parseRequest } from "../src/protocol.ts"
test("only accepts valid tokens and supported messages",()=>{
 const message={channel:"dsh-workbench",token:"t",type:"start",workspaceId:"w",prompt:"hello"}
 assert.deepEqual(parseRequest(message,"t"),{type:"start",workspaceId:"w",prompt:"hello"})
 assert.equal(parseRequest(message,"wrong"),null)
 assert.equal(parseRequest({...message,type:"shell"},"t"),null)
 assert.equal(parseRequest({...message,prompt:"x".repeat(12001)},"t"),null)
 assert.equal(parseRequest({...message,workspaceId:{}},"t"),null)
})
