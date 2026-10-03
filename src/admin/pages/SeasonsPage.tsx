import { useState } from 'react'
import { useAdmin } from '../store'
import { Fields, type Field } from '../fields'
import { Badge, Card, PageHead, Switch } from '../ui'
import { PreviewFrame, type Viewport } from '../PreviewFrame'
import { THEMES, SEASON_ORDER } from '../../themes'
import { DEFAULT_RANGES, FONT_CHOICES, deriveTokens, rangesAreUsable, resolveSeason, resolveTheme, validDate } from '../../themes/seasonManager'
import type { Level, SeasonMode, SeasonName, ThemeColors } from '../../content/types'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const SOUTH = { spring: { month: 9, day: 22 }, summer: { month: 12, day: 21 }, autumn: { month: 3, day: 20 }, winter: { month: 6, day: 21 } }
const COLOR_LABELS: Record<keyof ThemeColors, string> = {
  paper: 'Paper (lightest background)', sand: 'Sand (main background)', ink: 'Ink (text)', red: 'Accent red', green: 'Deep green', stone: 'Stone (muted)',
  sea: 'Sea (dark sections)', aqua: 'Aqua', pink: 'Pink', sage: 'Sage', butter: 'Butter', peach: 'Peach', sky: 'Sky',
}
const INTENSITY: { value: Level; label: string }[] = [{ value: 'none', label: 'None' }, { value: 'subtle', label: 'Subtle' }, { value: 'standard', label: 'Standard' }, { value: 'expressive', label: 'Expressive' }]

const seasonFields = (s: SeasonName): Field[] => [
  { kind: 'select', key: 'intensity', label: 'Decoration and animation intensity', options: INTENSITY, help: 'Also capped by Appearance > Professional intensity and by visitors\' reduced motion settings.' },
  { kind: 'bool', key: 'texture', label: 'Paper and grain texture' },
  { kind: 'group', label: 'Fonts (optional)', open: false, fields: [
    { kind: 'select', key: 'fonts.display', label: 'Headings', options: FONT_CHOICES }, { kind: 'select', key: 'fonts.script', label: 'Signature script', options: FONT_CHOICES }, { kind: 'select', key: 'fonts.body', label: 'Body text', options: FONT_CHOICES },
  ] },
  { kind: 'group', label: `${THEMES[s].label} images (optional)`, open: false, help: 'If an image is not set, the default hero image and built-in artwork are used.', fields: [
    { kind: 'image', key: 'heroCutout', label: 'Hero portrait for this season' }, { kind: 'image', key: 'heroFlowers', label: 'Hero decorative image for this season' },
    { kind: 'file', key: 'heroBackground', label: 'Hero background image', accept: 'image' }, { kind: 'file', key: 'decorImage', label: 'Other decorative image', accept: 'image' },
  ] },
]

