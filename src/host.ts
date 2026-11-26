import type React from "react"
export interface Workspace { workspaceId:string; title?:string; sessionIds?:readonly string[] }
export interface WorkspaceState { items:readonly Workspace[]; phase?:unknown; archivedSessionIds?:readonly string[] }
export type UseWorkspaces=<T>(select:(snapshot:WorkspaceState)=>T)=>T
export interface Session { id:string; title?:string; displayTitle?:string; origin?:string; blank?:boolean; running?:boolean; updatedAt?:number }
export interface SessionState { byId:Record<string,Session>; ids:readonly string[]; phase?:unknown }
export type UseSessions=<T>(select:(snapshot:SessionState)=>T)=>T
export type Status={running?:boolean;pendingInteraction?:unknown;completionUnread?:boolean;completionFailed?:boolean}
export type UseSessionStatus=<T>(select:(snapshot:ReadonlyMap<string,Status>)=>T)=>T
export type SessionReference={sessionId:string;ready:Promise<unknown>;release:()=>void}
export type StudioChatProps={sessionId:string;prompt?:string;onError:(message:string)=>void;onPrefilled?:()=>void;variant?:"embedded"|"main"}
export type CreateSessionOptions={workspaceId?:string;cwd?:string;sessionId?:string;agentPreset?:string}
export interface WorkbenchProps {useWorkspaces:UseWorkspaces;useSessions:UseSessions;useSessionStatus:UseSessionStatus;createSession:(options:CreateSessionOptions)=>Promise<string>;renderStudio:(props:StudioChatProps)=>React.ReactNode;t:(key:string)=>string}
export interface ClientContext {
 slots:{inject:(name:string,callback:()=>unknown)=>unknown;register:(options:Record<string,unknown>,component:unknown)=>unknown}
 effect:(callback:()=>unknown,label?:string)=>unknown
 locale:{register:(namespace:string,dictionaries:Record<string,Record<string,string>>)=>unknown;bind:(namespace:string)=>(key:string)=>string}
 layout:{selectPanel:(id:string)=>void}
 sessions:{binding:(id:string)=>unknown;create:(opts:CreateSessionOptions)=>Promise<string>;retain:(id:string,opts:{source:string;signal?:AbortSignal})=>SessionReference}
 conversation:{input:{requestDraftInitialization:(binding:unknown,options:{prompt:string;whenDraftExists:"append"|"keep"|"replace"})=>string}}
}
