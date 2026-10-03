import { useState } from 'react'
import { useContent } from '../../hooks/useContent'
import { getTools } from '../../content/selectors'
import type { Tool } from '../../content/types'
import { Section } from '../ui/Section'

const CATEGORY_ORDER = ['Social Media Management', 'Content Creation', 'Design', 'Analytics', 'Advertising', 'AI and Automation']
const initials = (n: string) => n.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()

function Ring({ tool }: { tool: Tool }) {
  const [flipped, setFlipped] = useState(false)
  return (
    <li className="ringitem">
      <button type="button" className={`ring ${flipped ? 'is-flipped' : ''}`} aria-pressed={flipped} onClick={() => setFlipped((f) => !f)} aria-label={`${tool.name}. ${flipped ? 'Hide' : 'Show'} how I use it`}>
        <span className="ring__float">
          <span className="ring__face ring__face--front" style={{ ['--tone' as string]: tool.color ?? 'var(--c-sea)' }}>
            <span className="ring__water" aria-hidden />
            {tool.logo ? <img src={tool.logo} alt="" width={64} height={64} loading="lazy" /> : <span className="ring__mono">{initials(tool.name)}</span>}
          </span>
          <span className="ring__face ring__face--back"><span>{tool.usage}</span></span>
        </span>
      </button>
      <span className="ringitem__name">{tool.name}</span>
    </li>
  )
}

export function Tools() {
  const { content } = useContent()
  const tools = getTools(content)
  const groups = CATEGORY_ORDER.map((c) => ({ c, items: tools.filter((t) => t.category === c) })).filter((g) => g.items.length)
  return (
    <Section id="tools" tone="var(--c-sea)" dark eyebrow="Tools and platforms" title="What floats my boat" intro="Software I genuinely use. Select a ring to see how." className="tools">
      {groups.map((g) => (
        <div key={g.c} className="toolgroup">
          <h3 className="h4 toolgroup__title">{g.c}</h3>
          <ul className="toolrow" tabIndex={0} aria-label={`${g.c} tools, scroll sideways`}>
            {g.items.map((t) => <Ring key={t.id} tool={t} />)}
          </ul>
        </div>
      ))}
    </Section>
  )
}
