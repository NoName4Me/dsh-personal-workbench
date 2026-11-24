export type WorkspaceInfo={id:string;title:string}
export type SessionInfo={id:string;title:string;workspaceId?:string;updatedAt:number;status:"attention"|"running"|"completed"|"idle"}
export type ContextData={workspaces:WorkspaceInfo[];sessions:SessionInfo[];locale:"zh"|"en"}
export type Request = {type:"ready"}|{type:"error";message:string}|{type:"save";value:unknown}|{type:"start";workspaceId?:string;prompt?:string}|{type:"open";sessionId:string}
export function parseRequest(value:unknown,token:string):Request|null {
 if(typeof value!=="object"||value===null)return null
 const m=value as Record<string,unknown>
 if(m.channel!=="dsh-workbench"||m.token!==token)return null
 switch(m.type){
  case "ready":return {type:"ready"}
  case "error":return typeof m.message==="string"?{type:"error",message:m.message.slice(0,1200)}:null
  case "save":return {type:"save",value:m.value}
  case "start":return (m.workspaceId===undefined||typeof m.workspaceId==="string")&&(m.prompt===undefined||(typeof m.prompt==="string"&&m.prompt.length<=12000))?{type:"start",workspaceId:m.workspaceId,prompt:m.prompt}:null
  case "open":return typeof m.sessionId==="string"?{type:"open",sessionId:m.sessionId}:null
  default:return null
 }
}
