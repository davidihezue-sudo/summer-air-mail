import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'
import type { SectionConfig, Tool } from '../../content/types'
import { useContent } from '../../hooks/useContent'
import { getTools, toolCategories } from '../../content/selectors'
import { brandColor } from '../../content/brands'
import { Section } from '../ui/Section'
import { ToolLogo } from '../ui/ToolLogo'
import { useTheme } from '../../hooks/useTheme'
import { hasValue, safeHref } from '../../utils/text'

const CATEGORY_ORDER = ['Social Media Management', 'Content Creation', 'Filming', 'Design', 'Analytics', 'Advertising', 'AI and Automation', 'Workflow and Automation']
const accent = (t: Tool) => ({ ['--brand' as string]: brandColor(t) }) as CSSProperties

function Name({ tool, link = true }: { tool: Tool; link?: boolean }) {
  const href = link ? safeHref(tool.link) : ''
  return href ? <a href={href} target="_blank" rel="noopener noreferrer">{tool.name}<span className="sr-only"> (opens in a new tab)</span></a> : <>{tool.name}</>
}

function useUi() {
  const { content } = useContent()
  const ui = content.portfolio.toolsUi
  return { ui, mono: ui.logoStyle === 'mono' || ui.tile === 'bare' }
}

/** Logo, name, category and how it is used, all visible without a click. */
function Card({ tool }: { tool: Tool }) {
  const { ui, mono } = useUi()
  return (
    <li className="toolcard" style={accent(tool)}>
      {ui.showLogos && <ToolLogo tool={tool} size={ui.logoSize} mono={mono} />}
      <div className="toolcard__body">
        <h4 className="toolcard__name"><Name tool={tool} /></h4>
        {ui.showCategory && <p className="toolcard__cat">{toolCategories(tool).join(' · ')}</p>}
        {ui.showUsage && hasValue(tool.usage) && <p className="toolcard__use">{tool.usage}</p>}
      </div>
    </li>
  )
}

/** Logos only. The name appears on hover or focus (and for screen readers) unless names are switched on. */
function WallItem({ tool }: { tool: Tool }) {
  const { ui, mono } = useUi()
  const href = safeHref(tool.link)
  const inner = (
    <>
      <ToolLogo tool={tool} size={ui.logoSize === 'sm' ? 'md' : 'lg'} mono={mono} />
      {ui.showNames ? <span className="toolwall__name">{tool.name}</span> : <span className="sr-only">{tool.name}</span>}
    </>
  )
  return (
    <li className="toolwall__item" style={accent(tool)} data-name={ui.showNames ? undefined : tool.name}>
      {href ? <a href={href} target="_blank" rel="noopener noreferrer" className="toolwall__link" title={tool.name}>{inner}<span className="sr-only"> (opens in a new tab)</span></a> : <span className="toolwall__link" tabIndex={ui.showNames ? undefined : 0} title={tool.name}>{inner}</span>}
    </li>
  )
}

function Row({ tool }: { tool: Tool }) {
  const { ui, mono } = useUi()
  return (
    <li className="toolrowitem" style={accent(tool)}>
      {ui.showLogos && <ToolLogo tool={tool} size={ui.logoSize} mono={mono} />}
      <div className="toolrowitem__main">
        <h4 className="toolcard__name"><Name tool={tool} /></h4>
        {ui.showCategory && <p className="toolcard__cat">{toolCategories(tool).join(' · ')}</p>}
      </div>
      {ui.showUsage && hasValue(tool.usage) && <p className="toolrowitem__use">{tool.usage}</p>}
    </li>
  )
}

/** True when the scrolling strip shows only the logos, in their own colours: no name, no pill, no tile. */
const logosOnly = (ui: { layout: string; marquee?: string; showLogos: boolean }) => ui.layout === 'marquee' && ui.marquee !== 'chips' && ui.showLogos

function Chip({ tool, hidden }: { tool: Tool; hidden?: boolean }) {
  const { ui, mono } = useUi()
  if (logosOnly(ui)) {
    return (
      <li className="toolchip toolchip--icon" style={accent(tool)} aria-hidden={hidden || undefined} title={tool.name}>
        <ToolLogo tool={tool} size={ui.logoSize} />
        <span className="sr-only">{tool.name}</span>
      </li>
    )
  }
  return (
    <li className="toolchip" style={accent(tool)} aria-hidden={hidden || undefined}>
      {ui.showLogos && <ToolLogo tool={tool} size="sm" mono={mono} />}
      <span><strong>{tool.name}</strong>{ui.showUsage && hasValue(tool.usage) && <small>{tool.usage}</small>}</span>
    </li>
  )
}

