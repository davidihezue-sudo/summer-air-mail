import { useMemo, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowUp, Copy, Eye, EyeOff, History, Plus, Star, Trash2 } from 'lucide-react'
import type { SiteContent } from '../../content/types'
import { newCaseStudy, uid } from '../../content/factories'
import { Fields, IconBtn } from '../fields'
import type { EntityDef } from '../schema'
import { useAdmin } from '../store'
import { useRoute } from '../router'
import { Modal } from '../../components/ui/Modal'
import { moveItem } from '../paths'
import { Badge, Card, Confirm, PageHead, Switch } from '../ui'
import { api } from '../api'

/* eslint-disable @typescript-eslint/no-explicit-any */
const LISTS_TO_SCRUB: [string, string[]][] = [
  ['projects', ['serviceIds', 'toolIds', 'aiSkillIds', 'resultIds', 'contentIds', 'screenshotIds', 'relatedIds']],
  ['services', ['projectIds']], ['platforms', ['projectIds']],
]
const SINGLE_TO_SCRUB: [string, string][] = [['aiSkills', 'projectId'], ['results', 'projectId'], ['screenshots', 'projectId']]

/** Removes dangling links to a deleted item so nothing points at something that no longer exists. */
function scrubRefs(c: SiteContent, id: string) {
  const root = c as unknown as Record<string, any[]>
  for (const [coll, keys] of LISTS_TO_SCRUB) for (const item of root[coll]) for (const k of keys) if (Array.isArray(item[k])) item[k] = item[k].filter((x: string) => x !== id)
  for (const [coll, key] of SINGLE_TO_SCRUB) for (const item of root[coll]) if (item[key] === id) item[key] = ''
}

