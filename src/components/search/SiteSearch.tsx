import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { useContent } from '../../hooks/useContent'
import { Modal } from '../ui/Modal'
import { useViewer } from '../projects/Viewer'
import { getProjects, getServices, getTools, toolCategories } from '../../content/selectors'
import { SECTION_LABELS } from '../../content/sections'
import { searchItems, type SearchAction, type SearchItem } from '../../utils/siteSearch'
import { goTo } from '../../utils/nav'
import { navigate } from '../../utils/route'
import { hasValue } from '../../utils/text'

/** Press Ctrl+K (or Command+K) to jump to any section, project, service, tool or note. */
export function SiteSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { content, sections, idOf } = useContent()
  const { openProject } = useViewer()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const listId = useId()

  const items = useMemo<SearchItem[]>(() => {
    const out: SearchItem[] = []
    for (const s of sections) if (s.visible && s.config.type !== 'hero') out.push({ id: `s-${s.config.id}`, kind: 'Section', title: s.config.navLabel || s.config.heading || SECTION_LABELS[s.config.type], detail: '', action: { type: 'section', id: s.config.id } })
    for (const p of getProjects(content)) out.push({ id: `p-${p.id}`, kind: p.caseStudy ? 'Case study' : 'Project', title: p.title, detail: [p.client, p.category, p.description].filter(hasValue).join(' '), action: { type: 'project', id: p.id } })
    const servicesId = idOf('services')
    if (servicesId) for (const s of getServices(content)) out.push({ id: `v-${s.id}`, kind: 'Service', title: s.name, detail: s.description, action: { type: 'section', id: servicesId } })
    const toolsId = idOf('tools')
    if (toolsId) for (const t of getTools(content)) out.push({ id: `t-${t.id}`, kind: 'Tool', title: t.name, detail: `${toolCategories(t).join(' ')} ${t.usage ?? ''}`, action: { type: 'section', id: toolsId } })
    for (const n of content.notes) if (!n.hidden && hasValue(n.title) && hasValue(n.slug)) out.push({ id: `n-${n.id}`, kind: 'Note', title: n.title, detail: n.summary ?? '', action: { type: 'note', slug: n.slug } })
    return out
  }, [content, sections, idOf])

  const results = useMemo(() => searchItems(items, q), [items, q])
  useEffect(() => { setActive(0) }, [q])
  useEffect(() => { if (open) { setQ(''); window.setTimeout(() => input.current?.focus(), 30) } }, [open])

  const run = (a: SearchAction) => {
    onClose()
    window.setTimeout(() => {
      if (a.type === 'section') goTo(a.id)
      else if (a.type === 'project') openProject(a.id)
      else navigate(`/notes/${encodeURIComponent(a.slug)}`)
    }, 60)
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(results.length - 1, i + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)) }
    else if (e.key === 'Enter' && results[active]) { e.preventDefault(); run(results[active].action) }
  }

  return (
    <Modal open={open} onClose={onClose} label="Search this site" className="dialog dialog--narrow sitesearch">
      <div className="sitesearch__box">
        <Search aria-hidden size={20} />
        <input
          ref={input} type="search" role="combobox" aria-expanded={results.length > 0} aria-controls={listId} aria-autocomplete="list" aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
          aria-label="Search this site" placeholder="Search projects, services, tools, notes" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
        />
      </div>
      <ul id={listId} role="listbox" aria-label="Results" className="sitesearch__list">
        {results.map((r, i) => (
          <li key={r.id} id={`${listId}-${i}`} role="option" aria-selected={i === active} className={i === active ? 'is-active' : ''} onMouseEnter={() => setActive(i)} onClick={() => run(r.action)}>
            <span className="sitesearch__kind">{r.kind}</span>
            <span className="sitesearch__title">{r.title}</span>
          </li>
        ))}
      </ul>
      {q.trim() && results.length === 0 && <p className="sitesearch__none" role="status">Nothing matches &ldquo;{q.trim()}&rdquo;.</p>}
      {!q.trim() && <p className="sitesearch__hint">Type to search. Use the arrow keys and Enter, or press Esc to close.</p>}
    </Modal>
  )
}
