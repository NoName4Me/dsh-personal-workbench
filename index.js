import { readFileSync } from "node:fs"
export const inject = ["skills"]
export function apply(ctx) {
 const raw=readFileSync(new URL("./skills/workbench-dev/SKILL.md",import.meta.url),"utf8")
 const content=raw.replace(/^---[\s\S]*?---\s*/,"")
 ctx.skills.register({name:"workbench-dev",source:"runtime",description:"Develop and modify an offline Personal Workbench TSX page.",content})
}
