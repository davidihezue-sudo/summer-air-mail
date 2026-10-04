import { useContent } from '../hooks/useContent'
import { mailtoUrl, hasValue, safeHref } from '../utils/text'
import { useT } from '../i18n/useT'

export function Maintenance() {
  const { content } = useContent()
  const { t } = useT()
  const p = content.portfolio
  const m = p.maintenance
  const mail = mailtoUrl(p.profile.email, 'Hello', '')
  const social = Object.values(p.profile.social).map((v) => safeHref(v as string)).filter(Boolean) as string[]
  return (
    <main id="main" className="statuspage">
      <p className="script statuspage__name">{hasValue(p.profile.signature) ? p.profile.signature : p.profile.preferredName}</p>
      <h1 className="h2">{m.title}</h1>
      <p className="lede">{m.message}</p>
      {m.showContact && mail && <a className="btn btn--solid" href={mail}>{t('maintenance.contact')}</a>}
      {m.showSocial && social.length > 0 && <ul className="statuspage__links">{social.map((u) => <li key={u}><a href={u} target="_blank" rel="noopener noreferrer">{u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</a></li>)}</ul>}
    </main>
  )
}