export function EntityPage({ def, id }: { def: EntityDef; id?: string }) {
  const { content, edit, set, replace, status, me } = useAdmin()
  const [versions, setVersions] = useState<{ index: number; at: string; title: string }[] | null>(null)
  const { go } = useRoute()
  const [q, setQ] = useState('')
  const [state, setState] = useState<'all' | 'on' | 'off'>('all')
  const [del, setDel] = useState<string | null>(null)
  const [csOff, setCsOff] = useState(false)
  const items = (content as any)[def.collection] as any[]

  const rows = useMemo(() => items.map((x, index) => ({ x, index })).filter(({ x }) => (!def.filter || def.filter(x)) && (state === 'all' || def.shown(x) === (state === 'on')) && (!q || `${def.titleOf(x)} ${def.subtitleOf?.(x) ?? ''}`.toLowerCase().includes(q.toLowerCase()))), [items, def, q, state])

  if (id) {
    const index = items.findIndex((x) => x.id === id)
    const item = items[index]
    if (!item) return (<><PageHead title="Not found" /><p>That item no longer exists. <a href={`#/${def.id}`}>Back to {def.title}</a></p></>)
    return (
      <>
        <PageHead
          title={def.titleOf(item)}
          intro={`Editing ${def.singular}. Changes save automatically as a draft and go live when you press Publish.`}
          actions={<>
            <button type="button" className="abtn" onClick={async () => setVersions((await api.itemVersions(def.collection, id)).versions)}><History size={14} aria-hidden /> History</button>
            <a className="abtn" href={`#/${def.id}`}><ArrowLeft size={14} aria-hidden /> All {def.title.toLowerCase()}</a>
          </>}
        />
        <Card>
          <div className="aform">
            <div className="aflags">
              <Switch checked={def.shown(item)} onChange={(v) => edit((c) => def.setShown((c as any)[def.collection][index], v))} label={`${def.shownLabels[0]} on the public site`} help={def.shown(item) ? undefined : `Currently ${def.shownLabels[1].toLowerCase()}. Visitors cannot see it.`} />
              {def.featured && <Switch checked={!!item.featured} onChange={(v) => set(`${def.collection}.${index}.featured`, v)} label="Featured" />}
              {def.caseStudy && <Switch checked={!!item.caseStudy} onChange={(v) => (v ? set(`${def.collection}.${index}.caseStudy`, newCaseStudy()) : setCsOff(true))} label="This project has a case study" help="Adds the structured challenge, strategy, execution and results sections below." />}
            </div>
            <Fields fields={def.fields} base={`${def.collection}.${index}`} />
          </div>
        </Card>
        <Modal open={!!versions} onClose={() => setVersions(null)} label="Earlier versions" className="dialog dialog--narrow adialog">
          <h2 className="adialog__title">Earlier versions</h2>
          {versions?.length === 0 && <p>No earlier versions yet. A version is remembered each time you change this {def.singular}.</p>}
          <ul className="arows">{versions?.map((v) => (
            <li key={v.index} className="arow-item"><span className="arow-item__main">{new Date(v.at).toLocaleString()} <span className="ahelp">{v.title}</span></span>
              <button type="button" className="abtn" disabled={!me || me.role === 'viewer'} onClick={async () => { const r = await api.restoreItem(def.collection, id, v.index); replace(r.draft, r.rev, { ...(status as NonNullable<typeof status>), ...r }); setVersions(null) }}>Restore</button></li>
          ))}</ul>
        </Modal>
        <Confirm open={csOff} title="Remove the case study?" body="The structured case study text for this project will be deleted. The project and its content blocks stay." confirmLabel="Remove case study" onCancel={() => setCsOff(false)} onConfirm={() => { edit((c) => { delete (c as any)[def.collection][index].caseStudy }); setCsOff(false) }} />
      </>
    )
  }

  const add = () => {
    const item = def.make()
    edit((c) => { (c as any)[def.collection].push(item) })
    go(`${def.id}/${item.id}`)
  }
  const duplicate = (index: number) => {
    const copy = structuredClone(items[index])
    copy.id = uid(def.id)
    if (copy.title !== undefined) copy.title += ' (copy)'
    else if (copy.name !== undefined) copy.name += ' (copy)'
    def.setShown(copy, false)
    edit((c) => { (c as any)[def.collection].splice(index + 1, 0, copy) })
  }
  const move = (visibleIdx: number, dir: -1 | 1) => {
    const a = rows[visibleIdx]?.index
    const b = rows[visibleIdx + dir]?.index
    if (a === undefined || b === undefined) return
    edit((c) => {
      const list = (c as any)[def.collection] as any[]
      const moved = moveItem(list, a, b)
      ;(c as any)[def.collection] = moved
      if (def.collection === 'projects') moved.forEach((p: any, i: number) => { p.order = i + 1 })
    })
  }
  const remove = (itemId: string) => {
    edit((c) => {
      const list = (c as any)[def.collection] as any[]
      list.splice(list.findIndex((x) => x.id === itemId), 1)
      scrubRefs(c, itemId)
    })
    setDel(null)
  }

  const shownCount = items.filter((x) => (!def.filter || def.filter(x)) && def.shown(x)).length
  const total = items.filter((x) => !def.filter || def.filter(x)).length

  return (
    <>
      <PageHead title={def.title} intro={def.intro} actions={<button type="button" className="abtn abtn--primary" onClick={add}><Plus size={14} aria-hidden /> Add {def.singular}</button>} />
      <Card>
        <div className="atoolbar">
          <input type="search" aria-label={`Search ${def.title}`} placeholder={`Search ${def.title.toLowerCase()}`} value={q} onChange={(e) => setQ(e.target.value)} />
          <select aria-label="Filter by status" value={state} onChange={(e) => setState(e.target.value as 'all' | 'on' | 'off')}>
            <option value="all">All ({total})</option><option value="on">{def.shownLabels[0]} ({shownCount})</option><option value="off">{def.shownLabels[1]} ({total - shownCount})</option>
          </select>
        </div>
        {rows.length === 0 ? (
          <div className="aempty"><p>{total === 0 ? `No ${def.title.toLowerCase()} yet.` : 'Nothing matches those filters.'}</p>{total === 0 && <button type="button" className="abtn abtn--primary" onClick={add}><Plus size={14} aria-hidden /> Add your first {def.singular}</button>}</div>
        ) : (
          <ul className="arows">
            {rows.map(({ x, index }, i) => {
              const shown = def.shown(x)
              const thumb = def.thumbOf?.(x)
              return (
                <li key={x.id} className="arow-item">
                  <a className="arow-item__main" href={`#/${def.id}/${x.id}`}>
                    {def.thumbOf && (thumb ? <img src={thumb} alt="" loading="lazy" /> : <span className="arow-item__ph" aria-hidden />)}
                    <span className="arow-item__text"><strong>{def.titleOf(x)}</strong><span className="ahelp">{def.subtitleOf?.(x)}</span></span>
                  </a>
                  <span className="arow-item__badges">
                    <Badge tone={shown ? 'good' : 'neutral'}>{shown ? def.shownLabels[0] : def.shownLabels[1]}</Badge>
                    {x.featured && <Badge tone="info">Featured</Badge>}
                    {x.caseStudy && <Badge tone="info">Case study</Badge>}
                  </span>
                  <span className="arow-item__actions">
                    {def.featured && <IconBtn label={x.featured ? `Unfeature ${def.titleOf(x)}` : `Feature ${def.titleOf(x)}`} onClick={() => set(`${def.collection}.${index}.featured`, !x.featured)}><Star size={16} fill={x.featured ? 'currentColor' : 'none'} /></IconBtn>}
                    <IconBtn label={shown ? `Hide ${def.titleOf(x)}` : `Show ${def.titleOf(x)}`} onClick={() => edit((c) => def.setShown((c as any)[def.collection][index], !shown))}>{shown ? <Eye size={16} /> : <EyeOff size={16} />}</IconBtn>
                    <IconBtn label="Move up" disabled={i === 0 || !!q || state !== 'all'} onClick={() => move(i, -1)}><ArrowUp size={16} /></IconBtn>
                    <IconBtn label="Move down" disabled={i === rows.length - 1 || !!q || state !== 'all'} onClick={() => move(i, 1)}><ArrowDown size={16} /></IconBtn>
                    <IconBtn label={`Duplicate ${def.titleOf(x)}`} onClick={() => duplicate(index)}><Copy size={16} /></IconBtn>
                    <IconBtn label={`Delete ${def.titleOf(x)}`} danger onClick={() => setDel(x.id)}><Trash2 size={16} /></IconBtn>
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
      <Confirm open={!!del} title={`Delete this ${def.singular}?`} body="This cannot be undone once you publish. Links to it from other items are removed." onCancel={() => setDel(null)} onConfirm={() => del && remove(del)} />
    </>
  )
}
