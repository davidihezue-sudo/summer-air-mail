import { useMemo, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { useContent } from '../../hooks/useContent'
import { useTheme } from '../../hooks/useTheme'
import { getContentItems } from '../../content/selectors'
import type { ContentItem, SectionConfig } from '../../content/types'
import { Section } from '../ui/Section'
import { VideoPlayer } from '../ui/VideoPlayer'
import { FitImage } from '../ui/FitImage'
import { guessRatio } from '../../utils/media'
import { platformLabel } from '../ui/Icons'
import { hasValue, parseVideo, safeHref } from '../../utils/text'

export function ContentCard({ item }: { item: ContentItem }) {
  const mediaUi = useContent().content.portfolio.media
  const isVideo = parseVideo(item.video).kind !== 'none'
  const link = safeHref(item.link)
  return (
    <li className="vcard">
      <div className={`vcard__media ${isVideo ? 'vcard__media--video' : 'vcard__media--image'}`}>
        {isVideo ? <VideoPlayer src={item.video} poster={item.thumbnail?.src} title={item.title} vertical /> : item.thumbnail?.src ? <FitImage image={item.thumbnail} fallbackRatio={guessRatio([item.platform])} fit={mediaUi.cardFit} fill={mediaUi.fill} sizes="(min-width: 900px) 22vw, 60vw" /> : null}
        <span className="vcard__tag">{item.format}</span>
      </div>
      <div className="vcard__body">
        <p className="eyebrow">{[platformLabel(item.platform), item.duration, item.date].filter(hasValue).join(' · ')}</p>
        <h3 className="h5">{item.title}</h3>
        <p>{item.explanation}</p>
        {(hasValue(item.campaign) || hasValue(item.role)) && <p className="fineprint">{[item.campaign && `Campaign: ${item.campaign}`, item.role && `Role: ${item.role}`].filter(Boolean).join(' · ')}</p>}
        {item.result && <p className="vcard__result">{item.result}</p>}
        {link && <a className="textlink" href={link} target="_blank" rel="noopener noreferrer">View original <ExternalLink size={14} aria-hidden /><span className="sr-only"> (opens in a new tab)</span></a>}
      </div>
    </li>
  )
}

export function ContentGallery({ config }: { config: SectionConfig }) {
  const { content } = useContent()
  const { copy } = useTheme()
  const items = getContentItems(content)
  const [kind, setKind] = useState('')
  const hasBoth = useMemo(() => new Set(items.map((i) => (i.kind === 'video' ? 'video' : 'post'))).size > 1, [items])
  const shown = items.filter((i) => !kind || (i.kind === 'video' ? 'video' : 'post') === kind)
  return (
    <Section config={config} tone="var(--c-butter)" eyebrow="Social and content" title={copy.contentTitle} intro="Vertical first. Each piece is built for the platform it lives on. Videos only load when you press play." className="content">
      {hasBoth && (
        <div className="filters" role="group" aria-label="Filter content">
          <button type="button" className="chip" aria-pressed={!kind} onClick={() => setKind('')}>All</button>
          <button type="button" className="chip" aria-pressed={kind === 'video'} onClick={() => setKind(kind === 'video' ? '' : 'video')}>Reels and video</button>
          <button type="button" className="chip" aria-pressed={kind === 'post'} onClick={() => setKind(kind === 'post' ? '' : 'post')}>Posts and carousels</button>
        </div>
      )}
      <ul className="vgrid">{shown.map((i) => <ContentCard key={i.id} item={i} />)}</ul>
    </Section>
  )
}
