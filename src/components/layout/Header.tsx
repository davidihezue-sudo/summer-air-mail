import { useEffect, useRef, useState } from 'react'
import { Menu } from 'lucide-react'
import { useContent } from '../../hooks/useContent'
import { useActiveSection } from '../../hooks/useActiveSection'
import { goTo } from '../../utils/nav'
import { cvLink, hasValue } from '../../utils/text'
import { Modal } from '../ui/Modal'
import { BookingButton } from './BookingButton'
import { SchemeToggle } from './SchemeToggle'
import { AvailabilityBadge } from './AvailabilityBadge'
import { LangSwitcher } from './LangSwitcher'
import { useT } from '../../i18n/useT'
import { track } from '../../utils/track'

export function Header() {
  const { content, nav, idOf } = useContent()
  const { profile } = content.portfolio
  const { t } = useT()
  const cv = cvLink(content.portfolio)
  const active = useActiveSection(nav.filter((n) => !n.external).map((n) => n.target))
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const sentinel = useRef<HTMLDivElement>(null)
  const signature = hasValue(profile.signature) ? profile.signature : profile.preferredName
  const top = idOf('hero') ?? 'top'
  const contactId = idOf('contact')

  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting), { threshold: 0 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    setOpen(false)
    window.setTimeout(() => goTo(id, id === contactId ? 'enquiry-name' : undefined), 0)
  }

  return (
    <>
      <div ref={sentinel} className="header-sentinel" aria-hidden />
      <header className={`header ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="header__inner">
          <a href={`#${top}`} className="header__brand script" onClick={go(top)} aria-label={`${profile.preferredName}, back to top`}>
            {signature}
          </a>
          <nav className="header__nav" aria-label="Primary">
            {nav.map((i) =>
              i.external ? (
                <a key={i.id} href={i.target} target="_blank" rel="noopener noreferrer" className="navlink">{i.label}<span className="sr-only"> (opens in a new tab)</span></a>
              ) : (
                <a key={i.id} href={`#${i.target}`} onClick={go(i.target)} className={`navlink ${active === i.target ? 'is-active' : ''}`} aria-current={active === i.target ? 'true' : undefined}>
                  {i.label}
                </a>
              ),
            )}
            {cv && <a className="navlink navlink--cv" href={cv.href} download={cv.filename} onClick={() => track('download', 'CV')}>{t('cv.nav')}</a>}
          </nav>
          <div className="header__tools">
            <AvailabilityBadge />
            <BookingButton place="header" className="btn btn--solid header__book" />
            <LangSwitcher />
            <SchemeToggle />
            <button type="button" className="header__burger" onClick={() => setOpen(true)} aria-label={t('menu.open')} aria-haspopup="dialog">
              <Menu aria-hidden />
            </button>
          </div>
        </div>
      </header>
      <Modal open={open} onClose={() => setOpen(false)} label={t('menu.title')} className="drawer">
        <nav className="drawer__nav" aria-label="Mobile">
          <p className="script drawer__name">{signature}</p>
          {nav.map((i) =>
            i.external ? (
              <a key={i.id} href={i.target} target="_blank" rel="noopener noreferrer" className="drawer__link">{i.label}</a>
            ) : (
              <a key={i.id} href={`#${i.target}`} onClick={go(i.target)} className="drawer__link">{i.label}</a>
            ),
          )}
          {cv && <a className="btn btn--solid" href={cv.href} download={cv.filename}>{t('cv.download')}</a>}
          <BookingButton place="header" className="btn btn--ghost" />
        </nav>
      </Modal>
    </>
  )
}