export function SeasonsPage() {
  const { content, set } = useAdmin()
  const s = content.portfolio.seasons
  const current = resolveSeason(s)
  const [tab, setTab] = useState<SeasonName>(current)
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const usable = rangesAreUsable(s.ranges)
  const resolved = resolveTheme(tab, s)
  const base = `portfolio.seasons.overrides.${tab}`

  const rangeText = (name: SeasonName) => {
    const r = s.ranges[name]
    return validDate(r.month, r.day) ? `${r.day} ${MONTHS[r.month - 1]}` : 'invalid date'
  }

  return (
    <>
      <PageHead title="Seasons" intro="One brand that changes wardrobe through the year. Choose a season or let the site follow the visitor's date, set exactly when each season starts, and tune each season's colours, decorations and images." />

      <Card title="Theme mode">
        <div className="amodes" role="radiogroup" aria-label="Theme mode">
          {(['auto', ...SEASON_ORDER] as SeasonMode[]).map((m) => {
            const t = m === 'auto' ? THEMES[current] : THEMES[m]
            const on = s.mode === m
            return (
              <button key={m} type="button" role="radio" aria-checked={on} className={`amode ${on ? 'is-on' : ''}`} onClick={() => set('portfolio.seasons.mode', m)}>
                <span className="amode__swatches" aria-hidden>{(['paper', 'sand', 'sky', 'pink', 'green', 'red', 'ink'] as const).map((k) => <i key={k} style={{ background: t.colors[k] }} />)}</span>
                <strong>{m === 'auto' ? 'Auto' : THEMES[m].label}</strong>
                <span className="ahelp">{m === 'auto' ? `Follows the visitor's date. Today that is ${THEMES[current].label}.` : THEMES[m].blurb}</span>
              </button>
            )
          })}
        </div>
      </Card>

      <Card title="When each season starts">
        <p className="ahelp">Each season begins on its date and lasts until the next one begins. Southern hemisphere? Use the preset. The season is decided from the visitor's own date.</p>
        <div className="aranges">
          {SEASON_ORDER.map((name) => (
            <fieldset key={name} className="arange">
              <legend>{THEMES[name].label} starts</legend>
              <label className="sr-only" htmlFor={`m-${name}`}>{name} month</label>
              <select id={`m-${name}`} value={s.ranges[name].month} onChange={(e) => set(`portfolio.seasons.ranges.${name}.month`, Number(e.target.value))}>{MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select>
              <label className="sr-only" htmlFor={`d-${name}`}>{name} day</label>
              <input id={`d-${name}`} type="number" min={1} max={31} value={s.ranges[name].day} onChange={(e) => set(`portfolio.seasons.ranges.${name}.day`, Number(e.target.value))} />
            </fieldset>
          ))}
        </div>
        {usable ? (
          <p className="ahelp">{SEASON_ORDER.map((n) => `${THEMES[n].label} from ${rangeText(n)}`).join(' · ')}</p>
        ) : (
          <p role="alert" className="aerror">These dates are not valid or two seasons start on the same day, so the site is using the standard dates until you fix them.</p>
        )}
        <div className="arow">
          <button type="button" className="abtn" onClick={() => set('portfolio.seasons.ranges', structuredClone(DEFAULT_RANGES))}>Standard (northern hemisphere)</button>
          <button type="button" className="abtn" onClick={() => set('portfolio.seasons.ranges', structuredClone(SOUTH))}>Southern hemisphere</button>
        </div>
      </Card>

      <Card title="Transition between seasons">
        <div className="aform"><Fields base="portfolio.seasons" fields={[{ kind: 'select', key: 'transition', label: 'How the site changes when the season changes', options: [{ value: 'none', label: 'None' }, { value: 'immediate', label: 'Immediate' }, { value: 'fade', label: 'Fade' }, { value: 'crossfade', label: 'Crossfade (where the browser supports it)' }], help: 'Visitors see this when the date crosses a boundary while the page is open, and you see it in the preview below. Reduced motion always switches instantly.' }]} /></div>
      </Card>

      <Card title="Edit and preview a season">
        <div className="atabs" role="tablist" aria-label="Season to edit">
          {SEASON_ORDER.map((n) => <button key={n} role="tab" type="button" aria-selected={tab === n} className={`atab ${tab === n ? 'is-on' : ''}`} onClick={() => setTab(n)}>{THEMES[n].label}{current === n && <Badge tone="info">Now</Badge>}</button>)}
        </div>
        <div className="asplit">
          <div className="aform">
            <h3 className="asub">Colours</h3>
            <p className="ahelp">Each season has its own palette. Change a colour to override it; reset to go back to the designed colour.</p>
            <div className="acolors">
              {(Object.keys(COLOR_LABELS) as (keyof ThemeColors)[]).map((k) => {
                const overridden = !!s.overrides[tab].colors[k]
                return (
                  <div key={k} className="acolor">
                    <label htmlFor={`c-${tab}-${k}`}>{COLOR_LABELS[k]}</label>
                    <div className="arow">
                      <input id={`c-${tab}-${k}`} type="color" value={resolved.colors[k]} onChange={(e) => set(`${base}.colors.${k}`, e.target.value)} />
                      <code>{resolved.colors[k]}</code>
                      {overridden && <button type="button" className="abtn abtn--ghost" onClick={() => { const c = { ...s.overrides[tab].colors }; delete c[k]; set(`${base}.colors`, c) }}>Reset</button>}
                    </div>
                  </div>
                )
              })}
            </div>
            {Object.keys(s.overrides[tab].colors).length > 0 && <button type="button" className="abtn" onClick={() => set(`${base}.colors`, {})}>Reset all {THEMES[tab].label.toLowerCase()} colours</button>}
            <p className="ahelp">Readable text colours are worked out automatically from these ({Object.values(deriveTokens(resolved.colors)).join(', ')}).</p>

            <h3 className="asub">Decorations</h3>
            {THEMES[tab].decorations.map((d) => (
              <Switch key={d.id} label={d.label} help={d.description} checked={resolved.decorations.includes(d.id)} onChange={(v) => set(`${base}.decorations.${d.id}`, v)} />
            ))}
            <Fields base={base} fields={seasonFields(tab)} />
          </div>
          <div>
            <div className="arow" role="group" aria-label="Preview size">
              {(['desktop', 'tablet', 'mobile'] as Viewport[]).map((v) => <button key={v} type="button" aria-pressed={viewport === v} className={`abtn ${viewport === v ? 'abtn--primary' : ''}`} onClick={() => setViewport(v)}>{v[0].toUpperCase() + v.slice(1)}</button>)}
            </div>
            <PreviewFrame viewport={viewport} season={tab} />
            <p className="ahelp">The preview shows your unsaved draft in {THEMES[tab].label}. Nothing is public until you publish.</p>
          </div>
        </div>
      </Card>
    </>
  )
}
