import { build } from "esbuild"
import { mkdir, readFile, writeFile, rm } from "node:fs/promises"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { scopeCss } from "./scope-css.mjs"
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..")
process.chdir(root)
await mkdir("dist",{recursive:true})
const output="dist/.tailwind.css"
// Tailwind CLI invoked through the current Node, avoiding shell-specific Windows syntax.
const cli=fileURLToPath(import.meta.resolve("@tailwindcss/cli/package.json"))
const manifest=JSON.parse(await readFile(cli,"utf8"))
const bin=typeof manifest.bin==="string"?manifest.bin:manifest.bin.tailwindcss
const result=spawnSync(process.execPath,[resolve(dirname(cli),bin),"-i","src/styles.css","-o",output,"--minify"],{stdio:"inherit"})
if(result.status!==0) throw new Error("Tailwind build failed")
const css=await readFile("src/shell.css","utf8")+"\n"+scopeCss(await readFile(output,"utf8"))
const bundle=await build({entryPoints:["src/client.tsx"],bundle:true,write:false,format:"cjs",platform:"browser",target:"es2022",jsx:"transform",external:["react","react-dom","react/jsx-runtime"],define:{"process.env.NODE_ENV":'"production"'},plugins:[{name:"inline-css",setup(b){b.onResolve({filter:/compiled\.css\?text$/},()=>({path:"workbench.css",namespace:"inline-css"}));b.onLoad({filter:/.*/,namespace:"inline-css"},()=>({contents:css,loader:"text"}))}}]})
const source="window.__ModuleLoader__.load({id:'dsh-personal-workbench',factory(require){const module={exports:{}};const exports=module.exports;\n"+bundle.outputFiles[0].text+"\nreturn module.exports;}});\n"
await writeFile("dist/client.js",source)
await rm(output,{force:true})
