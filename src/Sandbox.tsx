import React from "react"
import {compile} from "./compile"
import {dataOK} from "./model"
import {parseRequest,type ContextData} from "./protocol"
import runtime from "./runtime.js?text"
import css from "./compiled.css?text"
const safeScript=(s:string)=>s.replace(/<\/script/gi,"<\\/script")
const safeStyle=(s:string)=>s.replace(/<\/style/gi,"<\\/style")
const keys=["bg","fg","muted","muted-fg","border","primary","primary-fg","popover","radius-xs","radius-sm","radius-md","font"] as const
type Props={source:string;context:ContextData;data:Record<string,unknown>;preview:boolean;onSave:(value:Record<string,unknown>)=>void;onStart:(id?:string,prompt?:string)=>void;onOpen:(id:string)=>void;onPersonal:(prompt?:string,recommend?:boolean)=>void;onStatus:(status:"loading"|"ready"|"error",detail?:string)=>void}
export function Sandbox(props:Props){
 const frame=React.useRef<HTMLIFrameElement>(null)
 const latest=React.useRef(props);latest.current=props
 const [status,setStatus]=React.useState<"loading"|"ready"|"error">("loading")
 const [message,setMessage]=React.useState("")
 const [attempt,retry]=React.useReducer(x=>x+1,0)
 const compiled=React.useMemo(()=>{try{return {code:compile(props.source),error:""}}catch(e){return {code:"",error:String(e)}}},[props.source])
 const token=React.useMemo(()=>crypto.randomUUID(),[compiled,attempt])
 const html=React.useMemo(()=>{
  if(compiled.error)return ""
  const nonce=token.replace(/-/g,"")
  const policy="default-src 'none'; script-src 'nonce-"+nonce+"'; style-src 'unsafe-inline'; img-src data:; font-src 'none'; connect-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; worker-src 'none'; base-uri 'none'; form-action 'none'"
  const init="__wbRuntime.boot("+JSON.stringify(token)+",function(require,module,exports){\n"+compiled.code+"\n});"
  return '<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="'+policy+'"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#app{height:100%;margin:0}body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:14px}.dsh-wb{--wb-bg:inherit;--wb-fg:inherit;--wb-muted:inherit;--wb-muted-fg:inherit;--wb-border:inherit;--wb-primary:inherit;--wb-primary-fg:inherit;--wb-popover:inherit;--wb-radius-xs:inherit;--wb-radius-sm:inherit;--wb-radius-md:inherit;--wb-font:inherit}'+safeStyle(css)+'.dsh-wb{--wb-bg:inherit;--wb-fg:inherit;--wb-muted:inherit;--wb-muted-fg:inherit;--wb-border:inherit;--wb-primary:inherit;--wb-primary-fg:inherit;--wb-popover:inherit;--wb-radius-xs:inherit;--wb-radius-sm:inherit;--wb-radius-md:inherit;--wb-font:inherit}</style></head><body><div id="app" class="dsh-wb"></div><script nonce="'+nonce+'">'+safeScript(runtime)+'</script><script nonce="'+nonce+'">'+safeScript(init)+'</script></body></html>'
 },[compiled,token])
 const send=React.useCallback((type:"init"|"update")=>{
  const f=frame.current;if(!f?.contentWindow)return
  const p=latest.current
  const style=getComputedStyle(f)
  const theme=Object.fromEntries(keys.map(key=>["--wb-"+key,style.getPropertyValue("--wb-"+key).trim()]).filter(([,v])=>v))
  f.contentWindow.postMessage({type,token,context:p.context,data:p.data,theme,dark:document.body.hasAttribute("data-ds-dark-theme"),preview:p.preview},"*")
 },[token])
 React.useEffect(()=>{
  const notify=(state:"loading"|"ready"|"error",detail="")=>{setStatus(state);setMessage(detail);latest.current.onStatus(state,detail)}
  if(compiled.error){notify("error",compiled.error);return}
  notify("loading")
  let initialized=false, rendered=false
  const timeout=window.setTimeout(()=>{if(!rendered)notify("error","Runtime did not render. The host may block sandboxed documents.")},5000)
  const receive=(event:MessageEvent)=>{
   if(event.source!==frame.current?.contentWindow||event.origin!=="null")return
   const request=parseRequest(event.data,token);if(!request)return
   const p=latest.current
   if(request.type==="error"){notify("error",request.message);return}
   if(request.type==="ready"){if(initialized)return;initialized=true;send("init");return}
   if(!initialized)return
   if(request.type==="rendered"){if(!rendered){rendered=true;clearTimeout(timeout);notify("ready")}return}
   if(!rendered)return
   if(request.type==="save"){if(dataOK(request.value))p.onSave(request.value);else notify("error","Local data exceeds the size limit");return}
   if(p.preview)return
   if(request.type==="start"){if(request.workspaceId!==undefined&&!p.context.workspaces.some(w=>w.id===request.workspaceId))return;p.onStart(request.workspaceId,request.prompt)}
   if(request.type==="personal")p.onPersonal(request.prompt,request.recommend)
   if(request.type==="open"&&p.context.sessions.some(s=>s.id===request.sessionId))p.onOpen(request.sessionId)
  }
  window.addEventListener("message",receive)
  const observer=new MutationObserver(()=>{if(initialized)send("update")})
  observer.observe(document.body,{attributes:true,attributeFilter:["style","data-ds-dark-theme","class"]})
  observer.observe(document.documentElement,{attributes:true,attributeFilter:["style","data-ds-dark-theme","class"]})
  return()=>{clearTimeout(timeout);observer.disconnect();window.removeEventListener("message",receive)}
 },[compiled,token,send])
 React.useEffect(()=>{if(status==="ready")send("update")},[props.context,props.data,props.preview,send,status])
 return <div className="wb-runtime">{status!=="ready"&&<div className="wb-runtime-status" role="status">{status==="loading"?"Loading workbench…":message}{status==="error"&&!compiled.error&&<button onClick={retry}>Retry</button>}</div>}{html&&<iframe key={token} ref={frame} title="Workbench" sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={html} className="wb-frame"/>}</div>
}
