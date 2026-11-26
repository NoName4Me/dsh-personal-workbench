import {createServer} from "node:http"
import {readFile} from "node:fs/promises"
import {build} from "esbuild"
const harness=(await build({entryPoints:["tests/harness.tsx"],bundle:true,write:false,format:"iife",platform:"browser",jsx:"transform",define:{"process.env.NODE_ENV":'"production"'}})).outputFiles[0].text
const plugin=await readFile("dist/client.js","utf8")
createServer((req,res)=>{
 const scripts={"/harness.js":harness,"/client.js":plugin}
 if(req.url in scripts){res.setHeader("content-type","application/javascript");res.end(scripts[req.url]);return}
 if(req.url==="/"){res.setHeader("content-type","text/html; charset=utf-8");res.end('<!doctype html><html><head><style>html,body,#root{height:100%;margin:0}body{font:14px system-ui}</style></head><body><div id="root"></div><script src="/harness.js"></script><script src="/client.js"></script></body></html>');return}
 res.statusCode=404;res.end()
}).listen(4178,"127.0.0.1")
