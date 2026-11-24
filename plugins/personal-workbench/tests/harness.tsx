import React from "react"
import * as ReactDOM from "react-dom"
import {createRoot} from "react-dom/client"
import * as jsxRuntime from "react/jsx-runtime"
const global=window as any
const root=createRoot(document.getElementById("root")!)
const workspaces={items:[{workspaceId:"w1",title:"验收项目",sessionIds:["s1"]}],archivedSessionIds:[]}
const sessions={ids:["s1"],byId:{s1:{id:"s1",title:"经营数据核对",blank:false,updatedAt:1,running:false}}}
const statuses=new Map([["s1",{pendingInteraction:{kind:"test"},running:false,completionUnread:false}]])
const assistantCode='import React from "react"\nimport {Page,Button,useStored} from "@workbench/ui"\nexport default function App(){const [n,setN]=useStored("n",0);return <Page title="AI 定制结果"><Button onClick={()=>setN(n+1)}>计数：{n}</Button></Page>}'
const dictionary:Record<string,string>={}
let page:any=null,props:any=null
function render(){if(page)root.render(React.createElement(page,props))}
global.__calls=[]
global.__ModuleLoader__={load({factory}:any){
 const mod=factory((name:string)=>{if(name==="react")return React;if(name==="react-dom")return ReactDOM;if(name==="react/jsx-runtime")return jsxRuntime;throw Error(name)})
 const ctx={
  effect:(cb:any)=>cb(),
  locale:{register:(_ns:string,dict:any)=>Object.assign(dictionary,dict.zh),bind:()=>((key:string)=>dictionary[key]??key)},
  slots:{inject:(_slot:string,cb:any)=>cb(),register:(options:any,component:any)=>{if(options.name==="main"){page=component;props={...options.inject(),t:(k:string)=>dictionary[k]??k,useWorkspaces:(f:any)=>f(workspaces),useSessions:(f:any)=>f(sessions),useSessionStatus:(f:any)=>f(statuses)};render()}return ()=>{}}},
  layout:{selectPanel:(id:string)=>global.__calls.push(["panel",id])},
  uiWorkspace:{startSession:(...args:any[])=>global.__calls.push(["start",...args]),openSession:(id:string)=>global.__calls.push(["open",id]),openWorkspace:async(id:string,before:any)=>{global.__calls.push(["ai",id]);before("s1")}},
  sessions:{binding:()=>({})},
  conversation:{input:{requestDraftInitialization:(_binding:any,options:any)=>{global.__calls.push(["draft",options]);return "applied"}}},
  remote:{session:{events:async()=>({ok:true,value:{records:[{event:{type:"turn/start",data:{}}},{event:{type:"assistant/message",data:{message:{content:[{type:"text",text:assistantCode}]}}}},{event:{type:"turn/end",data:{}}}]}})}}
 }
 mod.apply(ctx)
}}
