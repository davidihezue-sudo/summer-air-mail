import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { SectionConfig } from '../../content/types'
import { useContent } from '../../hooks/useContent'
import { getTestimonials } from '../../content/selectors'
import { Section } from '../ui/Section'
import { Modal } from '../ui/Modal'
import { useTheme } from '../../hooks/useTheme'
import { Reveal } from '../ui/Reveal'
import { Img } from '../ui/Img'
import { VideoPlayer } from '../ui/VideoPlayer'
import { useT } from '../../i18n/useT'
import { hasValue } from '../../utils/text'
import { toneValue } from '../../utils/theme'

/** The form a past colleague or client uses to leave a recommendation. It goes to the owner's inbox, never straight onto the site. */
function RecommendForm() {
  const { content } = useContent()
  const e = content.portfolio.endorsements
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')
  const [started] = useState(() => Date.now())
  const [f, setF] = useState({ name: '', role: '', company: '', quote: '', consent: false, website: '' })
  const set = (k: keyof typeof f) => (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: k === 'consent' ? (ev.target as HTMLInputElement).checked : ev.target.value }))
  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setState('sending'); setError('')
    try {
      const res = await fetch('/api/endorse', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...f, elapsed: Date.now() - started }) })
      if (res.ok) setState('done')
      else { setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? 'That did not work. Please try again.'); setState('error') }
    } catch { setError('That did not work. Please try again in a moment.'); setState('error') }
  }
  if (!e.enabled) return null
  return (
    <div className="recommend">
      <h3 className="h4">{e.heading}</h3>
      <p>{e.text}</p>
      <button type="button" className="btn btn--solid" onClick={() => setOpen(true)}>{e.buttonLabel}</button>
      <Modal open={open} onClose={() => setOpen(false)} label={e.buttonLabel} className="dialog dialog--narrow">
        {state === 'done' ? (
          <div role="status"><h3 className="h3">{e.buttonLabel}</h3><p className="form-ok">{e.successMessage}</p><button type="button" className="btn btn--ghost" onClick={() => setOpen(false)}>Close</button></div>
        ) : (
          <form className="recommend__form" onSubmit={submit}>
            <h3 className="h3">{e.buttonLabel}</h3>
            <div className="field"><label htmlFor="rec-name">Your name</label><input id="rec-name" required maxLength={80} autoComplete="name" value={f.name} onChange={set('name')} /></div>
            <div className="field"><label htmlFor="rec-role">Your role</label><input id="rec-role" maxLength={120} autoComplete="organization-title" value={f.role} onChange={set('role')} /></div>
            <div className="field"><label htmlFor="rec-company">Company</label><input id="rec-company" maxLength={120} autoComplete="organization" value={f.company} onChange={set('company')} /></div>
            <div className="field"><label htmlFor="rec-quote">Your recommendation</label><textarea id="rec-quote" required minLength={20} maxLength={1200} rows={5} value={f.quote} onChange={set('quote')} /></div>
            <label className="check"><input type="checkbox" required checked={f.consent} onChange={set('consent')} /> <span>{e.consentText}</span></label>
            <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={f.website} onChange={set('website')} />
            <button className="btn btn--solid" disabled={state === 'sending'}>Send</button>
            {state === 'error' && <p role="alert" className="form-err">{error}</p>}
          </form>
        )}
      </Modal>
    </div>
  )
}

export function Testimonials({ config }: { config: SectionConfig }) {
  const { content } = useContent()
  const items = getTestimonials(content)
  const { copy } = useTheme()
  const { t } = useT()
  const track = useRef<HTMLUListElement>(null)
  const carousel = config.layout === 'carousel'
  const scroll = (dir: number) => track.current?.scrollBy({ left: dir * Math.max(280, track.current.clientWidth * 0.8), behavior: 'smooth' })
  return (
    <Section config={config} tone="var(--c-paper)" eyebrow="Recommendations" title={copy.testimonialsTitle} className="testimonials">
      {carousel && items.length > 1 && (
        <div className="carousel__ctl">
          <button type="button" className="header__icon" onClick={() => scroll(-1)} aria-label={t('carousel.prev')}><ChevronLeft aria-hidden /></button>
          <button type="button" className="header__icon" onClick={() => scroll(1)} aria-label={t('carousel.next')}><ChevronRight aria-hidden /></button>
        </div>
      )}
      <ul ref={track} className={`quotes ${carousel ? 'quotes--carousel' : config.layout === 'list' ? 'quotes--list' : ''}`} tabIndex={carousel ? 0 : undefined} aria-label={carousel ? 'Testimonials, scroll sideways' : undefined}>
        {items.map((q) => (
          <li key={q.id}>
            <Reveal>
              <figure className="quote" style={toneValue(q.accent) ? ({ ['--accent' as string]: toneValue(q.accent) } as React.CSSProperties) : undefined}>
                {hasValue(q.video) && <VideoPlayer src={q.video} poster={q.photo?.src} title={`Video recommendation from ${q.name}`} />}
                <blockquote><p>{q.quote}</p></blockquote>
                <figcaption>
                  {q.photo && <Img image={q.photo} className="quote__photo" />}
                  <span><strong>{q.name}</strong><br />{q.title}, {q.company}<br /><span className="muted">{q.relationship}</span></span>
                </figcaption>
              </figure>
            </Reveal>
          </li>
        ))}
      </ul>
      <RecommendForm />
    </Section>
  )
}
