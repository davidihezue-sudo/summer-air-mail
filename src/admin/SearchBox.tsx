import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { FileText, Search, Settings2, X } from 'lucide-react'
import { useAdmin } from './store'
import { buildIndex, search, type Hit } from './search'

const ICON = { page: Search, setting: Settings2, item: FileText }
const KIND = { page: 'Page', setting: 'Setting', item: 'Your content' }

/** Type anything: a page, a setting or the name of something you wrote. Results appear as you type. Press / or Ctrl+K from anywhere. */
export function SearchBox() {
  const { content } = useAdmin()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [wide, setWide] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const list = useId()
  const index = useMemo(() => buildIndex(content), [content])
  const hits = useMemo(() => search(index, q), [index, q])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      const typing = t.closest('input, textarea, select, [contenteditable]')
      if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault()
        setWide(true)
        window.setTimeout(() => input.current?.focus(), 0)
      }
    }
    const onDown = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) { setOpen(false); setWide(false) } }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onDown)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('mousedown', onDown) }
  }, [])

  const go = (h: Hit) => {
    try { if (h.find) sessionStorage.setItem('sam-find', h.find) } catch { /* private mode: the page still opens */ }
    const target = `#/${h.to}`
    if (location.hash === target) window.dispatchEvent(new Event('sam-find'))
    else location.hash = target
    setQ(''); setOpen(false); setWide(false)
    input.current?.blur()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(hits.length - 1, a + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)) }
    else if (e.key === 'Enter' && hits[active]) { e.preventDefault(); go(hits[active]) }
    else if (e.key === 'Escape') { setOpen(false); setWide(false); setQ(''); input.current?.blur() }
  }

  return (
    <div className={`asearch ${wide ? 'is-wide' : ''}`} ref={box} role="search">
      <button type="button" className="aicon asearch__toggle" aria-label="Search the admin" onClick={() => { setWide(true); window.setTimeout(() => input.current?.focus(), 0) }}><Search size={18} /></button>
      <div className="asearch__field">
        <Search size={16} aria-hidden className="asearch__icon" />
        <input
          ref={input} type="search" value={q} placeholder="Search pages, settings and your content (press /)" aria-label="Search the admin"
          role="combobox" aria-expanded={open && hits.length > 0} aria-controls={list} aria-autocomplete="list" aria-activedescendant={open && hits[active] ? `${list}-${active}` : undefined}
          autoComplete="off" onChange={(e) => { setQ(e.target.value); setActive(0); setOpen(true) }} onFocus={() => setOpen(true)} onKeyDown={onKeyDown}
        />
        {q && <button type="button" className="asearch__clear" aria-label="Clear search" onClick={() => { setQ(''); input.current?.focus() }}><X size={14} /></button>}
      </div>
      {open && q.trim() && (
        <ul id={list} role="listbox" className="asearch__list" aria-label="Search results">
          {hits.length === 0 && <li className="asearch__none" role="presentation">Nothing found for "{q}". Try fewer or different words.</li>}
          {hits.map((h, i) => {
            const Icon = ICON[h.kind]
            return (
              <li key={h.id} id={`${list}-${i}`} role="option" aria-selected={i === active} className={i === active ? 'is-active' : ''} onMouseEnter={() => setActive(i)} onMouseDown={(e) => { e.preventDefault(); go(h) }}>
                <Icon size={16} aria-hidden />
                <span className="asearch__text"><strong>{h.title}</strong><small>{h.where}</small></span>
                <span className="asearch__kind">{KIND[h.kind]}</span>
              </li>
            )
          })}
        </ul>
      )}
      <p className="sr-only" role="status" aria-live="polite">{open && q.trim() ? `${hits.length} results` : ''}</p>
    </div>
  )
}
