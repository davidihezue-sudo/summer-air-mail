import { Fragment, type ReactNode } from 'react'
import { safeHref } from '../../utils/text'

/**
 * Tiny, safe formatter for admin written text. Supports paragraphs (blank line), "- " bullet lists,
 * **bold**, *italic* and [label](https://link). Output is built from React elements, never from HTML strings.
 */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)\s]+\))/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const tok = m[0]
    if (tok.startsWith('**')) out.push(<strong key={i++}>{tok.slice(2, -2)}</strong>)
    else if (tok.startsWith('*')) out.push(<em key={i++}>{tok.slice(1, -1)}</em>)
    else {
      const [, label, url] = /\[([^\]]+)\]\(([^)\s]+)\)/.exec(tok) ?? []
      const href = safeHref(url)
      out.push(href ? <a key={i++} href={href} target="_blank" rel="noopener noreferrer">{label}</a> : label)
    }
    last = m.index + tok.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

export function RichText({ text, className = 'prose' }: { text?: string; className?: string }) {
  if (!text?.trim()) return null
  const blocks = text.trim().split(/\n{2,}/)
  return (
    <>
      {blocks.map((b, i) => {
        const lines = b.split('\n')
        if (lines.every((l) => /^\s*[-*] /.test(l))) {
          return <ul key={i} className="ticks">{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*[-*] /, ''))}</li>)}</ul>
        }
        return (
          <p key={i} className={className}>
            {lines.map((l, j) => <Fragment key={j}>{j > 0 && <br />}{inline(l)}</Fragment>)}
          </p>
        )
      })}
    </>
  )
}
