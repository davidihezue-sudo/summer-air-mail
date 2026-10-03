import { useContent } from '../../hooks/useContent'
import { useNavItems } from '../layout/Header'
import { BrandIcon } from '../ui/Icons'
import { Footprints } from '../ui/art'
import { goTo } from '../../utils/nav'
import { hasValue, whatsappUrl } from '../../utils/text'
import { socialEntries } from '../contact/Socials'

export function Footer() {
  const { content } = useContent()
  const { profile, theme } = content.portfolio
  const items = useNavItems()
  const signature = hasValue(profile.signature) ? profile.signature : profile.preferredName
  const wa = whatsappUrl(profile.whatsapp, content.portfolio.contact.whatsappGreeting)
  const socials = socialEntries(profile.social)

  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <p className="script footer__name">{signature}</p>
          <p className="footer__title">{profile.title}</p>
          {hasValue(profile.email) && <a className="footer__mail" href={`mailto:${profile.email}`}>{profile.email}</a>}
        </div>
        <nav aria-label="Footer" className="footer__nav">
          {items.map((i) => (
            <a key={i.id} href={`#${i.id}`} onClick={(e) => { e.preventDefault(); goTo(i.id) }}>{i.label}</a>
          ))}
        </nav>
        <div className="footer__social">
          {socials.map((s) => (
            <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`${s.label} (opens in a new tab)`}>
              <BrandIcon name={s.key} />
            </a>
          ))}
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp (opens in a new tab)">
              <BrandIcon name="whatsapp" />
            </a>
          )}
        </div>
        <div className="footer__stamp" aria-hidden>
          <span className="footer__stamp-num">{theme.stampNumeral}</span>
          <span className="footer__stamp-text">AIR MAIL</span>
        </div>
      </div>
      <Footprints />
      <p className="footer__legal">
        © {new Date().getFullYear()} {profile.fullName}. All rights reserved.
      </p>
    </footer>
  )
}
