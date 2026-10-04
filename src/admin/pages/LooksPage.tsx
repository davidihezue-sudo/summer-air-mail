import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useAdmin } from '../store'
import { Card, Confirm, PageHead } from '../ui'
import { applyLook, captureLook } from '../../content/derive'
import { newLook } from '../../content/factories'
import { Fields } from '../fields'

/** Saved combinations of professional intensity, season mode, design settings and hero layout. */
export function LooksPage() {
  const { content, edit } = useAdmin()
  const [name, setName] = useState('')
  const [del, setDel] = useState<string | null>(null)
  const [done, setDone] = useState('')

  const save = () => {
    const look = { ...newLook(), name: name.trim() || 'My look', settings: captureLook(content) }
    edit((c) => { c.looks.push(look) })
    setName('')
    setDone(`Saved "${look.name}".`)
  }
  const apply = (id: string) => {
    const look = content.looks.find((l) => l.id === id)
    if (!look) return
    edit((c) => { c.portfolio = applyLook(c, look).portfolio })
    setDone(`Applied "${look.name}" to the site. Publish to make it live.`)
  }

  return (
    <>
      <PageHead title="Saved Looks" intro="Save the current professional intensity, season setting, design and hero layout as a named look, then switch between looks in one click. Application links can use a look too." />
      <Card title="Save the current look">
        <div className="arow">
          <input aria-label="Name for this look" placeholder="For example: Agency pitch" value={name} onChange={(e) => setName(e.target.value)} />
          <button type="button" className="abtn abtn--primary" onClick={save}>Save current look</button>
        </div>
        {done && <p role="status" className="ahelp">{done}</p>}
      </Card>
      <Card title={`Your looks (${content.looks.length})`}>
        {content.looks.length === 0 ? <p className="ahelp">No saved looks yet.</p> : (
          <ul className="arows">
            {content.looks.map((l, i) => (
              <li key={l.id} className="arow-item arow-item--block">
                <div className="aform"><Fields base={`looks.${i}`} fields={[{ kind: 'text', key: 'name', label: 'Name' }, { kind: 'text', key: 'description', label: 'Note' }]} /></div>
                <p className="ahelp">{l.settings.professional} mode, {l.settings.seasonMode} season, {l.settings.design.buttons} buttons, {l.settings.design.colorMode} colours.</p>
                <span className="arow-item__actions">
                  <button type="button" className="abtn" onClick={() => apply(l.id)}>Apply to the site</button>
                  <button type="button" className="abtn abtn--danger" onClick={() => setDel(l.id)}><Trash2 size={14} aria-hidden /> Delete</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Confirm open={!!del} title="Delete this look?" body="Application links that use it fall back to the site look." onCancel={() => setDel(null)} onConfirm={() => { edit((c) => { c.looks = c.looks.filter((l) => l.id !== del); for (const a of c.applications) if (a.lookId === del) a.lookId = '' }); setDel(null) }} />
    </>
  )
}
