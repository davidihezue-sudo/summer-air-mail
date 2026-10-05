import { ArrowUpRight, Download, FileText } from 'lucide-react'
import type { Block } from '../../content/types'
import { useContent } from '../../hooks/useContent'
import { AnimatedNumber } from '../ui/AnimatedNumber'
import { ClassBadge } from '../ui/Badge'
import { RichText } from '../ui/RichText'
import { VideoPlayer } from '../ui/VideoPlayer'
import { BarChart, LineChart } from '../charts/Charts'
import { BeforeAfter } from '../case-studies/BeforeAfter'
import { hasValue, parseVideo, safeHref } from '../../utils/text'
import { platformLabel } from '../ui/Icons'
import { useViewer } from './Viewer'
import { DashboardBlock, FlowBlock, MetricTreeBlock, QueryBlock } from './DataBlocks'

function host(url: string) {
  try { return new URL(url, 'https://x.invalid').hostname.replace(/^www\./, '').replace(/^x\.invalid$/, '') } catch { return '' }
}

function LinkCard({ url, label, description }: { url: string; label: string; description?: string }) {
  const href = safeHref(url)
  if (!href) return null
  const h = host(href)
  return (
    <a className="linkcard" href={href} target="_blank" rel="noopener noreferrer">
      <span className="linkcard__body">
        <strong>{label || h || href}</strong>
        {description && <span>{description}</span>}
        {h && <span className="linkcard__host">{h}</span>}
      </span>
      <ArrowUpRight aria-hidden size={20} />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}

function BlockView({ b }: { b: Block }) {
  const { content } = useContent()
  const locale = content.portfolio.site.locale
  const { openImages } = useViewer()
  const zoomable = (images: { src: string; alt: string; caption?: string }[], i: number) => openImages(images, i)

  switch (b.type) {
    case 'heading':
      return Number(b.level) === 3 ? <h4 className="blk-h blk-h--3">{b.text}</h4> : <h3 className="blk-h">{b.text}</h3>
    case 'paragraph':
      return <RichText text={b.text} />
    case 'image':
    case 'screenshot':
      if (!b.image?.src) return null
      return (
        <figure className={`blk-fig ${b.type === 'screenshot' ? 'blk-fig--shot' : ''}`}>
          <button type="button" onClick={() => zoomable([{ ...b.image!, caption: b.caption }], 0)} aria-label={`View full size: ${b.caption || b.image.alt || 'image'}`}>
            <img src={b.image.src} alt={b.image.alt} width={b.image.width} height={b.image.height} loading="lazy" decoding="async" />
          </button>
          {b.caption && <figcaption>{b.caption}</figcaption>}
        </figure>
      )
    case 'gallery': {
      const imgs = (b.images ?? []).filter((i) => i.src)
      if (!imgs.length) return null
      const list = imgs.map((i) => ({ ...i, caption: b.caption }))
      return (
        <figure className="blk-gallery">
          <div className="blk-gallery__grid">
            {imgs.map((im, i) => (
              <button key={im.src + i} type="button" onClick={() => zoomable(list, i)} aria-label={`View image ${i + 1} of ${imgs.length} full size`}>
                <img src={im.src} alt={im.alt} width={im.width} height={im.height} loading="lazy" decoding="async" />
              </button>
            ))}
          </div>
          {b.caption && <figcaption>{b.caption}</figcaption>}
        </figure>
      )
    }
    case 'video':
    case 'reel':
      if (parseVideo(b.src).kind === 'none') return null
      return (
        <figure className={`blk-video ${b.type === 'reel' ? 'blk-video--reel' : ''}`}>
          <VideoPlayer src={b.src} poster={b.poster} title={b.title || 'Video'} vertical={b.type === 'reel'} />
          {(b.title || b.caption) && <figcaption>{b.title && <strong>{b.title}. </strong>}{b.caption}</figcaption>}
        </figure>
      )
    case 'link':
      return <LinkCard url={b.url ?? ''} label={b.label ?? ''} description={b.description} />
    case 'button': {
      const href = safeHref(b.url)
      return href && hasValue(b.label) ? <p><a className="btn btn--solid" href={href} target="_blank" rel="noopener noreferrer">{b.label}<span className="sr-only"> (opens in a new tab)</span></a></p> : null
    }
    case 'quote':
      return hasValue(b.text) ? <blockquote className="blk-quote"><p>{b.text}</p>{b.attribution && <footer>{b.attribution}</footer>}</blockquote> : null
    case 'metric':
      if (typeof b.value !== 'number') return null
      return (
        <div className="blk-metric">
          {b.classification && <ClassBadge value={b.classification} />}
          <p className="blk-metric__num"><AnimatedNumber value={b.value} locale={locale} prefix={b.prefix} suffix={b.unit} /></p>
          <p className="blk-metric__label">{b.label}</p>
          {(b.period || b.note) && <p className="fineprint">{b.period && `Measured over ${b.period}. `}{b.note}</p>}
        </div>
      )
    case 'chart': {
      const pts = (b.points ?? []).filter((p) => hasValue(p.label))
      if (!pts.length) return null
      const C = b.chart === 'line' ? LineChart : BarChart
      return (
        <div className="blk-chart">
          <C points={pts} title={b.title} prefix={b.prefix} unit={b.unit} locale={locale} />
          {(b.period || b.note) && <p className="fineprint">{b.period && `Measured over ${b.period}. `}{b.note}</p>}
        </div>
      )
    }
    case 'beforeAfter':
      return b.before?.src && b.after?.src ? <BeforeAfter before={b.before} after={b.after} caption={b.caption} variant={b.variant} /> : null
    case 'embed': {
      const v = parseVideo(b.url)
      if (v.kind === 'none') return null
      if (v.kind === 'external') return <LinkCard url={b.url ?? ''} label={b.title || 'View post'} description={b.caption} />
      return (
        <figure className="blk-video">
          <VideoPlayer src={b.url} title={b.title || 'Embedded video'} />
          {(b.title || b.caption) && <figcaption>{b.caption || b.title}</figcaption>}
        </figure>
      )
    }
    case 'pdf':
    case 'download': {
      const href = safeHref(b.url)
      if (!href) return null
      return (
        <div className="filecard">
          <FileText aria-hidden size={28} />
          <span className="filecard__body"><strong>{b.title || 'Document'}</strong>{b.description && <span>{b.description}</span>}</span>
          {b.type === 'pdf' && <a className="btn btn--ghost" href={href} target="_blank" rel="noopener noreferrer">Open<span className="sr-only"> {b.title} (opens in a new tab)</span></a>}
          <a className="btn btn--ghost" href={href} download={b.filename || undefined}><Download size={16} aria-hidden /> Download<span className="sr-only"> {b.title}</span></a>
        </div>
      )
    }
    case 'timeline':
      return (b.entries ?? []).length ? (
        <ol className="blk-timeline">{b.entries!.map((e, i) => <li key={i}><strong>{e.label}</strong><span>{e.text}</span></li>)}</ol>
      ) : null
    case 'process':
      return (b.entries ?? []).length ? (
        <ol className="steps blk-steps">{b.entries!.map((e, i) => <li key={i}><strong>{e.label}</strong> {e.text}</li>)}</ol>
      ) : null
    case 'framework':
      return (b.columns ?? []).length ? (
        <div className="blk-frame">
          {b.title && <h4 className="h4">{b.title}</h4>}
          <div className="blk-frame__cols">{b.columns!.map((c) => <div key={c.title}><h5 className="h5">{c.title}</h5><ul className="ticks">{c.items.map((i) => <li key={i}>{i}</li>)}</ul></div>)}</div>
        </div>
      ) : null
    case 'skills':
    case 'platforms':
      return (b.items ?? []).length ? (
        <div>{b.title && <h4 className="h4">{b.title}</h4>}<ul className="chips">{b.items!.map((i) => <li key={i}>{b.type === 'platforms' ? platformLabel(i) : i}</li>)}</ul></div>
      ) : null
    case 'flow':
      return <FlowBlock b={b} />
    case 'query':
      return <QueryBlock b={b} />
    case 'dashboard':
      return <DashboardBlock b={b} />
    case 'metricTree':
      return <MetricTreeBlock b={b} />
    default:
      return null
  }
}

/** Renders project blocks in order. Unknown or empty blocks render nothing, so a half-filled block never breaks the page. */
export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <div className="blocks">
      {blocks.map((b) => <div key={b.id} className={`block block--${b.type}`}><BlockView b={b} /></div>)}
    </div>
  )
}
