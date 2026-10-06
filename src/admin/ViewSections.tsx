import { useState } from 'react'
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react'
import type { Audience } from '../content/types'
import { orderSections } from '../content/derive'
import { SECTION_LABELS } from '../content/sections'
import { sectionHasContent } from '../content/selectors'
import { Badge, Switch } from './ui'
import { IconBtn } from './fields'
import { getIn, moveItem } from './paths'
import { useAdmin } from './store'

/**
 * Inside an audience view: every section of the page in the order this view shows it, with a switch for each and arrows (or
 * dragging) to move it. Nothing here touches the main site. Until you move something the view follows the main site's order.
 */
export function ViewSectionsField({ base }: { base: string }) {
  const { content, set } = useAdmin()
  const a = (getIn(content, base) ?? {}) as Partial<Audience>
  const rows = orderSections(content.portfolio.sections, { sectionOrder: a.sectionOrder ?? [], firstSectionIds: a.firstSectionIds ?? [] }).filter((s) => s.type !== 'hero')
  const hidden = a.hideSectionIds ?? []
  const shown = a.showSectionIds ?? []
  const custom = (a.sectionOrder?.length ?? 0) > 0 || (a.firstSectionIds?.length ?? 0) > 0
  const [drag, setDrag] = useState<number | null>(null)

  const on = (id: string, enabled: boolean) => (hidden.includes(id) ? false : enabled ? true : shown.includes(id))
  const move = (from: number, to: number) => {
    if (to < 0 || to >= rows.length || from === to) return
    set(`${base}.sectionOrder`, moveItem(rows.map((r) => r.id), from, to))
    if (a.firstSectionIds?.length) set(`${base}.firstSectionIds`, [])
  }
  // Switching on or off is stored as the difference from the main site, so a section you never touch keeps following it.
  const toggle = (id: string, mainOn: boolean, want: boolean) => {
    const drop = (list: string[]) => list.filter((x) => x !== id)
    if (mainOn) { set(`${base}.hideSectionIds`, want ? drop(hidden) : [...drop(hidden), id]); set(`${base}.showSectionIds`, drop(shown)) }
    else { set(`${base}.showSectionIds`, want ? [...drop(shown), id] : drop(shown)); set(`${base}.hideSectionIds`, drop(hidden)) }
  }

  return (
    <div className="afield" role="group" aria-label="Sections in this view">
      <span className="afield__label">Sections in this view</span>
      <p className="ahelp">Drag a section or use the arrows to move it, and use the switch to show or hide it for this audience. {custom ? 'This view has its own order.' : 'Until you move something, this view follows the main site\'s order.'} The main site is never changed.</p>
      <ol className="alist alist--sections" aria-label="Sections in this view, in order">
        {rows.map((s, i) => {
          const label = s.heading || s.navLabel || SECTION_LABELS[s.type as keyof typeof SECTION_LABELS] || s.id
          const isOn = on(s.id, s.enabled)
          const has = sectionHasContent(s.type as never, content, s)
          return (
            <li key={s.id} className={`alist__item ${drag === i ? 'is-drag' : ''}`} draggable
              onDragStart={() => setDrag(i)} onDragEnd={() => setDrag(null)} onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (drag !== null) move(drag, i); setDrag(null) }}>
              <div className="alist__head">
                <GripVertical size={16} aria-hidden className="aview__grip" />
                <span className="alist__title"><strong>{label}</strong>{!s.enabled && !shown.includes(s.id) && <span className="ahelp">off on the main site</span>}{!s.enabled && shown.includes(s.id) && <span className="ahelp">off on the main site, on here</span>}</span>
                <span className="asec-state">{!isOn ? <Badge>Hidden here</Badge> : has ? <Badge tone="good">Showing</Badge> : <Badge tone="warn">No content yet</Badge>}</span>
                <Switch checked={isOn} onChange={(v) => toggle(s.id, s.enabled, v)} label={`Show ${label} in this view`} hideLabel />
                <IconBtn label={`Move ${label} up`} disabled={i === 0} onClick={() => move(i, i - 1)}><ArrowUp size={16} /></IconBtn>
                <IconBtn label={`Move ${label} down`} disabled={i === rows.length - 1} onClick={() => move(i, i + 1)}><ArrowDown size={16} /></IconBtn>
              </div>
            </li>
          )
        })}
      </ol>
      <div className="arow">
        <button type="button" className="abtn" disabled={!custom} onClick={() => { set(`${base}.sectionOrder`, []); set(`${base}.firstSectionIds`, []) }}>Use the main site's order</button>
      </div>
    </div>
  )
}
