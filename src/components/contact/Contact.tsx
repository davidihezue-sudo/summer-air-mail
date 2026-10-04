import React from 'react'
import type { SectionConfig } from '../../content/types'
import { useState, type FormEvent } from 'react'
import { Download, Mail, MessageCircle } from 'lucide-react'
import { useContent } from '../../hooks/useContent'
import { getServices } from '../../content/selectors'
import { Section } from '../ui/Section'
import { BookingButton } from '../layout/BookingButton'
import { track } from '../../utils/track'
import { useT } from '../../i18n/useT'
import { isPreviewMode } from '../../utils/route'
import { Reveal } from '../ui/Reveal'
import { Img } from '../ui/Img'
import { PortraitPlaceholder } from '../ui/art'
import { SocialRow } from './Socials'
import {
  buildEnquiryMessage, cvLink, formatBudget, hasValue, mailtoUrl, validateEnquiry, whatsappUrl,
  type EnquiryErrors, type EnquiryValues,
} from '../../utils/text'

const EMPTY: EnquiryValues = { name: '', email: '', company: '', role: '', enquiryType: '', service: '', budget: '', message: '' }

export function Contact({ config }: { config: SectionConfig }) {
  const { content } = useContent()
  const { portfolio } = content
  const { profile, contact, site } = portfolio
  const services = getServices(content)
  const hasEmail = !!mailtoUrl(profile.email, 's', 'b')
  const hasWa = !!whatsappUrl(profile.whatsapp, 'x')
  const serverOk = contact.delivery !== 'client' && !isPreviewMode()
  const showClient = contact.delivery !== 'server' || !serverOk
  const [method, setMethod] = useState<'send' | 'email' | 'whatsapp'>(serverOk ? 'send' : hasEmail ? 'email' : 'whatsapp')
  const [honey, setHoney] = useState('')
  const [started] = useState(() => Date.now())
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const { t } = useT()
  const [values, setValues] = useState<EnquiryValues>(EMPTY)
  const [errors, setErrors] = useState<EnquiryErrors>({})
  const [status, setStatus] = useState('')
  const cv = cvLink(portfolio)
  const recruiter = values.enquiryType === contact.recruiterType
  const signature = hasValue(profile.signature) ? profile.signature : profile.preferredName
  const set = (k: keyof EnquiryValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setValues((v) => ({ ...v, [k]: e.target.value }))
  const canSend = serverOk || hasEmail || hasWa

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const errs = validateEnquiry(values)
    setErrors(errs)
    if (Object.keys(errs).length) {
      setStatus('Please fix the highlighted fields.')
      const first = Object.keys(errs)[0]
      document.getElementById(`enquiry-${first === 'enquiryType' ? 'type' : first}`)?.focus()
      return
    }
    const body = buildEnquiryMessage(values, profile.preferredName)
    if (method === 'send') {
      setBusy(true)
      setStatus(t('contact.sending'))
      try {
        const res = await fetch('/api/contact', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name: values.name, email: values.email, company: values.company, type: values.enquiryType, budget: values.budget, message: body, website: honey, elapsed: Date.now() - started }),
        })
        if (!res.ok) throw new Error(String((await res.json().catch(() => ({}))).error ?? ''))
        track('contact', values.enquiryType)
        setSent(true)
        setValues(EMPTY)
        setStatus('')
      } catch (err) {
        const msg = err instanceof Error && err.message ? err.message : ''
        const url = mailtoUrl(profile.email, `${values.enquiryType}: ${values.name.trim()}`, body)
        if (url && !msg) { setStatus(`${t('contact.error')}`); window.location.href = url } else setStatus(msg || t('contact.error'))
      } finally { setBusy(false) }
      return
    }
    if (method === 'whatsapp') {
      const url = whatsappUrl(profile.whatsapp, body)
      if (!url) return setStatus('WhatsApp is not set up for this site.')
      window.open(url, '_blank', 'noopener,noreferrer')
      setStatus('WhatsApp should now open with your message ready. Nothing is sent until you press send there.')
    } else {
      const url = mailtoUrl(profile.email, `${values.enquiryType}: ${values.name.trim()}`, body)
      if (!url) return setStatus('Email is not set up for this site.')
      window.location.href = url
      setStatus('Your email app should now open with your message ready. Nothing is sent until you press send there.')
    }
  }

  const field = (id: keyof EnquiryValues, label: string, required = false) => ({ id: `enquiry-${id === 'enquiryType' ? 'type' : id}`, label, required, error: errors[id] })

  return (
    <Section config={config} tone="var(--c-peach)" eyebrow="Let's connect" title="Let's talk about your next project." className="contact">
      <div className="contact__grid">
        <Reveal className="contact__intro">
          <div className="contact__portrait">{profile.profilePhoto ? <Img image={profile.profilePhoto} /> : <PortraitPlaceholder />}</div>
          <p className="script contact__sig">{signature}</p>
          <p className="lede">Hiring, collaborating or just curious about what social-first marketing could do for your brand? Send a note and I will reply personally.</p>
          {(contact.availableFor.length > 0 || contact.workModes.length > 0) && (
            <div>
              <p className="eyebrow">Available for</p>
              <ul className="chips">{[...contact.availableFor, ...contact.workModes].map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          )}
          <ul className="contact__links">
            {hasEmail && <li><a href={`mailto:${profile.email}`}><Mail size={18} aria-hidden /> {profile.email}</a></li>}
            {hasWa && <li><a href={whatsappUrl(profile.whatsapp, contact.whatsappGreeting)} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} aria-hidden /> WhatsApp<span className="sr-only"> (opens in a new tab)</span></a></li>}
          </ul>
          <SocialRow social={profile.social} />
          <div className="contact__ctas">
            <button type="button" className="btn btn--solid btn--shine" onClick={() => document.getElementById('enquiry-name')?.focus()}>Let&rsquo;s talk about your next project.</button>
            {cv && <a className="btn btn--ghost" href={cv.href} download={cv.filename} onClick={() => track('download', 'CV')}><Download size={18} aria-hidden /> Download my CV</a>}
            <BookingButton place="contact" />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          {canSend ? (
            sent ? (
              <div className="form form--done" role="status"><p className="h4">{contact.successMessage}</p><button type="button" className="btn btn--ghost" onClick={() => setSent(false)}>Send another</button></div>
            ) : (
            <form className="form" onSubmit={submit} noValidate aria-describedby="form-explain">
              <fieldset className="form__method">
                <legend>How would you like to reach me?</legend>
                {serverOk && <label><input type="radio" name="method" checked={method === 'send'} onChange={() => setMethod('send')} /> Send here</label>}
                {showClient && hasEmail && <label><input type="radio" name="method" checked={method === 'email'} onChange={() => setMethod('email')} /> Email</label>}
                {showClient && hasWa && <label><input type="radio" name="method" checked={method === 'whatsapp'} onChange={() => setMethod('whatsapp')} /> WhatsApp</label>}
              </fieldset>
              <p id="form-explain" className="fineprint">
                {method === 'send'
                  ? 'Your message goes straight to my inbox and I will reply by email. I keep it only to answer you.'
                  : `This option does not send anything to a server. Pressing the button opens your ${method === 'email' ? 'email app' : 'WhatsApp'} with a drafted message. You then press send yourself. I do not store what you type here.`}
              </p>

              <Field {...field('name', 'Full name', true)}><input id="enquiry-name" autoComplete="name" value={values.name} onChange={set('name')} /></Field>
              <Field {...field('email', 'Email', true)}><input id="enquiry-email" type="email" autoComplete="email" value={values.email} onChange={set('email')} /></Field>
              <Field {...field('company', recruiter ? 'Company (the hiring organisation)' : 'Company')}><input id="enquiry-company" autoComplete="organization" value={values.company} onChange={set('company')} /></Field>
              <Field {...field('enquiryType', 'Position or enquiry type', true)}>
                <select id="enquiry-type" value={values.enquiryType} onChange={set('enquiryType')}>
                  <option value="">Choose one</option>
                  {contact.enquiryTypes.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              {recruiter && (
                <Field {...field('role', 'Role you are hiring for')}><input id="enquiry-role" value={values.role} onChange={set('role')} placeholder="For example: Social Media Manager" /></Field>
              )}
              {services.length > 0 && !recruiter && (
                <Field {...field('service', 'Service of interest')}>
                  <select id="enquiry-service" value={values.service} onChange={set('service')}>
                    <option value="">Not sure yet</option>
                    {services.map((s) => <option key={s.id}>{s.name}</option>)}
                  </select>
                </Field>
              )}
              {contact.showBudget && !recruiter && contact.budgetRanges.length > 0 && (
                <Field {...field('budget', 'Budget (optional)')}>
                  <select id="enquiry-budget" value={values.budget} onChange={set('budget')}>
                    <option value="">Prefer to discuss</option>
                    {contact.budgetRanges.map((r) => { const l = formatBudget(r, site.locale, site.currency); return <option key={l}>{l}</option> })}
                  </select>
                </Field>
              )}
              <Field {...field('message', 'Message', true)}><textarea id="enquiry-message" rows={5} maxLength={3000} value={values.message} onChange={set('message')} /></Field>
              <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={honey} onChange={(e) => setHoney(e.target.value)} />
              <button type="submit" disabled={busy} className="btn btn--solid btn--shine">{method === 'send' ? t('contact.send') : method === 'email' ? 'Draft my email' : 'Open WhatsApp'}</button>
              <p role="status" className="form__status">{status}</p>
            </form>
            )
          ) : (
            <div className="form form--empty">
              <p className="prose">Contact details have not been added yet. Add an email address or WhatsApp number in <code>src/content/portfolio.config.ts</code> to enable the enquiry form.</p>
            </div>
          )}
        </Reveal>
      </div>
    </Section>
  )
}

function Field({ id, label, required, error, children }: { id: string; label: string; required?: boolean; error?: string; children: React.ReactElement<{ id?: string }> }) {
  const errId = `${id}-err`
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>{label}{required && <span aria-hidden> *</span>}</label>
      {React.cloneElement(children, { 'aria-invalid': !!error, 'aria-describedby': error ? errId : undefined, 'aria-required': required } as object)}
      {error && <p id={errId} className="field__error">{error}</p>}
    </div>
  )
}

