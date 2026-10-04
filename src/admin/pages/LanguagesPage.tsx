import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useAdmin } from '../store'
import { Card, Confirm, PageHead, Switch } from '../ui'
import { newLanguage } from '../../content/factories'
import { translatableFields } from '../../content/derive'
import { UI_DEFAULTS } from '../../i18n/ui'

/** Languages: interface strings plus a translation for every piece of content the owner has written. */
export function LanguagesPage() {
  const { content, edit, set } = useAdmin()
  const i = content.portfolio.i18n
  const [sel, setSel] = useState(0)
  const [del, setDel] = useState(false)
  const [tab, setTab] = useState<'ui' | 'text'>('text')
  const [only, setOnly] = useState(true)
  const fields = useMemo(() => translatableFields(content), [content])
  const lang = i.languages[sel]
  const base = `portfolio.i18n.languages.${sel}`

  return (
    <>
      <PageHead title="Languages" intro="Add a language and translate what visitors read. Anything you leave blank falls back to your original text. A switcher appears in the header." />
      <Card>
        <div className="aform">
          <Switch checked={i.enabled} onChange={(v) => set('portfolio.i18n.enabled', v)} label="Offer more than one language" />
          <label className="afield"><span className="alabel">Name of your main language in the switcher</span><input value={i.defaultLabel} onChange={(e) => set('portfolio.i18n.defaultLabel', e.target.value)} /></label>
          <Switch checked={i.switcher} onChange={(v) => set('portfolio.i18n.switcher', v)} label="Show the switcher in the header" help="If off, visitors reach a language with ?lang=code in the address." />
        </div>
      </Card>
      <Card title="Languages" actions={<button type="button" className="abtn" onClick={() => { edit((c) => { c.portfolio.i18n.languages.push({ ...newLanguage(), code: 'fr', label: 'Francais' }) }); setSel(i.languages.length) }}><Plus size={14} aria-hidden /> Add language</button>}>
        {i.languages.length === 0 ? <p className="ahelp">No extra languages yet.</p> : (
          <>
            <div className="achips">{i.languages.map((l, n) => <button key={n} type="button" className={`achip ${n === sel ? 'is-on' : ''}`} onClick={() => setSel(n)}>{l.label || l.code || 'New'}</button>)}</div>
            {lang && (
              <div className="aform">
                <label className="afield"><span className="alabel">Language code (for example fr, es, ar)</span><input value={lang.code} maxLength={8} onChange={(e) => set(`${base}.code`, e.target.value.toLowerCase().replace(/[^a-z-]/g, ''))} /></label>
                <label className="afield"><span className="alabel">Name shown in the switcher</span><input value={lang.label} onChange={(e) => set(`${base}.label`, e.target.value)} /></label>
                <Switch checked={lang.rtl} onChange={(v) => set(`${base}.rtl`, v)} label="Reads right to left (Arabic, Hebrew)" />
                <div className="achips" role="tablist">
                  <button role="tab" aria-selected={tab === 'text'} type="button" className={`achip ${tab === 'text' ? 'is-on' : ''}`} onClick={() => setTab('text')}>Your content</button>
                  <button role="tab" aria-selected={tab === 'ui'} type="button" className={`achip ${tab === 'ui' ? 'is-on' : ''}`} onClick={() => setTab('ui')}>Buttons and labels</button>
                </div>
                {tab === 'ui' ? (
                  <table className="atable"><thead><tr><th>English</th><th>{lang.label || lang.code}</th></tr></thead><tbody>
                    {Object.entries(UI_DEFAULTS).map(([k, en]) => (
                      <tr key={k}><td>{en}</td><td><input aria-label={`${lang.label} for "${en}"`} value={lang.ui[k] ?? ''} onChange={(e) => set(`${base}.ui.${k}`, e.target.value)} /></td></tr>
                    ))}
                  </tbody></table>
                ) : (
                  <>
                    <Switch checked={only} onChange={setOnly} label="Show only fields still to translate" />
                    <table className="atable"><thead><tr><th>Original</th><th>{lang.label || lang.code}</th></tr></thead><tbody>
                      {fields.filter((f) => !only || !(lang.text[f.path] ?? '').trim()).map((f) => (
                        <tr key={f.path}><td><span className="ahelp">{f.label}</span><br />{f.value.length > 160 ? `${f.value.slice(0, 160)}...` : f.value}</td>
                          <td>{f.value.length > 80 ? <textarea rows={3} aria-label={`${lang.label} for ${f.label}`} value={lang.text[f.path] ?? ''} onChange={(e) => set(`${base}.text.${f.path}`, e.target.value)} /> : <input aria-label={`${lang.label} for ${f.label}`} value={lang.text[f.path] ?? ''} onChange={(e) => set(`${base}.text.${f.path}`, e.target.value)} />}</td></tr>
                      ))}
                    </tbody></table>
                  </>
                )}
                <button type="button" className="abtn abtn--danger" onClick={() => setDel(true)}><Trash2 size={14} aria-hidden /> Delete this language</button>
              </div>
            )}
          </>
        )}
      </Card>
      <Confirm open={del} title="Delete this language?" body="Its translations are removed." onCancel={() => setDel(false)} onConfirm={() => { edit((c) => { c.portfolio.i18n.languages.splice(sel, 1) }); setSel(0); setDel(false) }} />
    </>
  )
}
