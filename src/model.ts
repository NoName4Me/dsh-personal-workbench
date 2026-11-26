export const MAX_SOURCE = 48_000
export const MAX_DATA = 64_000
export const MAX_BOARDS = 20
export const MAX_VERSIONS = 30
export type Version = { id: string; source: string; createdAt: number; label: string; parentId: string | null }
export type Board = { id: string; title: string; draft: string; draftParent: string | null; versions: Version[]; published: string | null; data: Record<string, unknown> }
export type State = { schema: 1; active: string; defaultId: string; boards: Board[] }
export const id = () => crypto.randomUUID()
export function published(board: Board) { return board.versions.find(v => v.id === board.published) }
export function sourceOK(source: unknown): source is string { return typeof source === "string" && source.trim().length > 0 && source.length <= MAX_SOURCE }
export function newBoard(title: string, source: string, publish = false): Board {
  if (!sourceOK(source)) throw new Error("Invalid source")
  const b: Board = { id:id(), title:title.trim().slice(0,80) || "Workbench", draft:source, draftParent:null, versions:[], published:null, data:{} }
  return publish ? publishDraft(b, "Initial") : b
}
export function saveDraft(b: Board, label = ""): Board {
  if (!sourceOK(b.draft)) throw new Error("Invalid source")
  const parent = b.versions.find(v=>v.id===b.draftParent)
  if (parent?.source === b.draft) return b
  if (b.versions.length >= MAX_VERSIONS) throw new Error("Version limit reached; duplicate this workbench to continue")
  const v: Version = {id:id(), source:b.draft, createdAt:Date.now(), label:label.trim().slice(0,80) || "V"+(b.versions.length+1), parentId:b.draftParent}
  return {...b, versions:[...b.versions,v], draftParent:v.id}
}
export function publishDraft(b: Board, label=""): Board { const next=saveDraft(b,label); return {...next,published:next.draftParent} }
export function editVersion(b: Board, versionId: string): Board {
  const v=b.versions.find(v=>v.id===versionId)
  if (!v) throw new Error("Unknown version")
  return {...b,draft:v.source,draftParent:v.id}
}
export function publishVersion(b: Board, versionId: string): Board {
  if (!b.versions.some(v=>v.id===versionId)) throw new Error("Unknown version")
  return {...b,published:versionId}
}
export function replaceBoard(s:State,b:Board):State {return {...s,boards:s.boards.map(x=>x.id===b.id?b:x)}}
export function deleteBoard(s:State,boardId:string):State {
  if(s.boards.length<=1) throw new Error("Keep at least one workbench")
  const boards=s.boards.filter(b=>b.id!==boardId)
  return {...s,boards,active:s.active===boardId?boards[0].id:s.active,defaultId:s.defaultId===boardId?boards[0].id:s.defaultId}
}
function object(x:unknown):x is Record<string,unknown>{return typeof x==="object"&&x!==null&&!Array.isArray(x)}
function validId(x:unknown):x is string{return typeof x==="string"&&/^[a-zA-Z0-9_-]{1,80}$/.test(x)}
export function dataOK(x:unknown):x is Record<string,unknown>{if(!object(x))return false;try{return JSON.stringify(x).length<=MAX_DATA}catch{return false}}
export function readState(value:unknown):State {
  if(!object(value)||value.schema!==1||!Array.isArray(value.boards)||!value.boards.length||value.boards.length>MAX_BOARDS)throw new Error("Invalid workbench store")
  const boards:Board[]=value.boards.map((b:unknown)=>{
    if(!object(b)||!validId(b.id)||typeof b.title!=="string"||b.title.length>80||typeof b.draft!=="string"||b.draft.length>MAX_SOURCE||!Array.isArray(b.versions)||b.versions.length>MAX_VERSIONS||!dataOK(b.data))throw new Error("Invalid workbench")
    const versions:Version[]=b.versions.map((v:unknown)=>{
      if(!object(v)||!validId(v.id)||!sourceOK(v.source)||typeof v.createdAt!=="number"||!Number.isFinite(v.createdAt)||typeof v.label!=="string"||v.label.length>80||!(v.parentId===null||validId(v.parentId)))throw new Error("Invalid snapshot")
      return {id:v.id,source:v.source,createdAt:v.createdAt,label:v.label,parentId:v.parentId}
    })
    const ids=new Set<string>()
    for(const v of versions){if(ids.has(v.id)||(v.parentId!==null&&!ids.has(v.parentId)))throw new Error("Invalid snapshot ancestry");ids.add(v.id)}
    const pointer=(p:unknown):p is string|null=>p===null||(typeof p==="string"&&ids.has(p))
    if(!pointer(b.published)||!pointer(b.draftParent))throw new Error("Invalid version pointer")
    return {id:b.id,title:b.title,draft:b.draft,draftParent:b.draftParent,versions,published:b.published,data:b.data}
  })
  const ids=new Set(boards.map(b=>b.id))
  if(ids.size!==boards.length||typeof value.active!=="string"||!ids.has(value.active)||typeof value.defaultId!=="string"||!ids.has(value.defaultId))throw new Error("Invalid selection")
  return {schema:1,active:value.active,defaultId:value.defaultId,boards}
}
export const STORE_KEY="dsh-personal-workbench:state:v1"
export function loadState(storage:Storage, fallback:()=>State):State {
  const raw=storage.getItem(STORE_KEY)
  return raw===null?fallback():readState(JSON.parse(raw))
}
export function storeState(storage:Storage,state:State) { storage.setItem(STORE_KEY,JSON.stringify(state)) }
export function exportBoard(b:Board):string {
  return JSON.stringify({format:"dsh-workbench",version:1,title:b.title,source:published(b)?.source??b.draft},null,2)
}
export function importBoard(raw:string):Board {
  if(raw.length>MAX_SOURCE*6)throw new Error("Import too large")
  const x:unknown=JSON.parse(raw)
  if(!object(x)||x.format!=="dsh-workbench"||x.version!==1||typeof x.title!=="string"||!sourceOK(x.source))throw new Error("Invalid workbench file")
  return newBoard(x.title,x.source)
}
