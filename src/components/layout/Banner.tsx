import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useContent } from '../../hooks/useContent'
import { announcementVisible } from '../../content/derive'
import { useT } from '../../i18n/useT'
import { safeHref } from '../../utils/text'

const key = (text: string) => { let h = 0; for (const c of text) h = (h * 31 + c.charCodeAt(0)) | 0; return `sam-banner-${h}` }

/** Announcement bar. Honours its date window and, if allowed, stays dismissed for the visit. */
export function Banner() {
  const { content } = useContent()
  const { t } = useT()
  const a = content.portfolio.announcement
  const live = announcementVisible(content)
  const [gone, setGone] = useState(() => { try { return sessionStorage.getItem(key(a.text)) === '1' } catch { return false } })
  const show = live && !gone
  const el = useRef<HTMLElement>(null)
  // The banner can wrap to two or three lines on a phone, so the page makes room for its real height.
  useEffect(() => {
    const root = document.documentElement
    if (!show || !el.current) { root.style.setProperty('--banner-h', '0px'); return }
    const node = el.current
    const set = () => root.style.setProperty('--banner-h', `${node.offsetHeight}px`)
    set()
    const ro = new ResizeObserver(set)
    ro.observe(node)
    return () => { ro.disconnect(); root.style.setProperty('--banner-h', '0px') }
  }, [show])
  if (!show) return null
  const href = safeHref(a.link)
  return (
    <aside ref={el} className={`banner banner--${a.tone}`} role="region" aria-label="Announcement">
      <p>{a.text}{href && <> <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">{a.linkLabel || 'Learn more'}</a></>}</p>
      {a.dismissible && (
        <button type="button" onClick={() => { setGone(true); try { sessionStorage.setItem(key(a.text), '1') } catch { /* ignore */ } }} aria-label={t('banner.dismiss')}><X size={18} aria-hidden /></button>
      )}
    </aside>
  )
}
