import React from "react"
import {createRoot} from "react-dom/client"
import * as UI from "./ui"
import { PortalContext } from "../ui/portal"
import {RuntimeContext} from "./sdk"
import type {ContextData,Request} from "../protocol"
type Incoming={type:"init"|"update";token:string;context:ContextData;data:Record<string,unknown>;theme:Record<string,string>;dark:boolean;preview:boolean}
function Mounted({ready}:{ready:()=>void}){React.useEffect(()=>{ready()},[ready]);return null}
class Boundary extends React.Component<{children:React.ReactNode;fail:(text:string)=>void},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true}}componentDidCatch(error:Error){this.props.fail(error.message)}render(){return this.state.failed?<p role="alert">Workbench failed. Return to the editor to repair it.</p>:this.props.children}}
export function boot(token:string,load:(require:(name:string)=>unknown,module:{exports:Record<string,unknown>},exports:Record<string,unknown>)=>void){
 const send=(request:Request)=>parent.postMessage({...request,token,channel:"dsh-workbench"},"*")
 const fail=(message:unknown)=>send({type:"error",message:String(message).slice(0,1200)})
 window.addEventListener("error",e=>fail(e.message))
 window.addEventListener("unhandledrejection",e=>fail(e.reason))
 const module={exports:{} as Record<string,unknown>}
 const require=(name:string):unknown=>{if(name==="react")return React;if(name==="@workbench/ui")return UI;throw new Error("Unsupported import: "+name)}
 let App:React.ComponentType
 try{load(require,module,module.exports);if(typeof module.exports.default!=="function")throw new Error("Export a default React component");App=module.exports.default as React.ComponentType}catch(e){fail(e);return}
 const root=createRoot(document.getElementById("app")!)
 let current:Incoming|undefined
 let data:Record<string,unknown>={}
 function render(){
  if(!current)return
  const props=current
  for(const [name,value] of Object.entries(props.theme))if(name.startsWith("--wb-"))document.documentElement.style.setProperty(name,value)
  document.documentElement.style.colorScheme=props.dark?"dark":"light"
  document.body.toggleAttribute("data-ds-dark-theme",props.dark)
  root.render(<Boundary fail={fail}><RuntimeContext.Provider value={{...props.context,data,preview:props.preview,save:patch=>{data={...data,...patch};send({type:"save",value:data})},start:(workspaceId,prompt)=>send({type:"start",workspaceId,prompt}),open:sessionId=>send({type:"open",sessionId}),personal:(prompt,recommend)=>send({type:"personal",prompt,recommend})}}><PortalContext.Provider value={document.getElementById("app")}><App/></PortalContext.Provider><Mounted ready={()=>send({type:"rendered"})}/></RuntimeContext.Provider></Boundary>)
 }
 window.addEventListener("message",e=>{if(e.source!==parent||typeof e.data!=="object"||e.data===null||e.data.token!==token)return;const m=e.data as Incoming;if(m.type!=="init"&&m.type!=="update")return;if(!current||m.type==="init"||JSON.stringify(m.data)!==JSON.stringify(current.data))data=m.data;current=m;render()})
 send({type:"ready"})
 const timer=window.setInterval(()=>{if(current){clearInterval(timer);return}send({type:"ready"})},300)
 window.setTimeout(()=>clearInterval(timer),5000)
}
