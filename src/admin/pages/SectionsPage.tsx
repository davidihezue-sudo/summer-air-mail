import { useState } from 'react'
import { ArrowDown, ArrowUp, ChevronDown, Copy, Plus, Trash2 } from 'lucide-react'
import { useAdmin } from '../store'
import { Fields, IconBtn, type Field } from '../fields'
import { Badge, Card, Confirm, PageHead, Switch } from '../ui'
import { DUPLICABLE, SECTION_LABELS } from '../../content/sections'
import { sectionHasContent } from '../../content/selectors'
import { moveItem } from '../paths'
import type { SectionConfig, SectionType } from '../../content/types'
import { PROJECT_TYPES } from '../../content/factories'

const FIELDS = (type: SectionType): Field[] => [
  { kind: 'text', key: 'navLabel', label: 'Navigation label', help: 'Leave empty to keep this section out of the automatic menu.' },
  { kind: 'text', key: 'eyebrow', label: 'Small label above the heading' },
  { kind: 'text', key: 'heading', label: 'Heading', help: 'Leave empty for the default for the current season.' },
  { kind: 'textarea', key: 'intro', label: 'Introduction' },
  { kind: 'tone', key: 'tone', label: 'Background colour' },
  { kind: 'image', key: 'image', label: 'Optional image' },
  { kind: 'group', key: 'cta', label: 'Call to action button', open: false, fields: [{ kind: 'text', key: 'label', label: 'Button text' }, { kind: 'text', key: 'href', label: 'Link (a section like #contact, or a full https:// link)' }] },
  ...(type === 'work' ? [{ kind: 'select', key: 'filterCategory', label: 'Show only this project type', options: ['', ...PROJECT_TYPES], custom: true } as Field] : []),
  ...(type === 'richText' ? [{ kind: 'rich', key: 'body', label: 'Text', rows: 8 } as Field] : []),
]

export function SectionsPage() {
  const { content, edit, set } = useAdmin()
  const sections = content.portfolio.sections
  const [open, setOpen] = useState<string | null>(null)
  const [drag, setDrag] = useState<number | null>(null)
  const [del, setDel] = useState<string | null>(null)
  const base = 'portfolio.sections'

  const duplicate = (i: number) => {
    const s = structuredClone(sections[i])
    let n = 2
    while (sections.some((x) => x.id === `${s.id.replace(/-\d+$/, '')}-${n}`)) n++
    s.id = `${s.id.replace(/-\d+$/, '')}-${n}`
    edit((c) => { c.portfolio.sections.splice(i + 1, 0, s) })
    setOpen(s.id)
  }
  const addText = () => {
    let n = 1
    while (sections.some((x) => x.id === `text-${n}`)) n++
    const s: SectionConfig = { id: `text-${n}`, type: 'richText', enabled: true, heading: 'New section', body: '' }
    // Place before Contact if it exists, otherwise at the end.
    const contact = sections.findIndex((x) => x.type === 'contact')
    edit((c) => { c.portfolio.sections.splice(contact < 0 ? c.portfolio.sections.length : contact, 0, s) })
    setOpen(s.id)
  }
  const isCore = (i: number) => sections.findIndex((x) => x.type === sections[i].type) === i && !DUPLICABLE.includes(sections[i].type)
  void isCore

  return (
    <>
      <PageHead
        title="Sections & Visibility"
        intro="Drag sections or use the arrows to reorder the page. Switch sections on or off, rename them and change their headings, colours and images. A section that is on but has no content stays hidden automatically."
        actions={<button type="button" className="abtn abtn--primary" onClick={addText}><Plus size={14} aria-hidden /> Add text section</button>}
      />
      <Card>
        <ol className="alist alist--sections">
          {sections.map((s, i) => {
            const has = sectionHasContent(s.type, content, s)
            const canDuplicate = DUPLICABLE.includes(s.type)
            const isDuplicate = canDuplicate && sections.findIndex((x) => x.type === s.type) !== i
            const removable = isDuplicate || s.type === 'richText'
            return (
              <li key={s.id} className={`alist__item ${drag === i ? 'is-drag' : ''}`} draggable={open !== s.id}
                onDragStart={() => setDrag(i)} onDragEnd={() => setDrag(null)} onDragOver={(e) => e.preventDefault()}
                onDrop={() => { if (drag !== null) set(base, moveItem(sections, drag, i)); setDrag(null) }}>
                <div className="alist__head">
                  <button type="button" className="alist__title" aria-expanded={open === s.id} onClick={() => setOpen(open === s.id ? null : s.id)}>
                    <ChevronDown size={16} aria-hidden className={open === s.id ? 'is-open' : ''} />
                    <strong>{s.heading || s.navLabel || SECTION_LABELS[s.type]}</strong>
                    {(s.heading || s.navLabel) && (s.heading || s.navLabel) !== SECTION_LABELS[s.type] && <span className="ahelp">{SECTION_LABELS[s.type]}</span>}
                  </button>
                  <span className="asec-state">{!s.enabled ? <Badge>Off</Badge> : has ? <Badge tone="good">Showing</Badge> : <Badge tone="warn">Waiting for content</Badge>}</span>
                  <Switch checked={s.enabled} onChange={(v) => set(`${base}.${i}.enabled`, v)} label={`Show ${s.heading || s.navLabel || SECTION_LABELS[s.type]}`} hideLabel />
                  <IconBtn label="Move up" disabled={i === 0} onClick={() => set(base, moveItem(sections, i, i - 1))}><ArrowUp size={16} /></IconBtn>
                  <IconBtn label="Move down" disabled={i === sections.length - 1} onClick={() => set(base, moveItem(sections, i, i + 1))}><ArrowDown size={16} /></IconBtn>
                  {canDuplicate && <IconBtn label="Duplicate section" onClick={() => duplicate(i)}><Copy size={16} /></IconBtn>}
                  {removable && <IconBtn label="Delete section" danger onClick={() => setDel(s.id)}><Trash2 size={16} /></IconBtn>}
                </div>
                {open === s.id && (
                  <div className="alist__body">
                    {!has && s.enabled && <p className="anotice">This section is on but has nothing to show yet, so visitors do not see it. Add content on its own admin page.</p>}
                    <Fields fields={FIELDS(s.type)} base={`${base}.${i}`} />
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      </Card>
      <Confirm open={!!del} title="Delete this section?" body="Only this copy of the section is removed. Your content is not deleted." onCancel={() => setDel(null)} onConfirm={() => { edit((c) => { c.portfolio.sections = c.portfolio.sections.filter((x) => x.id !== del) }); setDel(null) }} />
    </>
  )
}
