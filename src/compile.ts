import { transform } from "sucrase"
import { sourceOK } from "./model"
export function compile(source: string): string {
  if (!sourceOK(source)) throw new Error("Source must be 1–48000 characters")
  // This is transpilation, NOT a security check. Execution is exclusively in an opaque iframe.
  return transform(source,{transforms:["typescript","jsx","imports"],production:true,jsxRuntime:"classic",filePath:"Workbench.tsx"}).code
}
export function extractSource(text:string):string {
  const fenced = text.match(/(?:^|\n)\x60\x60\x60(?:tsx|jsx|typescript)?[ \t]*\r?\n([\s\S]*?)\r?\n\x60\x60\x60(?:\r?\n|$)/i)
  return (fenced?.[1]??text).trim()
}
