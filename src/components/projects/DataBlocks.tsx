import { useState } from 'react'
import { Check, Copy, ExternalLink } from 'lucide-react'
import type { Block } from '../../content/types'
import { highlight } from '../../utils/highlight'
import { hasValue } from '../../utils/text'
import { dashboardEmbedUrl } from '../../../shared/head.mjs'

const LANGUAGE_LABEL: Record<string, string> = { sql: 'SQL', python: 'Python', dax: 'DAX', r: 'R', other: 'Code' }

/** A journey, automation or data flow. Each step opens to show what happens there; decisions show their outcomes. */
export function FlowBlock({ b }: { b: Block }) {
  const nodes = (b.nodes ?? []).filter((n) => hasValue(n.label))
  const [open, setOpen] = useState<number | null>(null)
  if (!nodes.length) return null
  return (
    <figure className="flow">
      {(hasValue(b.title) || hasValue(b.caption)) && <figcaption>{b.title && <strong>{b.title}. </strong>}{b.caption}</figcaption>}
      <ol className="flow__chain">
        {nodes.map((n, i) => {
          const branches = (n.branches ?? []).filter((x) => hasValue(x.condition) || hasValue(x.outcome))
          const expandable = hasValue(n.detail)
          return (
            <li key={i} className={`flow__node flow__node--${n.kind}`}>
              {expandable ? (
                <button type="button" className="flow__card" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
                  <span className="flow__kind">{({ start: 'Start', step: 'Step', decision: 'Decision', system: 'System', end: 'Result' })[n.kind]}</span>
                  <strong>{n.label}</strong>
                </button>
              ) : (
                <div className="flow__card">
                  <span className="flow__kind">{({ start: 'Start', step: 'Step', decision: 'Decision', system: 'System', end: 'Result' })[n.kind]}</span>
                  <strong>{n.label}</strong>
                </div>
              )}
              {expandable && open === i && <p className="flow__detail">{n.detail}</p>}
              {branches.length > 0 && (
                <ul className="flow__branches">
                  {branches.map((x, j) => <li key={j}><span>If {x.condition || '...'}</span> <span aria-hidden>&rarr;</span><span className="sr-only"> then </span> <strong>{x.outcome}</strong></li>)}
                </ul>
              )}
            </li>
          )
        })}
      </ol>
    </figure>
  )
}

/** The query or code behind a result, coloured and copyable, with a plain-English line on what it answers. */
export function QueryBlock({ b }: { b: Block }) {
  const [copied, setCopied] = useState(false)
  const code = b.code ?? ''
  if (!hasValue(code)) return null
  const lang = b.language ?? 'other'
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); window.setTimeout(() => setCopied(false), 1600) } catch { /* clipboard blocked: the text is still selectable */ }
  }
  return (
    <figure className="query">
      <figcaption className="query__head">
        <span><strong>{b.title || 'Query'}</strong> <span className="query__lang">{LANGUAGE_LABEL[lang] ?? 'Code'}</span></span>
        <button type="button" className="query__copy" onClick={copy}>{copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />} {copied ? 'Copied' : 'Copy'}</button>
      </figcaption>
      <pre className="query__code" tabIndex={0}><code>{highlight(code, lang).map((t, i) => (t.type === 'text' ? t.text : <span key={i} className={`tok tok--${t.type}`}>{t.text}</span>))}</code></pre>
      {hasValue(b.text) && <p className="query__says"><strong>What it answers.</strong> {b.text}</p>}
    </figure>
  )
}

/** A live report from Looker Studio, Tableau Public or Power BI. Nothing loads until the visitor asks, so the page stays fast and no third party sees them by default. */
export function DashboardBlock({ b }: { b: Block }) {
  const [on, setOn] = useState(false)
  const src = dashboardEmbedUrl(b.url)
  if (!hasValue(b.url)) return null
  const height = Math.min(1400, Math.max(300, Number(b.height) || 520))
  if (!src) {
    return <a className="linkcard" href={b.url} target="_blank" rel="noopener noreferrer"><span className="linkcard__body"><strong>{b.title || 'Open the dashboard'}</strong>{b.caption && <span>{b.caption}</span>}</span><ExternalLink size={20} aria-hidden /><span className="sr-only"> (opens in a new tab)</span></a>
  }
  return (
    <figure className="dash">
      {on ? (
        <iframe className="dash__frame" src={src} title={b.title || 'Live dashboard'} style={{ height }} loading="lazy" referrerPolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-popups" allowFullScreen />
      ) : (
        <div className="dash__gate" style={{ minHeight: Math.min(height, 260) }}>
          <strong>{b.title || 'Live dashboard'}</strong>
          <p>This loads a live report from {new URL(src).hostname}. Nothing is loaded until you ask.</p>
          <button type="button" className="btn btn--solid" onClick={() => setOn(true)}>Load the live dashboard</button>
        </div>
      )}
      {hasValue(b.caption) && <figcaption>{b.caption}</figcaption>}
    </figure>
  )
}

/** A goal, the measures that tell you how it is going, and the levers behind each. Values appear only if the owner wrote them. */
export function MetricTreeBlock({ b }: { b: Block }) {
  const branches = (b.tree ?? []).filter((x) => hasValue(x.label))
  if (!branches.length && !hasValue(b.title)) return null
  return (
    <figure className="mtree">
      <div className="mtree__goal">
        <span className="mtree__tag">Goal</span>
        <strong>{b.title || 'Goal'}</strong>
        {hasValue(b.note) && <span className="mtree__note">{b.note}</span>}
      </div>
      {branches.length > 0 && (
        <ul className="mtree__branches">
          {branches.map((x, i) => (
            <li key={i} className="mtree__branch">
              <div className="mtree__measure">
                <span className="mtree__tag">Measure</span>
                <strong>{x.label}</strong>
                {hasValue(x.value) && <span className="mtree__value">{x.value}</span>}
                {hasValue(x.note) && <span className="mtree__note">{x.note}</span>}
              </div>
              {(x.children ?? []).some((c) => hasValue(c.label)) && (
                <ul className="mtree__levers">
                  {(x.children ?? []).filter((c) => hasValue(c.label)).map((c, j) => (
                    <li key={j}><span className="mtree__tag">Lever</span> <strong>{c.label}</strong>{hasValue(c.value) && <span className="mtree__value"> {c.value}</span>}{hasValue(c.note) && <span className="mtree__note"> {c.note}</span>}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </figure>
  )
}
