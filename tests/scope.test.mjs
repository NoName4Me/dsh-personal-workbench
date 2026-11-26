import test from "node:test"
import assert from "node:assert/strict"
import { scopeCss } from "../scripts/scope-css.mjs"
test("scopes utility and theme selectors",()=>{
  const css=scopeCss(":root,:host{--x:1}.foo,.bar:hover{color:red}@keyframes spin{to{transform:rotate(1turn)}}")
  assert.match(css,/\.dsh-wb\s*[,]/)
  assert.match(css,/\.dsh-wb \.foo/)
  assert.match(css,/\.dsh-wb \.bar:hover/)
  assert.match(css,/@keyframes spin\{to\{/)
})
