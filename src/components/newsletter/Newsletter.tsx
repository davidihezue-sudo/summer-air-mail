import { useState } from 'react'
import { useContent } from '../../hooks/useContent'
import type { SectionConfig } from '../../content/types'
import { Section } from '../ui/Section'
import { safeHref } from '../../utils/text'

export function Newsletter({ config }: { config: SectionConfig }) {
  const { content } = useContent()
  const n = content.portfolio.newsletter
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [hp, setHp] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [started] = useState(() => Date.now())
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState('sending')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, consent, website: hp, elapsed: Date.now() - started }),
      })
      setState(res.ok ? 'done' : 'error')
    } catch { setState('error') }
  }
  const link = safeHref(n.link)
  return (
    <Section config={config} tone="var(--c-butter)" eyebrow="Newsletter" title={n.heading} intro={n.text} wave={false} className="newsletter">
      {n.mode === 'link' ? (
        link && <a className="btn btn--solid" href={link} target="_blank" rel="noopener noreferrer">{n.buttonLabel}</a>
      ) : state === 'done' ? (
        <p role="status" className="form-ok">{n.successMessage}</p>
      ) : (
        <form className="newsletter__form" onSubmit={submit}>
          <div className="field"><label htmlFor="nl-email">Email</label><input id="nl-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <label className="check"><input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} /> <span>{n.consentText}</span></label>
          <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={hp} onChange={(e) => setHp(e.target.value)} />
          <button className="btn btn--solid" disabled={state === 'sending'}>{n.buttonLabel}</button>
          {state === 'error' && <p role="alert" className="form-err">That did not work. Please try again in a moment.</p>}
        </form>
      )}
    </Section>
  )
}
