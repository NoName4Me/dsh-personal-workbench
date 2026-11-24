import postcss from "postcss"
import selectorParser from "postcss-selector-parser"
export function scopeCss(css) {
  const root=postcss.parse(css)
  root.walkRules(rule=>{
    // Keyframe selectors are not DOM selectors.
    for(let p=rule.parent;p;p=p.parent) if(p.type==="atrule" && /keyframes$/.test(p.name)) return
    rule.selector=selectorParser(selectors=>{
      selectors.each(sel=>{
        const first=sel.at(0)
        if(first?.type==="pseudo" && [":root",":host"].includes(first.value)){
          first.replaceWith(selectorParser.className({value:"dsh-wb"}))
        } else {
          sel.prepend(selectorParser.combinator({value:" "}))
          sel.prepend(selectorParser.className({value:"dsh-wb"}))
        }
      })
    }).processSync(rule.selector)
  })
  return root.toString()
}
