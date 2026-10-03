import { useState } from 'react'
import { Play } from 'lucide-react'
import { useContent } from '../../hooks/useContent'
import { getContentItems } from '../../content/selectors'
import type { ContentItem } from '../../content/types'
import { Section } from '../ui/Section'
import { Img } from '../ui/Img'
import { platformLabel } from '../ui/Icons'

function Card({ item }: { item: ContentItem }) {
  const [playing, setPlaying] = useState(false)
  return (
    <li className="vcard">
      <div className="vcard__media">
        {playing && item.video ? (
          <video src={item.video} poster={item.thumbnail.src} controls autoPlay playsInline preload="metadata" aria-label={`Video: ${item.title}`} />
        ) : (
          <>
            <Img image={item.thumbnail} sizes="(min-width: 900px) 22vw, 60vw" />
            {item.video && (
              <button type="button" className="vcard__play" onClick={() => setPlaying(true)} aria-label={`Play video: ${item.title}`}><Play aria-hidden fill="currentColor" /></button>
            )}
          </>
        )}
        <span className="vcard__tag">{item.format}</span>
      </div>
      <div className="vcard__body">
        <p className="eyebrow">{platformLabel(item.platform)}</p>
        <h3 className="h5">{item.title}</h3>
        <p>{item.explanation}</p>
        {item.result && <p className="vcard__result">{item.result}</p>}
      </div>
    </li>
  )
}

export function ContentGallery() {
  const { content } = useContent()
  const items = getContentItems(content)
  return (
    <Section id="content" tone="var(--c-butter)" eyebrow="Social and content" title="Made for the feed" intro="Vertical first. Each piece is built for the platform it lives on." className="content">
      <ul className="vgrid">{items.map((i) => <Card key={i.id} item={i} />)}</ul>
    </Section>
  )
}
