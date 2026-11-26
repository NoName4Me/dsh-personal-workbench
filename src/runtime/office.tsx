import React from "react"
import { ArrowUpRight, Plus, Pencil, Trash2, Search, FileText, ClipboardList, GitCompare, FileCheck, CalendarDays, ListChecks, Briefcase, Sparkles, ArrowRight, Clock, CircleAlert, CheckCircle2, MessageSquare } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { ChoiceSelect, ConfirmDialog } from "../ui/controls"
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog"
import { useWorkbench,useStored } from "./sdk"

type Copy=(zh:string,en:string)=>string
function useCopy():Copy{const {locale}=useWorkbench();return (zh,en)=>locale==="en"?en:zh}
type Shortcut={id:string;title:string;description:string;prompt:string;icon:string;workspaceId?:string}
const icons={report:FileText,meeting:ClipboardList,compare:GitCompare,review:FileCheck,plan:CalendarDays,extract:ListChecks,brief:Briefcase,custom:Sparkles}
const key=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,9)
const DEFAULT="@default"
function defaults(t:Copy):Shortcut[]{return [
 {id:"brief",icon:"brief",title:t("准备汇报简报","Prepare a briefing"),description:t("从资料整理为决策摘要、风险与待办","Decision summary, risks and next steps"),prompt:t("请帮助我准备一份决策汇报简报。先询问汇报对象、目标及已有资料，再提取关键事实与数据，区分事实和判断，梳理备选方案、风险、待决策事项，最后输出结构化简报并标注来源。","Help prepare a decision briefing. Clarify audience, objectives and source materials, extract verified facts, separate judgments, summarize alternatives, risks and decisions, and cite sources.")},
 {id:"compare",icon:"compare",title:t("核对两份数据","Reconcile two datasets"),description:t("匹配口径、识别差异、输出核对清单","Match keys, identify discrepancies, produce a reconciliation"),prompt:t("请协助我核对两份数据。先让我提供两份文件并确认匹配键、字段含义、时间口径及容差规则。保留原始文件，输出差异明细、未匹配项、异常原因及汇总；不确定的匹配请单独标记。","Reconcile two datasets. Ask for both files, match keys, field definitions, time scope and tolerances. Preserve originals. Output differences, unmatched rows, possible causes and totals; mark ambiguous matches.")},
 {id:"meeting",icon:"meeting",title:t("整理会议行动项","Turn meetings into actions"),description:t("决策、负责人、期限及未决事项","Decisions, owners, deadlines and open issues"),prompt:t("请根据我提供的会议记录整理行动项。区分已决定、待确认、讨论内容；每项注明负责人、截止时间、依赖与原文依据。缺失信息标记待确认，不要擅自补充。输出会议纪要及可跟踪的行动清单。","Turn my meeting notes into decisions, actions, owners, deadlines, dependencies and unresolved issues. Cite the notes and mark missing information rather than inventing it.")},
 {id:"review",icon:"review",title:t("材料质量检查","Review a document"),description:t("一致性、遗漏、引用及风险检查","Consistency, omissions, citations and risks"),prompt:t("请对我提供的材料进行质量检查。先确认用途及适用规则，再检查事实一致性、数字与日期、引用、逻辑、遗漏和潜在风险。按重要性列出位置、问题、依据与修改建议，区分明确错误和需人工核实的事项。","Review my document for factual consistency, numbers, dates, references, logic, omissions and risks. Clarify applicable rules, prioritize findings with evidence and proposed fixes, and distinguish errors from items needing human review.")},
 {id:"plan",icon:"plan",title:t("拆解工作计划","Break down a work plan"),description:t("里程碑、交付物、依赖与风险","Milestones, deliverables, dependencies and risks"),prompt:t("请把我提供的目标拆解为可执行的计划。先确认范围、资源及截止日期，列出里程碑、交付物、任务依赖、风险和下一步，并区分确定信息和假设。不替我承诺未经确认的时间。","Turn my goal into an actionable plan. Clarify scope, resources and deadline. Identify milestones, deliverables, dependencies, risks and next steps; distinguish facts from assumptions.")},
 {id:"extract",icon:"extract",title:t("多份材料信息提取","Extract across documents"),description:t("统一字段、逐条来源、缺失项","Consistent fields, source evidence and missing values"),prompt:t("请从我提供的多份材料中提取结构化信息。先确认字段、记录粒度与输出格式，再逐条提取并标注文件与页码或段落。缺失和矛盾信息单独标记，不编造数据。输出汇总表和核查清单。","Extract structured information across documents. Clarify fields, record granularity and format, cite document and page or passage, flag missing or conflicting evidence, and produce a table and verification list.")},
]}
function valid(x:unknown):x is Shortcut{if(!x||typeof x!=="object")return false;const v=x as Partial<Shortcut>;return typeof v.id==="string"&&typeof v.title==="string"&&typeof v.description==="string"&&typeof v.prompt==="string"}
export function ShortcutLibrary({compact=false}:{compact?:boolean}){
 const ctx=useWorkbench(),t=useCopy()
 const [stored,setStored]=useStored<Shortcut[]>("shortcuts",defaults(t))
 const list=Array.isArray(stored)?stored.filter(valid):defaults(t)
 const [query,setQuery]=React.useState(""),[editing,setEditing]=React.useState<Shortcut|null>(null),[deleting,setDeleting]=React.useState<Shortcut|null>(null)
 const visible=list.filter(x=>(x.title+" "+x.description).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
 const update=(patch:Partial<Shortcut>)=>setEditing(old=>old?{...old,...patch}:old)
 const save=()=>{if(!editing||!editing.title.trim()||!editing.prompt.trim())return;const next={...editing,title:editing.title.trim(),prompt:editing.prompt.trim()};setStored(list.some(x=>x.id===next.id)?list.map(x=>x.id===next.id?next:x):[...list,next]);setEditing(null)}
 const run=(x:Shortcut)=>ctx.start(ctx.workspaces.some(w=>w.id===x.workspaceId)?x.workspaceId:undefined,x.prompt)
 return <section className="wb-section wb-shortcuts"><div className="wb-section-heading"><div><h2>{t("常用工作","Quick actions")}</h2><p>{t("将经常重复的工作保存为一键发起的任务。","Save recurring tasks as reusable conversation starters.")}</p></div><Button variant="outline" size="sm" onClick={()=>setEditing({id:key(),title:"",description:"",prompt:"",icon:"custom"})}><Plus/>{t("添加","Add")}</Button></div>
 {!compact&&<div className="wb-search"><Search size={16}/><Input aria-label={t("搜索能力","Search actions")} placeholder={t("搜索常用工作…","Search actions…")} value={query} onChange={e=>setQuery(e.target.value)}/></div>}
 <div className={compact?"wb-shortcut-grid":"wb-shortcut-list"}>{visible.map(x=>{const Icon=icons[x.icon as keyof typeof icons]??Sparkles;return <article className="wb-shortcut" key={x.id}><Button type="button" variant="ghost" className="wb-shortcut-launch" disabled={!ctx.workspaces.length} onClick={()=>run(x)}><span className="wb-shortcut-icon"><Icon/></span><span className="wb-shortcut-copy"><strong>{x.title}</strong><small>{x.description}</small></span><ArrowUpRight className="wb-row-arrow"/></Button><div className="wb-shortcut-actions"><Button size="icon-xs" variant="ghost" aria-label={t("编辑","Edit")+" "+x.title} onClick={()=>setEditing({...x})}><Pencil/></Button><Button size="icon-xs" variant="ghost" aria-label={t("删除","Delete")+" "+x.title} onClick={()=>setDeleting(x)}><Trash2/></Button></div></article>})}</div>
 {!visible.length&&<p className="wb-empty">{t("暂无匹配的常用工作。","No matching actions.")}</p>}
 {!ctx.workspaces.length&&<p className="wb-section-note">{t("先在 DSH 添加工作区，即可发起任务。","Add a DSH workspace to launch actions.")}</p>}
 <Dialog open={!!editing} onOpenChange={v=>{if(!v)setEditing(null)}}><DialogContent showCloseButton={false}><DialogTitle>{t("编辑常用工作","Edit action")}</DialogTitle><DialogDescription>{t("点击此入口会将任务说明带入 DSH 原生对话，不会自动发送。","The action opens a native DSH conversation with a prepared draft; it does not send automatically.")}</DialogDescription>{editing&&<div className="wb-stack"><label className="wb-field">{t("名称","Name")}<Input value={editing.title} maxLength={60} onChange={e=>update({title:e.target.value})}/></label><label className="wb-field">{t("说明","Description")}<Input value={editing.description} maxLength={120} onChange={e=>update({description:e.target.value})}/></label><label className="wb-field">{t("任务说明","Task prompt")}<Textarea rows={5} maxLength={4000} value={editing.prompt} onChange={e=>update({prompt:e.target.value})}/></label><div className="wb-field">{t("工作区","Workspace")}<ChoiceSelect label={t("工作区","Workspace")} value={ctx.workspaces.some(w=>w.id===editing.workspaceId)?editing.workspaceId!:DEFAULT} options={[{value:DEFAULT,label:t("每次选择工作区","Choose workspace each time")},...ctx.workspaces.map(w=>({value:w.id,label:w.title}))]} onChange={v=>update({workspaceId:v===DEFAULT?undefined:v})}/></div></div>}<DialogFooter><Button variant="outline" onClick={()=>setEditing(null)}>{t("取消","Cancel")}</Button><Button disabled={!editing?.title.trim()||!editing?.prompt.trim()} onClick={save}>{t("保存","Save")}</Button></DialogFooter></DialogContent></Dialog>
 <ConfirmDialog open={!!deleting} title={t("删除常用工作","Delete action")} description={deleting?.title??""} cancel={t("取消","Cancel")} confirm={t("删除","Delete")} destructive onCancel={()=>setDeleting(null)} onConfirm={()=>{if(deleting)setStored(list.filter(x=>x.id!==deleting.id));setDeleting(null)}}/>
 </section>
}
export function Suggestions(){
 const ctx=useWorkbench(),t=useCopy()
 type Suggestion={id:string;title:string;detail:string;Icon:typeof Sparkles;run:()=>void}
 // The ranking is deterministic and uses actual host activity, never invented
 // sessions or a hidden model call. Session contents are not read.
 const recent=ctx.sessions.slice(0,12)
 const semantic=ctx.recommendations??[]
 const refresh=()=>ctx.personal(t("请阅读我授权的近期业务会话，找出最多三项有具体依据、值得下一步开展的工作建议。不要仅根据标题推断，先读取实际消息，并调用 personal_suggest 将建议及来源事件保存到工作台。","Read the approved business conversations. Identify up to three actionable next steps with concrete evidence; read actual messages, then call personal_suggest to save recommendations with source events."),true)
 const next:Suggestion[]=semantic.map((r,i)=>({id:"semantic:"+i,title:r.title,detail:r.description,Icon:Sparkles,run:()=>ctx.open(r.sessionId)}))
 const attention=recent.find(s=>s.status==="attention")
 const completed=recent.find(s=>s.status==="completed")
 const running=recent.find(s=>s.status==="running")
 if(new Set(recent.map(s=>s.workspaceId).filter(Boolean)).size>=2)next.push({id:"personal-summary",title:t("综合跨项目工作进展","Review work across projects"),detail:t("选择会话后由个人助手阅读实际内容","Choose conversations for the assistant to read"),Icon:ClipboardList,run:()=>ctx.personal(t("根据我授权的会话，综合近期各项目的工作进展、待办、交付风险和可能的下一步。先读取相关消息，引用来源；不要把标题当作事实。","Read my approved conversations and summarize project progress, open tasks, delivery risks and next steps with evidence."))})
 if(attention)next.push({id:attention.id,title:t("处理待确认事项","Review pending input"),detail:attention.title,Icon:CircleAlert,run:()=>ctx.open(attention.id)})
 if(completed)next.push({id:completed.id,title:t("查看最新交付结果","Review new results"),detail:completed.title,Icon:CheckCircle2,run:()=>ctx.open(completed.id)})
 // Offer a cross-session synthesis only within one real workspace. Titles
 // are explicit hints, not evidence of completed work.
 const workspace=ctx.workspaces.map(w=>({w,sessions:recent.filter(s=>s.workspaceId===w.id)})).sort((a,b)=>b.sessions.length-a.sessions.length)[0]
 if(workspace&&workspace.sessions.length>=2){
  const titles=workspace.sessions.slice(0,5).map(s=>s.title)
  next.push({id:"summary:"+workspace.w.id,title:t("整理近期工作进展","Summarize recent work"),detail:workspace.w.title+" · "+workspace.sessions.length+t(" 个近期会话"," recent conversations"),Icon:ClipboardList,run:()=>ctx.start(workspace.w.id,t("请协助整理近期工作进展。以下仅为近期会话标题，请先向我确认实际进展与资料，不要把标题当作事实。按已完成、进行中、风险、下一步输出工作简报：\n","Help summarize recent work. These are conversation titles only; ask me to confirm actual progress and evidence. Organize completed work, ongoing tasks, risks and next steps:\n")+titles.map(x=>"- "+x).join("\n"))})
 }
 const last=recent.find(s=>!next.some(x=>x.id===s.id))
 if(last){const lower=last.title.toLocaleLowerCase();const review=/报告|汇报|材料|方案|文档|report|document|proposal/.test(lower);const data=/数据|表格|核对|分析|excel|spreadsheet|data/.test(lower);const title=review?t("检查材料是否达到交付要求","Check deliverable readiness"):data?t("复核分析与数据口径","Verify analysis and data definitions"):running?.id===last.id?t("查看正在进行的工作","Check ongoing work"):t("继续上次工作","Resume recent work");next.push({id:last.id,title,detail:last.title,Icon:review?FileCheck:data?GitCompare:Clock,run:()=>ctx.open(last.id)})}
 if(!next.length)return <section className="wb-section"><div className="wb-section-heading"><h2>{t("猜你想做","Suggested for you")}</h2><Button variant="outline" size="sm" disabled={!ctx.sessions.some(s=>s.workspaceId)} onClick={refresh}><Sparkles/>{t("生成建议","Generate suggestions")}</Button></div><p className="wb-empty wb-suggestion-empty">{t("开始使用 DSH 后，这里会根据近期会话与任务状态推荐下一步。","Suggestions appear here when you start using DSH.")}</p></section>
 return <section className="wb-section"><div className="wb-section-heading"><div><h2>{t("猜你想做","Suggested for you")}</h2><p>{semantic.length?t("AI 建议基于已授权的会话内容，点击查看来源","AI suggestions use approved conversation content; open the source") : t("基于活动状态推荐，可按需生成内容建议","Activity-based suggestions; generate content-aware advice on demand")}</p></div><Button variant="outline" size="sm" disabled={!ctx.sessions.some(s=>s.workspaceId)} onClick={refresh}><Sparkles/>{t("生成建议","Generate suggestions")}</Button></div><div className="wb-suggestions">{next.slice(0,3).map(({id,title,detail,Icon,run})=><Button key={id} variant="outline" className="wb-suggestion" onClick={run}><Icon/><span><strong>{title}</strong><small>{detail}</small></span><ArrowRight className="wb-row-arrow"/></Button>)}</div></section>
}
