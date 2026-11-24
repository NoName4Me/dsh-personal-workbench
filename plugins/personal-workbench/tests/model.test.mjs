import { test } from "node:test"
import assert from "node:assert/strict"
import { newBoard,saveDraft,publishDraft,publishVersion,editVersion,readState,exportBoard,importBoard,deleteBoard } from "../src/model.ts"
const source="export default function App(){return null}"
test("drafts, published snapshots and data stay separate",()=>{
 let b=newBoard("a",source,true)
 const v1=b.published
 b={...b,draft:source+" // v2",data:{count:3}}
 b=saveDraft(b)
 assert.equal(b.published,v1)
 const v2=b.draftParent
 b=publishDraft(b)
 assert.equal(b.published,v2)
 b=publishVersion(b,v1)
 assert.equal(b.data.count,3)
 assert.equal(b.draftParent,v2)
 b=editVersion(b,v1)
 assert.equal(b.draft,source)
 assert.equal(b.versions.length,2)
 assert.equal(b.published,v1)
})
test("imports are unpublished, exclude data and get fresh identity",()=>{
 const b={...newBoard("a",source,true),data:{secret:"private"}}
 const imported=importBoard(exportBoard(b))
 assert.notEqual(imported.id,b.id)
 assert.equal(imported.published,null)
 assert.deepEqual(imported.data,{})
 assert.throws(()=>importBoard('{"format":"dsh-workbench","version":1,"title":"x","source":2}'))
})
test("validates references and preserves last board",()=>{
 const b=newBoard("a",source,true)
 const s={schema:1,active:b.id,defaultId:b.id,boards:[b]}
 assert.deepEqual(readState(s),s)
 assert.throws(()=>readState({...s,active:"missing"}))
 assert.throws(()=>deleteBoard(s,b.id))
})
