import { build } from "esbuild"
import { mkdir, readFile, writeFile, rm } from "node:fs/promises"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { scopeCss } from "./scope-css.mjs"
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..")
process.chdir(root)
await mkdir("dist",{recursive:true})
await build({entryPoints:["src/host-model.ts"],bundle:true,platform:"node",format:"esm",target:"node24",outfile:"dist/host-model.js",banner:{js:"import { createRequire } from \"node:module\"; const require = createRequire(import.meta.url);"}})
const output="dist/.tailwind.css"
const cli=resolve(root,"node_modules/@tailwindcss/cli/package.json")
const manifest=JSON.parse(await readFile(cli,"utf8"))
const bin=typeof manifest.bin==="string"?manifest.bin:manifest.bin.tailwindcss
const result=spawnSync(process.execPath,[resolve(dirname(cli),bin),"-i","src/styles.css","-o",output,"--minify"],{stdio:"inherit"})
if(result.status!==0) throw new Error("Tailwind build failed")
const css=await readFile("src/shell.css","utf8")+"\n"+scopeCss(await readFile(output,"utf8"))
const common={bundle:true,write:false,platform:"browser",target:"es2022",jsx:"transform",define:{"process.env.NODE_ENV":'"production"'}}
const runtime=(await build({...common,entryPoints:["src/runtime/entry.tsx"],format:"iife",globalName:"__wbRuntime",minify:true})).outputFiles[0].text
const bundle=await build({...common,entryPoints:["src/client.tsx"],format:"cjs",external:["react","react-dom","react/jsx-runtime"],plugins:[{name:"inline-assets",setup(b){b.onResolve({filter:/compiled\.css\?text$/},()=>({path:"workbench.css",namespace:"inline"}));b.onResolve({filter:/runtime\.js\?text$/},()=>({path:"runtime.js",namespace:"inline"}));b.onLoad({filter:/.*/,namespace:"inline"},args=>({contents:args.path.endsWith(".css")?css:runtime,loader:"text"}))}}]})
const source="window.__ModuleLoader__.load({id:'dsh-personal-workbench',factory(require){const module={exports:{}};const exports=module.exports;\n"+bundle.outputFiles[0].text+"\nreturn module.exports;}});\n"
await writeFile("dist/client.js",source)
await rm(output,{force:true})
