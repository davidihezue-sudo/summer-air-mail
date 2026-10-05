import { useEffect } from 'react'
import { Download, Globe, Mail, MessageCircle, Phone } from 'lucide-react'
import { useContent } from '../hooks/useContent'
import { QrCode } from '../components/ui/QrCode'
import { BrandIcon, platformLabel } from '../components/ui/Icons'
import { hasValue, safeHref } from '../utils/text'
import { buildVCard } from '../utils/vcard'
import { navigate } from '../utils/route'
import { Img } from '../components/ui/Img'

/** A clean page to hand to someone: who you are, how to reach you, a QR code, and a button that saves you to their phone. */
export function CardPage() {
  const { content } = useContent()
  const p = content.portfolio
  const pr = p.profile
  const c = p.card
  const name = pr.fullName || pr.preferredName
  const base = (p.site.url || location.origin).replace(/\/$/, '')
  const qrValue = c.qrTarget === 'card' ? `${base}/card` : `${base}/`
  const social = Object.entries(pr.social ?? {}).filter(([, url]) => hasValue(url) && safeHref(url))
  const wa = hasValue(pr.whatsapp) ? `https://wa.me/${pr.whatsapp.replace(/[^\d]/g, '')}` : ''
  useEffect(() => { document.title = `${name} | Business card`; window.scrollTo(0, 0) }, [name])

  const save = () => {
    const blob = new Blob([buildVCard(p, base)], { type: 'text/vcard;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(name || 'contact').replace(/[^\w-]+/g, '-')}.vcf`
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <main id="main" className="bcard">
      <article className="bcard__card">
        {pr.profilePhoto?.src && <Img image={pr.profilePhoto} className="bcard__photo" />}
        <h1 className="bcard__name">{name}</h1>
        {hasValue(pr.title) && <p className="bcard__title">{pr.title}</p>}
        {hasValue(c.note) && <p className="bcard__note">{c.note}</p>}
        {hasValue(pr.location) && <p className="bcard__loc">{pr.location}</p>}
        <ul className="bcard__links">
          {hasValue(pr.email) && <li><a href={`mailto:${pr.email}`}><Mail size={18} aria-hidden /> {pr.email}</a></li>}
          {hasValue(pr.phone) && <li><a href={`tel:${pr.phone.replace(/[^\d+]/g, '')}`}><Phone size={18} aria-hidden /> {pr.phone}</a></li>}
          {wa && <li><a href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} aria-hidden /> WhatsApp<span className="sr-only"> (opens in a new tab)</span></a></li>}
          {p.site.url && <li><a href={p.site.url}><Globe size={18} aria-hidden /> {p.site.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a></li>}
        </ul>
        {c.showSocial && social.length > 0 && (
          <ul className="bcard__social" aria-label="Social profiles">
            {social.map(([kind, url]) => <li key={kind}><a href={safeHref(url)} target="_blank" rel="noopener noreferrer" aria-label={`${platformLabel(kind)} (opens in a new tab)`}><BrandIcon name={kind} size={22} tone="current" /></a></li>)}
          </ul>
        )}
        <button type="button" className="btn btn--solid bcard__save" onClick={save}><Download size={18} aria-hidden /> Save my contact details</button>
        {c.showQr && (
          <figure className="bcard__qr">
            <QrCode value={qrValue} size={200} label={`QR code for ${qrValue}`} />
            <figcaption>Scan to open {c.qrTarget === 'card' ? 'this card' : 'my website'}</figcaption>
          </figure>
        )}
        <a className="bcard__back no-print" href="/" onClick={(e) => { e.preventDefault(); navigate('/') }}>See my full portfolio</a>
      </article>
    </main>
  )
}