function Ring({ tool }: { tool: Tool }) {
  const { ui, mono } = useUi()
  const [flipped, setFlipped] = useState(false)
  return (
    <li className="ringitem">
      <button type="button" className={`ring ${flipped ? 'is-flipped' : ''}`} aria-pressed={flipped} onClick={() => setFlipped((f) => !f)} aria-label={`${tool.name}. ${flipped ? 'Hide' : 'Show'} how I use it`}>
        <span className="ring__float">
          <span className="ring__face ring__face--front">
            <span className="ring__water" aria-hidden />
            {ui.showLogos && <ToolLogo tool={tool} size="lg" mono={mono} />}
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
  const all = getTools(content)
  const { copy } = useTheme()
  const [cat, setCat] = useState('')
  const cats = useMemo(() => [...new Set([...CATEGORY_ORDER, ...all.flatMap(toolCategories)])].filter((c) => all.some((t) => toolCategories(t).includes(c))), [all])
  const useTabs = ui.tabs && cats.length > 1 && ui.layout !== 'marquee'
  const shown = useTabs && cat ? all.filter((t) => toolCategories(t).includes(cat)) : all
  const logoPx = Number(ui.logoPx) > 0 ? Math.min(160, Math.max(24, Math.round(Number(ui.logoPx)))) : 0
  const grouped = !useTabs && ui.group && ui.layout !== 'marquee'
  const groups = grouped ? cats.map((c) => ({ c, items: shown.filter((t) => toolCategories(t).includes(c)) })).filter((g) => g.items.length) : [{ c: '', items: shown }]
  const intro = ui.layout === 'rings' ? 'Software I genuinely use. Select a ring to flip it.' : ui.layout === 'wall' ? 'The software I genuinely use.' : 'Software I genuinely use, and what I use it for.'

  const body = (items: Tool[]) => {
    switch (ui.layout) {
      case 'wall': return <ul className="toolwall" data-glow={ui.glow}>{items.map((t) => <WallItem key={t.id} tool={t} />)}</ul>
      case 'list': return <ul className="toollist" data-glow={ui.glow}>{items.map((t) => <Row key={t.id} tool={t} />)}</ul>
      case 'compact': return <ul className="toolgrid toolgrid--compact" data-glow={ui.glow}>{items.map((t) => <Card key={t.id} tool={t} />)}</ul>
      case 'rings': return <ul className="toolrow" tabIndex={0} aria-label="Tools, scroll sideways">{items.map((t) => <Ring key={t.id} tool={t} />)}</ul>
      case 'marquee': return (
        <div className="toolmarquee" aria-label="Tools I use">
          <ul className="toolmarquee__track">{items.map((t) => <Chip key={t.id} tool={t} />)}{items.map((t) => <Chip key={`${t.id}-2`} tool={t} hidden />)}</ul>
        </div>
      )
      default: return <ul className="toolgrid toolgrid--cards" data-glow={ui.glow}>{items.map((t) => <Card key={t.id} tool={t} />)}</ul>
    }
  }

  return (
    <Section config={config} tone="var(--c-sea-deep)" dark eyebrow="Tools and platforms" title={copy.toolsTitle} intro={intro} className={`tools tools--${ui.layout} tools--tile-${ui.tile}${logoPx ? ' tools--px' : ''}${logosOnly(ui) ? ` tools--strip-logos${ui.logosBand ? ' tools--band' : ''}` : ''}`}>
      {useTabs && (
        <div className="filters toolfilters" role="group" aria-label="Filter tools by category">
          <button type="button" className="chip" aria-pressed={!cat} onClick={() => setCat('')}>All <span className="toolfilters__n">{all.length}</span></button>
          {cats.map((c) => <button key={c} type="button" className="chip" aria-pressed={cat === c} onClick={() => setCat(cat === c ? '' : c)}>{c} <span className="toolfilters__n">{all.filter((t) => toolCategories(t).includes(c)).length}</span></button>)}
        </div>
      )}
      {groups.map((g) => (
        <div key={g.c || 'all'} className="toolgroup" style={logoPx ? ({ ['--tool-logo' as string]: `${logoPx}px` } as CSSProperties) : undefined}>
          {g.c && <h3 className="h4 toolgroup__title">{g.c}</h3>}
          {body(g.items)}
        </div>
      ))}
    </Section>
  )
}
