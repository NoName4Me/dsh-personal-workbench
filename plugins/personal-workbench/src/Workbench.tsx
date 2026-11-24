import * as React from "react"
import { ArrowUpRight, FilePenLine, FileSearch, Folder, Files, Table2 } from "lucide-react"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import type { WorkbenchProps } from "./host"

export function Workbench({useWorkspaces, startSession, t}: WorkbenchProps) {
  const items = useWorkspaces(s => s.items)
  const [prompt,setPrompt] = React.useState("")
  const [workspace,setWorkspace] = React.useState("")
  const target = items.some(w => w.workspaceId === workspace) ? workspace : undefined
  const actions = [
    {label:"writing", hint:"writingHint", Icon:FilePenLine},
    {label:"sheets", hint:"sheetsHint", Icon:Table2},
    {label:"documents", hint:"documentsHint", Icon:FileSearch},
    {label:"files", hint:"filesHint", Icon:Files},
  ]
  return <div className="dsh-wb">
    <header className="wb-header"><span>{t("panel")}</span></header>
    <main className="wb-content">
      <h1>{t("title")}</h1><p className="wb-subtitle">{t("subtitle")}</p>
      <form className="wb-composer" onSubmit={e=>{e.preventDefault(); if(items.length === 0 && prompt.trim()) return; startSession(target,prompt.trim() || undefined)}}>
        <Textarea aria-label={t("prompt")} placeholder={t("prompt")} value={prompt} onChange={e=>setPrompt(e.target.value)} rows={3} className="resize-y border-0 shadow-none focus-visible:ring-0" />
        {items.length === 0 && <p className="wb-empty wb-onboarding" role="status">{t("emptyPrompt")}</p>}
        <div className="wb-composer-footer">
          <label className="wb-select"><Folder size={16} aria-hidden="true" />
            <select aria-label={t("workspace")} value={target ?? ""} onChange={e=>setWorkspace(e.target.value)}>
              <option value="">{t("defaultWorkspace")}</option>
              {items.map(w=><option key={w.workspaceId} value={w.workspaceId}>{w.title || t("unnamed")}</option>)}
            </select>
          </label>
          <Button type="submit" size="sm" disabled={items.length === 0 && !!prompt.trim()}>{t("start")} <ArrowUpRight aria-hidden="true" /></Button>
        </div>
      </form>
      <section className="wb-section" aria-label={t("common")}>
        <h2>{t("common")}</h2>
        <div className="wb-actions">{actions.map(({label,hint,Icon})=><Button key={label} disabled={items.length === 0} variant="outline" className="justify-start" onClick={()=>startSession(target,t(hint))}><Icon aria-hidden="true"/>{t(label)}</Button>)}</div>
      </section>
      <section className="wb-section" aria-label={t("recent")}>
        <h2>{t("recent")}</h2>
        {items.length === 0 ? <p className="wb-empty">{t("empty")}</p> : <div className="wb-workspaces">{items.map(w=><Button key={w.workspaceId} variant="ghost" className="w-full justify-start" onClick={()=>startSession(w.workspaceId)}><Folder aria-hidden="true"/><span className="truncate">{w.title || t("unnamed")}</span><ArrowUpRight className="ml-auto" aria-hidden="true"/></Button>)}</div>}
      </section>
    </main>
  </div>
}
