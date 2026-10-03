import { ExternalLink } from 'lucide-react'
import { useContent } from '../../hooks/useContent'
import { getPlatforms, getProjects } from '../../content/selectors'
import type { SectionConfig } from '../../content/types'
import { Section } from '../ui/Section'
import { Reveal } from '../ui/Reveal'
import { BrandIcon, platformLabel } from '../ui/Icons'
import { safeHref, hasValue } from '../../utils/text'
import { useViewer } from '../projects/Viewer'

export function Platforms({ config }: { config: SectionConfig }) {
  const { content } = useContent()
  const platforms = getPlatforms(content)
  const projects = getProjects(content)
  const { openProject } = useViewer()
  return (
    <Section config={config} tone="var(--c-sky)" eyebrow="Platform expertise" title="Where I work" intro="Real experience on each platform, described by what I have done there." className="platforms">
      <div className="platforms__grid">
        {platforms.map((p) => {
          const link = safeHref(p.profileUrl)
          const linked = projects.filter((pr) => p.projectIds?.includes(pr.id))
          return (
            <Reveal key={p.id} className="platform">
              <header className="platform__head">
                <span className="platform__icon"><BrandIcon name={p.platform} size={26} /></span>
                <div>
                  <h3 className="h5">{platformLabel(p.platform)}</h3>
                  {p.level && <p className="platform__level">{p.level}</p>}
                </div>
              </header>
              <Row label="Services" items={p.services} />
              <Row label="Content" items={p.contentTypes} />
              <Row label="Campaigns" items={p.campaigns} />
              {hasValue(p.analytics) && <p className="platform__line"><strong>Analytics:</strong> {p.analytics}</p>}
              {hasValue(p.advertising) && <p className="platform__line"><strong>Advertising:</strong> {p.advertising}</p>}
              {linked.length > 0 && (
                <p className="platform__line"><strong>Work:</strong>{' '}
                  {linked.map((pr, i) => <span key={pr.id}>{i > 0 && ', '}<button type="button" className="textlink" onClick={() => openProject(pr.id)}>{pr.title}</button></span>)}
                </p>
              )}
              {link && <a className="textlink" href={link} target="_blank" rel="noopener noreferrer">View profile <ExternalLink size={14} aria-hidden /><span className="sr-only"> (opens in a new tab)</span></a>}
            </Reveal>
          )
        })}
      </div>
    </Section>
  )
}

function Row({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null
  return (
    <div className="platform__row">
      <span className="platform__label">{label}</span>
      <ul className="chips">{items.map((i) => <li key={i}>{i}</li>)}</ul>
    </div>
  )
}
