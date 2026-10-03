import { useContent } from '../../hooks/useContent'
import { BrandIcon } from '../ui/Icons'
import { Footprints } from '../ui/art'
import { goTo } from '../../utils/nav'
import { hasValue, whatsappUrl } from '../../utils/text'
import { socialEntries } from '../contact/Socials'
import { useTheme } from '../../hooks/useTheme'

export function Footer() {
  const { content, nav } = useContent()
  const { profile, theme, footer, contact } = content.portfolio
  const signature = hasValue(profile.signature) ? profile.signature : profile.preferredName
  const wa = whatsappUrl(profile.whatsapp, contact.whatsappGreeting)
  const socials = socialEntries(profile.social)
  const { resolved } = useTheme()
  const decor = /^(\/[\w\-./%]+|https:\/\/[\w\-./%?=&:+~]+)$/.test(resolved.override.decorImage) ? resolved.override.decorImage : ''
  const legal = hasValue(footer.copyright) ? footer.copyright : `© ${new Date().getFullYear()} ${profile.fullName}. All rights reserved.`

  return (
    <footer className="footer">
      {decor && <img className="footer__decor" src={decor} alt="" aria-hidden loading="lazy" decoding="async" />}
      <div className="container footer__grid">
        <div>
          <p className="script footer__name">{signature}</p>
          <p className="footer__title">{hasValue(footer.tagline) ? footer.tagline : profile.title}</p>
          {hasValue(profile.email) && <a className="footer__mail" href={`mailto:${profile.email}`}>{profile.email}</a>}
        </div>
        {footer.showNav && nav.length > 0 && (
          <nav aria-label="Footer" className="footer__nav">
            {nav.map((i) =>
              i.external ? (
                <a key={i.id} href={i.target} target="_blank" rel="noopener noreferrer">{i.label}</a>
              ) : (
                <a key={i.id} href={`#${i.target}`} onClick={(e) => { e.preventDefault(); goTo(i.target) }}>{i.label}</a>
              ),
            )}
          </nav>
        )}
        {footer.showSocial && (socials.length > 0 || wa) && (
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
        )}
        <div className="footer__stamp" aria-hidden>
          <span className="footer__stamp-num">{theme.stampNumeral}</span>
          <span className="footer__stamp-text">AIR MAIL</span>
        </div>
      </div>
      {footer.showFootprints && <Footprints />}
      <p className="footer__legal">{legal}</p>
    </footer>
  )
}
