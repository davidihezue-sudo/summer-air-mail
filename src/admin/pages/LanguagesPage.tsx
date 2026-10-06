import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useAdmin } from '../store'
import { Card, Confirm, PageHead, Switch } from '../ui'
import { newLanguage } from '../../content/factories'
import { translatableFields } from '../../content/derive'
import { UI_DEFAULTS } from '../../i18n/ui'
import { BUILTIN_STRINGS } from '../../i18n/builtin'
import { translateFields, type Engine, type TranslateReport } from '../../utils/translate'
import { baseLang, chromeAvailability, chromeEngine, onlineEngine, type EngineChoice } from '../translateEngines'

/** Languages: interface strings plus a translation for every piece of content the owner has written. */
export function LanguagesPage() {
  const { content, edit, set } = useAdmin()
  const i = content.portfolio.i18n
  const [sel, setSel] = useState(0)
  const [del, setDel] = useState(false)
  const [tab, setTab] = useState<'ui' | 'text'>('text')
  const fields = useMemo(() => translatableFields(content), [content])
  const lang = i.languages[sel]
  const base = `portfolio.i18n.languages.${sel}`
  const [show, setShow] = useState<'blank' | 'auto' | 'all'>('blank')
  const [choice, setChoice] = useState<EngineChoice>('auto')
  const [chrome, setChrome] = useState<string>('checking')
  const [run, setRun] = useState<{ done: number; total: number; note: string } | null>(null)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)
  const [redo, setRedo] = useState(false)
  const stop = useRef<AbortController | null>(null)
  const from = (content.portfolio.site.locale || 'en').split('-')[0].toLowerCase()
  const to = lang?.code ?? ''
  const ready = /^[a-z]{2,3}(-[a-z]{2,4})?$/i.test(to) && baseLang(to) !== baseLang(from)
  useEffect(() => { let live = true; setChrome('checking'); if (!ready) return; void chromeAvailability(from, to).then((a) => live && setChrome(a)); return () => { live = false } }, [from, to, ready])
  const isAuto = (key: string) => !!lang?.auto?.includes(key)
  // Typing in a box means you have looked at it: it is no longer "machine translated, to check".
  // The keys contain dots ("faqs.f1.question"), so they are stored flat on the pack and never as a path.
  const typed = (key: string, value: string) => edit((c) => {
    const l = c.portfolio.i18n.languages[sel]
    if (key.startsWith('ui:')) l.ui[key.slice(3)] = value; else l.text[key.slice(5)] = value
    l.auto = (l.auto ?? []).filter((k) => k !== key)
  })
  // Fixed wording: the named buttons and labels, then the headings, filters and sentences written into the page (keyed by their English text).
  const uiRows = useMemo<[string, string][]>(() => [...(Object.entries(UI_DEFAULTS) as [string, string][]), ...BUILTIN_STRINGS.map((x): [string, string] => [x, x])], [])
  const todo = useMemo(() => (lang ? fields.filter((f) => !(lang.text[f.path] ?? '').trim()) : []), [fields, lang])
  const uiTodo = useMemo(() => (lang ? uiRows.filter(([k]) => !(lang.ui[k] ?? '').trim()) : []), [lang, uiRows])
  const chars = (redo ? fields.reduce((n, f) => n + f.value.length, 0) + uiRows.reduce((n, [, v]) => n + v.length, 0) : todo.reduce((n, f) => n + f.value.length, 0) + uiTodo.reduce((n, [, v]) => n + v.length, 0))
  const chromeOk = chrome === 'available' || chrome === 'downloadable' || chrome === 'downloading'
  const useChrome = choice === 'chrome' || (choice === 'auto' && chromeOk)

  const translateAll = async (replace: boolean) => {
    if (!lang || !ready) return
    setResult(null); setRedo(false)
    const ctl = new AbortController(); stop.current = ctl
    const ui = (replace ? uiRows : uiTodo).map(([k, v]) => ({ path: `ui:${k}`, value: v }))
    const text = (replace ? fields : todo).map((f) => ({ path: `text:${f.path}`, value: f.value }))
    const all = [...ui, ...text]
    if (!all.length) { setResult({ ok: true, text: 'Nothing to translate: every box already has a translation.' }); return }
    let engine: Engine
    try {
      setRun({ done: 0, total: all.length, note: 'Getting the translator ready' })
      // The first use downloads a language file, which can take a while: Stop must work during it.
      const aborted = new Promise<never>((_ok, no) => ctl.signal.addEventListener('abort', () => no(new Error('Stopped.'))))
      engine = useChrome ? await Promise.race([chromeEngine(from, to, (pct) => setRun({ done: 0, total: all.length, note: `Downloading the ${lang.label || to} language file for Chrome, once only: ${pct}%` })), aborted]) : onlineEngine(from, to, content.portfolio.i18n.translateEmail)
    } catch (e) {
      setRun(null); stop.current = null
      setResult(ctl.signal.aborted ? { ok: true, text: 'Stopped before anything was translated.' } : { ok: false, text: `Could not start Chrome's translator (${(e as Error).message}). Choose "The free online service" above and try again.` }); return
    }
    const finish = (r: TranslateReport, stopped: string) => {
      edit((c) => {
        const l = c.portfolio.i18n.languages[sel]
        const auto = new Set(l.auto ?? [])
        for (const [k, v] of Object.entries(r.translated)) {
          if (k.startsWith('ui:')) l.ui[k.slice(3)] = v; else l.text[k.slice(5)] = v
          auto.add(k)
        }
        l.auto = [...auto]
      })
      const n = Object.keys(r.translated).length
      setResult({ ok: !stopped && r.failed.length === 0, text: `${stopped ? `${stopped} ` : ''}Translated ${n} ${n === 1 ? 'entry' : 'entries'} into ${lang.label || to} using ${engine.name}.${r.failed.length ? ` ${r.failed.length} could not be translated and were left in English.` : ''}${r.keptLines ? ` ${r.keptLines} ${r.keptLines === 1 ? 'line was' : 'lines were'} left in English because the translation damaged a link.` : ''} They are marked "machine translated" so you can check them.` })
    }
    try {
      const r = await translateFields(all, engine, { signal: ctl.signal, onProgress: (done, total) => setRun({ done, total, note: `Translating with ${engine.name}` }) })
      finish(r, ctl.signal.aborted ? 'Stopped.' : '')
    } catch (e) {
      const partial = (e as { partial?: TranslateReport }).partial
      if (partial) finish(partial, `${(e as Error).message}`)
      else setResult({ ok: false, text: (e as Error).message })
    }
    setRun(null); stop.current = null
  }

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
                <div className="atrans" role="group" aria-label="Translate automatically">
                  <h3 className="atrans__title">Translate automatically (free)</h3>
                  {!ready ? <p className="ahelp">Enter a language code such as <strong>fr</strong> (different from your site's {from}) to translate automatically.</p> : (
                    <>
                      <p className="ahelp">Translates your whole site from {from} into {lang.label || to}: your writing, the buttons and the labels. It only fills boxes that are still empty, so anything you typed yourself is kept. Machine translation is good but not perfect, so have someone who reads {lang.label || to} check it before you rely on it.</p>
                      <label className="afield"><span className="alabel">Translate with</span>
                        <select value={choice} onChange={(e) => setChoice(e.target.value as EngineChoice)} disabled={!!run}>
                          <option value="auto">Automatic: Chrome on this computer if it can, otherwise the free online service</option>
                          <option value="chrome" disabled={chrome === 'unsupported' || chrome === 'unavailable'}>Chrome on this computer (private, no limit){chrome === 'unsupported' ? ' (not available in this browser)' : chrome === 'unavailable' ? ' (does not support this language)' : ''}</option>
                          <option value="online">The free online service (works in any browser, daily limit)</option>
                        </select>
                      </label>
                      <p className="ahelp">{useChrome ? (chrome === 'downloadable' ? `Chrome will download the ${lang.label || to} language file once (it can take a minute), then translate on this computer. Nothing is sent anywhere.` : 'Chrome translates on this computer. Nothing is sent anywhere and there is no limit.') : `Uses the free MyMemory service. Your site's text is sent to it, and it allows about 5,000 characters a day, or about 50,000 with an email address below. You have about ${chars.toLocaleString()} characters to translate.`}{chrome === 'unsupported' && choice === 'auto' ? ' (Chrome on a computer, version 138 or newer, can translate here with no limit.)' : ''}</p>
                      {!useChrome && <label className="afield"><span className="alabel">Your email address (optional, raises the daily limit)</span><input type="email" value={content.portfolio.i18n.translateEmail} onChange={(e) => set('portfolio.i18n.translateEmail', e.target.value)} autoComplete="email" /></label>}
                      <div className="arow">
                        <button type="button" className="abtn abtn--primary" disabled={!!run} onClick={() => void translateAll(false)}>Translate everything still empty ({todo.length + uiTodo.length})</button>
                        <button type="button" className="abtn" disabled={!!run} onClick={() => setRedo(true)}>Translate again and replace everything</button>
                        {run && <button type="button" className="abtn abtn--danger" onClick={() => stop.current?.abort()}>Stop</button>}
                      </div>
                      {run && <div role="status" className="atrans__run"><progress max={run.total} value={run.done} aria-label="Translation progress" /><span className="ahelp">{run.note}. {run.done} of {run.total}.</span></div>}
                      {result && <p role={result.ok ? 'status' : 'alert'} className={result.ok ? 'ahelp' : 'aerror'}>{result.text}</p>}
                    </>
                  )}
                </div>
                <div className="achips" role="tablist">
                  <button role="tab" aria-selected={tab === 'text'} type="button" className={`achip ${tab === 'text' ? 'is-on' : ''}`} onClick={() => setTab('text')}>Your content</button>
                  <button role="tab" aria-selected={tab === 'ui'} type="button" className={`achip ${tab === 'ui' ? 'is-on' : ''}`} onClick={() => setTab('ui')}>Buttons and labels</button>
                </div>
                {tab === 'ui' ? (
                  <>
                  <p className="ahelp">The first rows are named buttons. The rest is wording built into the page (headings, filters, form labels, sentences), listed by its English text.</p>
                  <div className="atable-wrap"><table className="atable atable--stack"><thead><tr><th>English</th><th>{lang.label || lang.code}</th></tr></thead><tbody>
                    {uiRows.map(([k, en]) => (
                      <tr key={k}><td>{en}</td><td><input aria-label={`${lang.label} for "${en}"`} value={lang.ui[k] ?? ''} onChange={(e) => typed(`ui:${k}`, e.target.value)} />{isAuto(`ui:${k}`) && <span className="atrans__badge">machine translated</span>}</td></tr>
                    ))}
                  </tbody></table></div>
                  </>
                ) : (
                  <>
                    <label className="afield"><span className="alabel">Show</span>
                      <select value={show} onChange={(e) => setShow(e.target.value as 'blank' | 'auto' | 'all')}>
                        <option value="blank">Only boxes still to translate ({todo.length})</option>
                        <option value="auto">Only machine translated, to check ({(lang.auto ?? []).filter((k) => k.startsWith('text:')).length})</option>
                        <option value="all">Everything ({fields.length})</option>
                      </select>
                    </label>
                    <div className="atable-wrap"><table className="atable atable--stack"><thead><tr><th>Original</th><th>{lang.label || lang.code}</th></tr></thead><tbody>
                      {fields.filter((f) => show === 'all' || (show === 'blank' ? !(lang.text[f.path] ?? '').trim() : isAuto(`text:${f.path}`))).slice(0, 400).map((f) => (
                        <tr key={f.path}><td><span className="ahelp">{f.label}</span><br />{f.value.length > 160 ? `${f.value.slice(0, 160)}...` : f.value}</td>
                          <td>{f.value.length > 80 || f.value.includes("\n") ? <textarea rows={3} aria-label={`${lang.label} for ${f.label}`} value={lang.text[f.path] ?? ''} onChange={(e) => typed(`text:${f.path}`, e.target.value)} /> : <input aria-label={`${lang.label} for ${f.label}`} value={lang.text[f.path] ?? ''} onChange={(e) => typed(`text:${f.path}`, e.target.value)} />}{isAuto(`text:${f.path}`) && <span className="atrans__badge">machine translated</span>}</td></tr>
                      ))}
                    </tbody></table></div>
                  </>
                )}
                <button type="button" className="abtn abtn--danger" onClick={() => setDel(true)}><Trash2 size={14} aria-hidden /> Delete this language</button>
              </div>
            )}
          </>
        )}
      </Card>
      <Confirm open={redo} title="Translate everything again?" body={`This replaces every ${lang?.label || to} translation with a fresh machine translation, including ones you typed or corrected yourself. Use "Translate everything still empty" if you want to keep your own wording.`} confirmLabel="Replace everything" onCancel={() => setRedo(false)} onConfirm={() => void translateAll(true)} />
      <Confirm open={del} title="Delete this language?" body="Its translations are removed." onCancel={() => setDel(false)} onConfirm={() => { edit((c) => { c.portfolio.i18n.languages.splice(sel, 1) }); setSel(0); setDel(false) }} />
    </>
  )
}
