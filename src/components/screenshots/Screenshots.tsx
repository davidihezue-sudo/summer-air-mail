import { useMemo, useState } from 'react'
import { useContent } from '../../hooks/useContent'
import { getScreenshots } from '../../content/selectors'
import type { ScreenshotItem, SectionConfig } from '../../content/types'
import { Section } from '../ui/Section'
import { BeforeAfter } from '../case-studies/BeforeAfter'
import { useViewer } from '../projects/Viewer'

export function ScreenshotGrid({ items }: { items: ScreenshotItem[] }) {
  const { openImages } = useViewer()
  const mediaUi = useContent().content.portfolio.media
  const layout = mediaUi.screenshots
  const singles = items.filter((i) => !i.compareWith?.src)
  const viewer = singles.map((i) => ({ ...i.image, caption: i.caption }))
  return (
    <div className={`shots shots--${layout} shots--${mediaUi.screenshotSize}`}>
      {items.map((s) => {
        if (s.compareWith?.src) {
          return (
            <div key={s.id} className="shots__compare">
              <BeforeAfter before={s.image} after={s.compareWith} caption={s.caption} size={s.size} />
            </div>
          )
        }
        const idx = singles.findIndex((x) => x.id === s.id)
        return (
          <figure key={s.id} className={`shot ${s.size ? `shot--${s.size}` : ''}`}>
            <button type="button" onClick={() => openImages(viewer, idx)} aria-label={`View full size: ${s.caption || s.image.alt || 'screenshot'}`}>
              <img src={s.image.src} alt={s.image.alt || s.caption || 'Screenshot'} width={s.image.width} height={s.image.height} loading="lazy" decoding="async" />
            </button>
            {s.caption && <figcaption>{s.caption}</figcaption>}
          </figure>
        )
      })}
    </div>
  )
}

export function Screenshots({ config }: { config: SectionConfig }) {
  const { content } = useContent()
  const items = getScreenshots(content)
  const cats = useMemo(() => [...new Set(items.map((i) => i.category).filter((c): c is string => !!c))], [items])
  const [cat, setCat] = useState('')
  const shown = items.filter((i) => !cat || i.category === cat)
  return (
    <Section config={config} tone="var(--c-sand)" eyebrow="Evidence" title="Screenshots from the work" intro="Profiles, dashboards, calendars and designs. Select any image to zoom." className="screenshots">
      {cats.length > 1 && (
        <div className="filters" role="group" aria-label="Filter screenshots">
          <button type="button" className="chip" aria-pressed={!cat} onClick={() => setCat('')}>All</button>
          {cats.map((c) => <button key={c} type="button" className="chip" aria-pressed={cat === c} onClick={() => setCat(cat === c ? '' : c)}>{c}</button>)}
        </div>
      )}
      <ScreenshotGrid items={shown} />
    </Section>
  )
}
