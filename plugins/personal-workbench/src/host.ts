export interface Workspace { workspaceId:string; title?:string; sessionIds?:readonly string[] }
export interface WorkspaceState { items:readonly Workspace[]; phase?:unknown; archivedSessionIds?:readonly string[] }
export type UseWorkspaces=<T>(select:(snapshot:WorkspaceState)=>T)=>T
export interface Session { id:string; title?:string; displayTitle?:string; origin?:string; blank?:boolean; running?:boolean; updatedAt?:number }
export interface SessionState { byId:Record<string,Session>; ids:readonly string[]; phase?:unknown }
export type UseSessions=<T>(select:(snapshot:SessionState)=>T)=>T
export type Status={running?:boolean;pendingInteraction?:unknown;completionUnread?:boolean;completionFailed?:boolean}
export type UseSessionStatus=<T>(select:(snapshot:ReadonlyMap<string,Status>)=>T)=>T
export interface WorkbenchProps {useWorkspaces:UseWorkspaces;useSessions:UseSessions;useSessionStatus:UseSessionStatus;startSession:(id?:string,prompt?:string)=>void;openSession:(id:string)=>void;t:(key:string)=>string}
export interface ClientContext {
 slots:{inject:(name:string,callback:()=>unknown)=>unknown;register:(options:Record<string,unknown>,component:unknown)=>unknown}
 effect:(callback:()=>unknown,label?:string)=>unknown
 locale:{register:(namespace:string,dictionaries:Record<string,Record<string,string>>)=>unknown;bind:(namespace:string)=>(key:string)=>string}
 layout:{selectPanel:(id:string)=>void}
 uiWorkspace:{startSession:(id?:string,options?:{prompt:string;whenDraftExists:"append"})=>void;openSession:(id:string)=>void}
}
