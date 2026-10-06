import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Check, Link2, Minus, Plus, Search } from 'lucide-react'
import { useContent } from '../../hooks/useContent'
import type { Faq as FaqItem, SectionConfig } from '../../content/types'
import { getFaqs } from '../../content/selectors'
import { Section } from '../ui/Section'
import { Reveal } from '../ui/Reveal'
import { RichText } from '../ui/RichText'
import { goTo } from '../../utils/nav'
import { hasValue, safeHref } from '../../utils/text'

/** The question's address on the page, for example #faq-faq-ab12cd. */
export const faqAnchor = (id: string) => `faq-${id}`
const SEARCH_AFTER = 8

function Button({ label, link, className }: { label: string; link: string; className: string }) {
  const href = safeHref(link) || (link.startsWith('#') ? link : '')
  if (!hasValue(label) || !href) return null
  const inPage = href.startsWith('#')
  return (
    <a
      className={className} href={href}
      {...(inPage ? { onClick: (e: React.MouseEvent) => { e.preventDefault(); goTo(href.slice(1)) } } : /^https?:/.test(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {label}
    </a>
  )
}

export function Faq({ config }: { config: SectionConfig }) {
  const { content, idOf } = useContent()
  const ui = content.portfolio.faq
  const all = useMemo(() => getFaqs(content), [content])
  const [topic, setTopic] = useState('')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<string[]>([])
  const [copied, setCopied] = useState('')
  const searchId = useId()
  const pending = useRef('')

  const topics = useMemo(() => [...new Set(all.map((q) => q.topic.trim()).filter(Boolean))], [all])
  const showTopics = ui.showTopics && topics.length >= 2
  const showSearch = ui.search === 'always' || (ui.search === 'auto' && all.length >= SEARCH_AFTER)
  const q = query.trim().toLowerCase()
  const shown = all.filter((f) => (!showTopics || !topic || f.topic.trim() === topic) && (!q || `${f.question} ${f.answer} ${f.topic}`.toLowerCase().includes(q)))

  const toggle = useCallback((id: string, force?: boolean) => {
    setOpen((cur) => {
      const on = force ?? !cur.includes(id)
      if (!on) return cur.filter((x) => x !== id)
      return ui.openMode === 'many' ? [...cur, id] : [id]
    })
  }, [ui.openMode])

  // A link to one question (the address, a share, or the site search) clears any filter, opens it and scrolls to it.
  const reveal = useCallback((id: string) => {
    if (!all.some((f) => f.id === id)) return
    setTopic(''); setQuery(''); toggle(id, true)
    pending.current = id
  }, [all, toggle])

  useEffect(() => {
    const fromHash = () => { const m = /^#faq-(.+)$/.exec(decodeURIComponent(location.hash)); if (m) reveal(m[1]) }
    const fromEvent = (e: Event) => reveal(String((e as CustomEvent).detail ?? ''))
    fromHash()
    window.addEventListener('hashchange', fromHash)
    window.addEventListener('sam-faq', fromEvent)
    return () => { window.removeEventListener('hashchange', fromHash); window.removeEventListener('sam-faq', fromEvent) }
  }, [reveal])

  useEffect(() => {
    if (!pending.current) return
    const el = document.getElementById(faqAnchor(pending.current))
    pending.current = ''
    if (el) window.setTimeout(() => el.scrollIntoView({ behavior: 'auto', block: 'center' }), 60)
  }, [open, shown.length])

  const copy = async (f: FaqItem) => {
    const url = `${location.origin}${location.pathname}#${faqAnchor(f.id)}`
    try { await navigator.clipboard.writeText(url) } catch { /* the link is still in the address bar after opening */ }
    history.replaceState(null, '', `#${faqAnchor(f.id)}`)
    setCopied(f.id); window.setTimeout(() => setCopied((c) => (c === f.id ? '' : c)), 1800)
  }

  const contactId = idOf('contact')
  const closingHref = hasValue(ui.closingLink) ? ui.closingLink : contactId ? `#${contactId}` : ''

  return (
    <Section config={config} tone="var(--c-paper)" eyebrow="FAQ" title="Questions, answered" wave={false} className="faq">
      <div className="faq__wrap">
        {(showTopics || showSearch) && (
          <div className="faq__bar">
            {showSearch && (
              <label className="search faq__search" htmlFor={searchId}>
                <Search size={18} aria-hidden />
                <span className="sr-only">{ui.searchLabel}</span>
                <input id={searchId} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={ui.searchLabel} autoComplete="off" />
              </label>
            )}
            {showTopics && (
              <div className="filters faq__topics" role="group" aria-label="Filter questions by topic">
                <button type="button" className="chip" aria-pressed={!topic} onClick={() => setTopic('')}>{ui.allLabel} <span className="toolfilters__n">{all.length}</span></button>
                {topics.map((t) => (
                  <button key={t} type="button" className="chip" aria-pressed={topic === t} onClick={() => setTopic(topic === t ? '' : t)}>
                    {t} <span className="toolfilters__n">{all.filter((f) => f.topic.trim() === t).length}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <p className="sr-only" role="status">{q || topic ? `${shown.length} of ${all.length} questions shown.` : ''}</p>
        <ul className="faq__list">
          {shown.map((f, i) => {
            const isOpen = open.includes(f.id)
            const panel = `${faqAnchor(f.id)}-answer`
            return (
              <li key={f.id}>
                <Reveal delay={Math.min(i, 6) * 0.03}>
                  <div className={`faqitem${isOpen ? ' is-open' : ''}`} id={faqAnchor(f.id)}>
                    <h3 className="faqitem__q">
                      <button type="button" className="faqitem__btn" aria-expanded={isOpen} aria-controls={panel} onClick={() => toggle(f.id)}>
                        <span>{f.question}</span>
                        {isOpen ? <Minus className="faqitem__icon" size={22} aria-hidden /> : <Plus className="faqitem__icon" size={22} aria-hidden />}
                      </button>
                    </h3>
                    <div className="faqitem__panel" id={panel} role="region" aria-label={f.question} inert={!isOpen}>
                      <div className="faqitem__inner">
                        <div className="faqitem__a">
                          <RichText text={f.answer} />
                          <div className="faqitem__foot">
                            <Button label={f.buttonLabel} link={f.buttonLink} className="btn btn--solid" />
                            <button type="button" className="faqitem__copy" onClick={() => void copy(f)}>
                              {copied === f.id ? <Check size={15} aria-hidden /> : <Link2 size={15} aria-hidden />}
                              <span>{copied === f.id ? 'Link copied' : 'Copy link to this question'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              </li>
            )
          })}
        </ul>
        {shown.length === 0 && <p className="faq__none" role="status">Nothing matches. <button type="button" className="link" onClick={() => { setQuery(''); setTopic('') }}>Show every question</button></p>}

        {hasValue(ui.closingText) && (
          <p className="faq__closing">
            <span>{ui.closingText}</span>{' '}
            <Button label={ui.closingLabel} link={closingHref} className="link faq__closing-link" />
          </p>
        )}
      </div>
    </Section>
  )
}
