import { useState } from 'react'
import { useAdmin } from '../store'
import { Fields } from '../fields'
import { Badge, Card, PageHead, Switch } from '../ui'
import { PreviewFrame, type Viewport } from '../PreviewFrame'
import { CELEBRATION_DECORATIONS, DEFAULT_CELEBRATIONS, activeCelebration, celebrationWhen } from '../../themes/celebrations'
import { resolveSeason, resolveTheme } from '../../themes/seasonManager'
import { THEMES, SEASON_ORDER } from '../../themes'
import type { Celebration, ThemeColors } from '../../content/types'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const COLOR_LABELS: Record<keyof ThemeColors, string> = {
  paper: 'Paper (lightest background)', sand: 'Sand (main background)', ink: 'Ink (text)', red: 'Accent red', green: 'Deep green', stone: 'Stone (muted)',
  sea: 'Sea (dark sections)', aqua: 'Aqua', pink: 'Pink', sage: 'Sage', butter: 'Butter', peach: 'Peach', sky: 'Sky',
}
const newCelebration = (): Celebration => ({
  id: `cel-${Math.random().toString(36).slice(2, 8)}`, name: 'My celebration', enabled: true, rule: 'fixed', from: { month: 1, day: 1 }, to: { month: 1, day: 1 },
  easterFrom: -2, easterTo: 1, season: '', greeting: '', colors: {}, decorations: ['confetti'], intensity: '',
})

