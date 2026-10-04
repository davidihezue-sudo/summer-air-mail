import type { SectionConfig, Tool } from '../../content/types'
import { useState } from 'react'
import { useContent } from '../../hooks/useContent'
import { getTools } from '../../content/selectors'
import { Section } from '../ui/Section'
import { ToolLogo } from '../ui/ToolLogo'
import { useTheme } from '../../hooks/useTheme'
import { hasValue, safeHref } from '../../utils/text'

const CATEGORY_ORDER = ['Social Media Management', 'Content Creation', 'Design', 'Analytics', 'Advertising', 'AI and Automation']

function Name({ tool }: { tool: Tool }) {
  const href = safeHref(tool.link)
  return href ? <a href={href} target="_blank" rel="noopener noreferrer">{tool.name}<span className="sr-only"> (opens in a new tab)</span></a> : <>{tool.name}</>
}

/** Everything is visible without clicking: logo, name, category and how it is used. */
function Card({ tool }: { tool: Tool }) {
  const { content } = useContent()
  const ui = content.portfolio.toolsUi
  return (
    <li className="toolcard">
      {ui.showLogos && <ToolLogo tool={tool} size={ui.logoSize} mono={ui.logoStyle === 'mono'} />}
      <div className="toolcard__body">
        <h4 className="toolcard__name"><Name tool={tool} /></h4>
        {ui.showCategory && <p className="toolcard__cat">{tool.category}</p>}
        {ui.showUsage && hasValue(tool.usage) && <p className="toolcard__use">{tool.usage}</p>}
      </div>
    </li>
  )
}

function Ring({ tool }: { tool: Tool }) {
  const { content } = useContent()
  const ui = content.portfolio.toolsUi
  const [flipped, setFlipped] = useState(false)
  return (
    <li className="ringitem">
      <button type="button" className={`ring ${flipped ? 'is-flipped' : ''}`} aria-pressed={flipped} onClick={() => setFlipped((f) => !f)} aria-label={`${tool.name}. ${flipped ? 'Hide' : 'Show'} how I use it`}>
        <span className="ring__float">
          <span className="ring__face ring__face--front">
            <span className="ring__water" aria-hidden />
            {ui.showLogos && <ToolLogo tool={tool} size="lg" mono={ui.logoStyle === 'mono'} />}
          </span>
          <span className="ring__face ring__face--back"><span>{hasValue(tool.usage) ? tool.usage : tool.name}</span></span>
        </span>
      </button>
      <span className="ringitem__name"><Name tool={tool} /></span>
      {ui.showUsage && hasValue(tool.usage) && <span className="ringitem__use">{tool.usage}</span>}
    </li>
  )
}

export function Tools({ config }: { config: SectionConfig }) {
  const { content } = useContent()
  const ui = content.portfolio.toolsUi
  const tools = getTools(content)
  const { copy } = useTheme()
  const cats = [...new Set([...CATEGORY_ORDER, ...tools.map((t) => t.category)])]
  const groups = ui.group ? cats.map((c) => ({ c, items: tools.filter((t) => t.category === c) })).filter((g) => g.items.length) : [{ c: '', items: tools }]
  const intro = ui.layout === 'rings' ? 'Software I genuinely use. Select a ring to flip it.' : 'Software I genuinely use, and what I use it for.'
  return (
    <Section config={config} tone="var(--c-sea-deep)" dark eyebrow="Tools and platforms" title={copy.toolsTitle} intro={intro} className="tools">
      {groups.map((g) => (
        <div key={g.c || 'all'} className="toolgroup">
          {g.c && <h3 className="h4 toolgroup__title">{g.c}</h3>}
          {ui.layout === 'rings' ? (
            <ul className="toolrow" tabIndex={0} aria-label={`${g.c || 'Tools'}, scroll sideways`}>{g.items.map((t) => <Ring key={t.id} tool={t} />)}</ul>
          ) : (
            <ul className={`toolgrid toolgrid--${ui.layout}`}>
              {g.items.map((t) => <Card key={t.id} tool={t} />)}
            </ul>
          )}
        </div>
      ))}
    </Section>
  )
}
