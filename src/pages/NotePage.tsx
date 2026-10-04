import { useEffect } from 'react'
import { useContent } from '../hooks/useContent'
import { RichText } from '../components/ui/RichText'
import { Img } from '../components/ui/Img'
import { useT } from '../i18n/useT'
import { navigate } from '../utils/route'
import { readingMinutes } from '../utils/text'
import { track } from '../utils/track'
import { ShareButton } from '../components/layout/ShareButton'
import { NotFound } from './NotFound'

export function NotePage({ slug }: { slug: string }) {
  const { content } = useContent()
  const { t } = useT()
  const n = content.notes.find((x) => x.slug === slug && !x.hidden && x.title)
  useEffect(() => {
    if (!n) return
    document.title = n.seoTitle || `${n.title} | ${content.portfolio.profile.fullName}`
    window.scrollTo(0, 0)
    track('note', n.title)
  }, [n, content.portfolio.profile.fullName])
  if (!n) return <NotFound />
  return (
    <div className="notepage">
      <header className="notepage__bar"><a href="/" onClick={(e) => { e.preventDefault(); navigate('/') }}>{content.portfolio.profile.preferredName}</a><a href="/#notes" onClick={(e) => { e.preventDefault(); navigate('/'); window.setTimeout(() => document.getElementById('notes')?.scrollIntoView(), 80) }}>{t('notes.back')}</a></header>
      <main id="main" className="notepage__main">
        <article>
          <p className="muted">{n.date}{content.portfolio.extras.readingTime && `  |  ${readingMinutes(n.body)} min read`}{n.tags.length > 0 && `  |  ${n.tags.join(', ')}`}</p>
          <h1 className="h2">{n.title}</h1>
          {n.cover?.src && <Img image={n.cover} className="notepage__cover" eager />}
          <RichText text={n.body} />
          <p><ShareButton path={`/notes/${n.slug}`} title={n.title} /></p>
        </article>
      </main>
    </div>
  )
}
