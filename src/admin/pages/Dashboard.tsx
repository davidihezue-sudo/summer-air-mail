import { useMemo } from 'react'
import { Link } from './Link'
import type { ReactNode } from 'react'
import { useAdmin } from '../store'
import { Badge, Card, PageHead } from '../ui'
import { resolveSeason } from '../../themes/seasonManager'
import { THEMES } from '../../themes'
import { isPlaceholder, cvLink, hasValue } from '../../utils/text'
import { resolveSections } from '../../content/selectors'

export function Dashboard() {
  const { content: c, status } = useAdmin()
  const p = c.portfolio
  const season = resolveSeason(p.seasons)

  const stats = useMemo(() => {
    const pub = (l: { hidden?: boolean }[]) => l.filter((x) => !x.hidden).length
    const socials = Object.values(p.profile.social).filter(hasValue).length
    return [
      { label: 'Projects', value: `${pub(c.projects)} of ${c.projects.length}`, sub: `${c.projects.filter((x) => x.featured).length} featured`, to: 'projects' },
      { label: 'Case studies', value: c.projects.filter((x) => x.caseStudy && !x.hidden).length, sub: `${c.projects.filter((x) => x.caseStudy).length} in total`, to: 'caseStudies' },
      { label: 'Services shown', value: `${pub(c.services)} of ${c.services.length}`, to: 'services' },
      { label: 'Skills shown', value: `${c.skills.flatMap((g) => g.skills).filter((s) => s.visible).length} of ${c.skills.flatMap((g) => g.skills).length}`, to: 'skills' },
      { label: 'Tools in use', value: c.tools.filter((t) => t.confirmed).length, to: 'tools' },
      { label: 'Videos and reels', value: c.contentItems.filter((i) => i.kind === 'video' && !i.hidden).length, to: 'videos' },
      { label: 'Social content', value: c.contentItems.filter((i) => i.kind !== 'video' && !i.hidden).length, to: 'posts' },
      { label: 'Screenshots', value: pub(c.screenshots), to: 'screenshots' },
      { label: 'Results', value: pub(c.results), to: 'results' },
      { label: 'AI skills', value: pub(c.aiSkills), to: 'ai' },
      { label: 'Platforms', value: pub(c.platforms), to: 'platforms' },
      { label: 'Websites', value: pub(c.websites), to: 'websites' },
      { label: 'Testimonials approved', value: c.testimonials.filter((t) => t.approved).length, to: 'testimonials' },
      { label: 'Social links', value: socials, to: 'social' },
    ]
  }, [c, p])

  const todo = useMemo(() => {
    const items: { text: string; to: string }[] = []
    if (p.profile.fullName === 'Your Name' || !hasValue(p.profile.fullName)) items.push({ text: 'Add your name', to: 'profile' })
    if (p.profile.bio.some((b) => isPlaceholder(b))) items.push({ text: 'Replace the placeholder biography', to: 'about' })
    if (!p.profile.heroCutout?.src) items.push({ text: 'Upload your hero portrait (a transparent cut-out of you)', to: 'hero' })
    if (!cvLink(p)) items.push({ text: 'Upload your CV', to: 'cv' })
    if (!hasValue(p.profile.email) && !hasValue(p.profile.whatsapp)) items.push({ text: 'Add an email or WhatsApp number so the contact form works', to: 'contact' })
    if (!c.projects.some((x) => !x.hidden)) items.push({ text: 'Publish your first project', to: 'projects' })
    if (!c.results.some((x) => !x.hidden)) items.push({ text: 'Add verified results so recruiters can see impact', to: 'results' })
    if (!hasValue(p.site.url)) items.push({ text: 'Set your public website address for search and sharing', to: 'seo' })
    if (p.seo.robots === 'noindex') items.push({ text: 'Search engines are blocked. Switch indexing on when you are ready to be found', to: 'seo' })
    if (p.analytics.enabled && p.analytics.requireConsent === false) items.push({ text: 'Analytics runs without asking for consent. Check this is allowed where your visitors live', to: 'analytics' })
    return items
  }, [c, p])

  const sections = resolveSections(c)
  const live = sections.filter((s) => s.visible).length
  const waiting = sections.filter((s) => s.config.enabled && !s.visible)

  return (
    <>
      <PageHead title="Dashboard" intro="Everything about your portfolio at a glance. Select any tile to manage it." />
      <div className="astatus">
        <Card title="Publishing">
          <p>{status?.publishedAt ? <>Live site last published <strong>{new Date(status.publishedAt).toLocaleString()}</strong>.</> : <>The live site is using the built-in defaults. Press Publish to put your content online.</>}</p>
          <p>{!status?.publishedAt ? <Badge tone="warn">Not published yet</Badge> : status.unpublished ? <Badge tone="warn">Draft has unpublished changes</Badge> : <Badge tone="good">Draft and live site match</Badge>}</p>
        </Card>
        <Card title="Theme">
          <p>Mode: <strong>{p.seasons.mode === 'auto' ? `Auto (now ${THEMES[season].label})` : THEMES[season].label}</strong></p>
          <p>Intensity: <strong>{p.theme.professional}</strong></p>
          <Link to="seasons">Change season</Link> · <Link to="appearance">Appearance</Link>
        </Card>
        <Card title="Page sections">
          <p><strong>{live}</strong> sections are showing on the public site.</p>
          {waiting.length > 0 && <p className="ahelp">{waiting.length} are switched on but hidden because they have no content yet.</p>}
          <Link to="sections">Order and visibility</Link>
        </Card>
      </div>

      {todo.length > 0 && (
        <Card title="Needs your attention">
          <ul className="atodo">{todo.map((t) => <li key={t.text}><Link to={t.to}>{t.text}</Link></li>)}</ul>
        </Card>
      )}

      <div className="atiles">
        {stats.map((s) => (
          <Tile key={s.label} to={s.to}><span className="atile__value">{s.value}</span><span className="atile__label">{s.label}</span>{s.sub && <span className="ahelp">{s.sub}</span>}</Tile>
        ))}
      </div>
    </>
  )
}

function Tile({ to, children }: { to: string; children: ReactNode }) {
  return <a className="atile" href={`#/${to}`}>{children}</a>
}