function DateParts({ label, base, value }: { label: string; base: string; value: { month: number; day: number } }) {
  const { set } = useAdmin()
  return (
    <fieldset className="arange">
      <legend>{label}</legend>
      <label className="sr-only" htmlFor={`${base}-m`}>{label} month</label>
      <select id={`${base}-m`} value={value.month} onChange={(e) => set(`${base}.month`, Number(e.target.value))}>{MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select>
      <label className="sr-only" htmlFor={`${base}-d`}>{label} day</label>
      <input id={`${base}-d`} type="number" min={1} max={31} value={value.day} onChange={(e) => set(`${base}.day`, Number(e.target.value))} />
    </fieldset>
  )
}

export function CelebrationsPage() {
  const { content, set } = useAdmin()
  const cel = content.portfolio.celebrations
  const items = cel.items
  const today = activeCelebration(cel)
  const [preview, setPreview] = useState('today')
  const [viewport, setViewport] = useState<Viewport>(() => (window.innerWidth < 700 ? 'mobile' : 'desktop'))
  const season = resolveSeason(content.portfolio.seasons)
  const missing = DEFAULT_CELEBRATIONS.filter((d) => !items.some((c) => c.id === d.id))
  const seasonColors = resolveTheme(season, content.portfolio.seasons).colors

  return (
    <>
      <PageHead title="Celebrations" intro="For a few days each year the site can change its colours, scatter decorations and greet visitors. Christmas, Boxing Day and New Year are on from the start. Turn on the others, change any date or colour, or add your own." />

      <Card title="Celebrations">
        <Switch label="Change the look of the site for celebrations" help="Off keeps the plain season all year. Visitors see a celebration on their own calendar dates." checked={cel.enabled} onChange={(v) => set('portfolio.celebrations.enabled', v)} />
        <p className="ahelp">{today ? <>Today the site is showing <strong>{today.name}</strong>.</> : 'No celebration is on today, so the site shows the season.'} If two celebrations overlap, the one higher in the list wins.</p>
      </Card>

      <Card title="Preview">
        <div className="arow">
          <label className="afield" style={{ margin: 0 }}>
            <span className="afield__label">Show the site as it looks for</span>
            <select value={preview} onChange={(e) => setPreview(e.target.value)}>
              <option value="today">Today (what visitors see now)</option>
              <option value="none">No celebration (the plain season)</option>
              {items.map((c) => <option key={c.id} value={c.id}>{c.name || 'Untitled'}</option>)}
            </select>
          </label>
          <div className="arow" role="group" aria-label="Preview size">
            {(['desktop', 'mobile'] as Viewport[]).map((v) => <button key={v} type="button" aria-pressed={viewport === v} className={`abtn ${viewport === v ? 'abtn--primary' : ''}`} onClick={() => setViewport(v)}>{v[0].toUpperCase() + v.slice(1)}</button>)}
          </div>
        </div>
        <PreviewFrame viewport={viewport} celebration={preview === 'today' ? undefined : preview} />
        <p className="ahelp">The preview shows your unsaved draft. Nothing is public until you publish.</p>
      </Card>

      {items.map((c, i) => {
        const base = `portfolio.celebrations.items.${i}`
        const set1 = (patch: Partial<Celebration>) => set(base, { ...c, ...patch })
        return (
          <Card key={c.id} title={c.name || 'Untitled celebration'} actions={today?.id === c.id ? <Badge tone="good">On today</Badge> : c.enabled ? <Badge tone="info">On</Badge> : <Badge>Off</Badge>}>
            <div className="aform">
              <Switch label="Use this celebration" checked={c.enabled} onChange={(v) => set1({ enabled: v })} />
              <p className="ahelp">{celebrationWhen(c)}</p>
              <Fields base={base} fields={[
                { kind: 'text', key: 'name', label: 'Name (only you see this)' },
                { kind: 'text', key: 'greeting', label: 'Greeting across the top', help: 'A line of text at the top of the site while this is on. Leave it blank for none. An announcement banner, if you have one showing, takes its place.' },
                { kind: 'select', key: 'rule', label: 'When it happens', options: [{ value: 'fixed', label: 'The same dates every year' }, { value: 'easter', label: 'Around Easter (the dates move each year)' }] },
              ]} />
              {c.rule === 'fixed' ? (
                <div className="aranges">
                  <DateParts label="Starts" base={`${base}.from`} value={c.from} />
                  <DateParts label="Ends (last day included)" base={`${base}.to`} value={c.to} />
                </div>
              ) : (
                <Fields base={base} fields={[
                  { kind: 'number', key: 'easterFrom', label: 'Starts, in days from Easter Sunday', min: -30, max: 30, nullable: false, help: 'Good Friday is -2. Easter Sunday is 0.' },
                  { kind: 'number', key: 'easterTo', label: 'Ends, in days from Easter Sunday', min: -30, max: 30, nullable: false, help: 'Easter Monday is 1.' },
                ]} />
              )}
              <Fields base={base} fields={[
                { kind: 'select', key: 'season', label: 'Artwork and feel', options: [{ value: '', label: 'The current season' }, ...SEASON_ORDER.map((n) => ({ value: n, label: `${THEMES[n].label}: ${THEMES[n].blurb}` }))], help: 'Which season\'s stamp, postmark and hero drawings to use while this is on. Christmas uses winter so the holly and snow appear even before winter starts.' },
                { kind: 'multi', key: 'decorations', label: 'Decorations', options: CELEBRATION_DECORATIONS.map((d) => ({ value: d.id, label: d.label })), help: 'Visitors who prefer reduced motion see none of the moving ones.' },
                { kind: 'select', key: 'intensity', label: 'How lively', options: [{ value: '', label: 'Same as the season' }, { value: 'none', label: 'None' }, { value: 'subtle', label: 'Subtle' }, { value: 'standard', label: 'Standard' }, { value: 'expressive', label: 'Expressive' }], help: 'Also capped by Appearance and by the visitor\'s reduced motion setting.' },
              ]} />
              <details>
                <summary>Colours{Object.keys(c.colors ?? {}).length ? ` (${Object.keys(c.colors).length} changed)` : ' (the season\'s own)'}</summary>
                <p className="ahelp">Pick a colour to replace the season's for this celebration. Anything you leave alone keeps the season's colour.</p>
                <div className="acolors">
                  {(Object.keys(COLOR_LABELS) as (keyof ThemeColors)[]).map((k) => {
                    const own = c.colors?.[k]
                    return (
                      <div key={k} className="acolor">
                        <label htmlFor={`${c.id}-${k}`}>{COLOR_LABELS[k]}</label>
                        <div className="arow">
                          <input id={`${c.id}-${k}`} type="color" value={own ?? seasonColors[k]} onChange={(e) => set1({ colors: { ...c.colors, [k]: e.target.value } })} />
                          <code>{own ?? 'season'}</code>
                          {own && <button type="button" className="abtn abtn--ghost" onClick={() => { const next = { ...c.colors }; delete next[k]; set1({ colors: next }) }}>Reset</button>}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {Object.keys(c.colors ?? {}).length > 0 && <button type="button" className="abtn" onClick={() => set1({ colors: {} })}>Use the season's colours</button>}
              </details>
              <div className="arow">
                <button type="button" className="abtn" onClick={() => setPreview(c.id)}>Preview this</button>
                {i > 0 && <button type="button" className="abtn abtn--ghost" onClick={() => { const next = [...items]; [next[i - 1], next[i]] = [next[i], next[i - 1]]; set('portfolio.celebrations.items', next) }}>Move up</button>}
                {i < items.length - 1 && <button type="button" className="abtn abtn--ghost" onClick={() => { const next = [...items]; [next[i + 1], next[i]] = [next[i], next[i + 1]]; set('portfolio.celebrations.items', next) }}>Move down</button>}
                <button type="button" className="abtn abtn--danger" onClick={() => { if (window.confirm(`Remove ${c.name || 'this celebration'}?`)) set('portfolio.celebrations.items', items.filter((x) => x.id !== c.id)) }}>Remove</button>
              </div>
            </div>
          </Card>
        )
      })}

      <Card title="Add or restore">
        <div className="arow">
          <button type="button" className="abtn abtn--primary" onClick={() => set('portfolio.celebrations.items', [...items, newCelebration()])}>Add your own celebration</button>
          {missing.length > 0 && <button type="button" className="abtn" onClick={() => set('portfolio.celebrations.items', [...items, ...structuredClone(missing)])}>Bring back the standard ones I removed ({missing.map((m) => m.name).join(', ')})</button>}
        </div>
      </Card>
    </>
  )
}
