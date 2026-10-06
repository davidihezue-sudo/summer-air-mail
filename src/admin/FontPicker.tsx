import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { FONT_CHOICES, fontOptions, type FontChoice, type FontStyle } from '../themes/seasonManager'
import { loadFont } from '../themes/fontLoader'

/** "Great Vibes (flowing script)" becomes the name, shown in its own font, and the note, shown in plain text. */
const split = (label: string) => { const m = /^(.*?)\s*\((.*)\)\s*$/.exec(label); return m ? { name: m[1], note: m[2] } : { name: label, note: '' } }
/** Script faces have a small x-height, so they are shown a little larger to read at the same size as the others. */
const sizeFor = (c: FontChoice) => (c.style === 'script' ? '1.5rem' : '1.15rem')

/**
 * A font chooser that shows every font in itself. A normal drop-down cannot do that in every browser (Safari ignores styling on
 * its options), so this is a small listbox with the same keyboard use: arrows, Home, End, Enter and Escape.
 */
export function FontPicker({ label, help, value, onChange, styles, withDefault }: { label: string; help?: string; value: string; onChange: (v: string) => void; styles: FontStyle[]; withDefault?: boolean }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const options = useMemo(() => fontOptions(styles, withDefault), [styles, withDefault])
  const known = options.find((o) => o.value === value) ?? FONT_CHOICES.find((o) => o.value === value)
  const current = known ?? { label: value || 'Theme default', value, style: undefined }

  // The fonts are only downloaded once the list is opened (and the one in use, right away).
  useEffect(() => { loadFont(value) }, [value])
  useEffect(() => { if (open) for (const o of options) loadFont(o.value) }, [open, options])
  useEffect(() => {
    if (!open) return
    const i = Math.max(0, options.findIndex((o) => o.value === value))
    setActive(i)
    const onDown = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (open) (list.current?.children[active] as HTMLElement | undefined)?.scrollIntoView({ block: 'nearest' }) }, [open, active])

  const pick = (v: string) => { onChange(v); setOpen(false); root.current?.querySelector('button')?.focus() }
  const onKey = (e: React.KeyboardEvent) => {
    if (!open) { if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); setOpen(true) } return }
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false) }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(options.length - 1, i + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)) }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0) }
    else if (e.key === 'End') { e.preventDefault(); setActive(options.length - 1) }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (options[active]) pick(options[active].value) }
    else if (e.key === 'Tab') setOpen(false)
  }
  const shown = split(current.label)

  return (
    <div className="afield afontpick" ref={root} onKeyDown={onKey}>
      <span className="afield__label" id={`${id}-l`}>{label}</span>
      <button type="button" className="afontpick__btn" aria-haspopup="listbox" aria-expanded={open} aria-labelledby={`${id}-l ${id}-b`} onClick={() => setOpen((o) => !o)}>
        <span id={`${id}-b`} className="afontpick__name" style={value ? { fontFamily: value, fontSize: sizeFor(current as FontChoice) } : undefined}>{shown.name}</span>
        {shown.note && <span className="afontpick__note">{shown.note}</span>}
        <ChevronDown size={16} aria-hidden />
      </button>
      {open && (
        <ul ref={list} className="afontpick__list" role="listbox" aria-labelledby={`${id}-l`} aria-activedescendant={`${id}-o${active}`} tabIndex={-1}>
          {options.map((o, i) => {
            const s = split(o.label)
            return (
              <li key={o.value || 'default'} id={`${id}-o${i}`} role="option" aria-selected={o.value === value} className={`afontpick__opt${i === active ? ' is-active' : ''}${o.value === value ? ' is-on' : ''}`}
                onMouseEnter={() => setActive(i)} onMouseDown={(e) => e.preventDefault()} onClick={() => pick(o.value)}>
                <span className="afontpick__name" style={o.value ? { fontFamily: o.value, fontSize: sizeFor(o) } : undefined}>{s.name}</span>
                {s.note && <span className="afontpick__note">{s.note}</span>}
                {o.value === value && <Check size={16} aria-hidden />}
              </li>
            )
          })}
        </ul>
      )}
      {help && <span className="ahelp">{help}</span>}
    </div>
  )
}
