import { useId, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ChevronDown, Copy, ImagePlus, Plus, Trash2, X } from 'lucide-react'
import type { ImageRef, SiteContent } from '../content/types'
import { ICON_NAMES } from '../components/ui/iconMap'
import { TONE_NAMES } from '../utils/theme'
import { getIn, moveItem } from './paths'
import { useAdmin } from './store'
import { useMediaPicker, type Accept } from './media'
import { BlockListEditor } from './blocks'

export type Opt = string | { value: string; label: string }
type Pred = (obj: any, root: SiteContent) => boolean // eslint-disable-line @typescript-eslint/no-explicit-any
export type RefSource = 'projects' | 'services' | 'tools' | 'aiSkills' | 'results' | 'contentItems' | 'screenshots'

interface Base { label: string; help?: string; showIf?: Pred }
export type Field =
  | (Base & { kind: 'text' | 'url' | 'email' | 'tel' | 'date'; key: string; placeholder?: string; maxLength?: number })
  | (Base & { kind: 'number'; key: string; min?: number; max?: number; step?: number; nullable?: boolean })
  | (Base & { kind: 'textarea' | 'rich'; key: string; rows?: number; placeholder?: string })
  | (Base & { kind: 'range'; key: string; min: number; max: number; step?: number; unit?: string })
  | (Base & { kind: 'bool'; key: string })
  | (Base & { kind: 'select'; key: string; options: Opt[] | ((root: SiteContent) => Opt[]); custom?: boolean })
  | (Base & { kind: 'multi'; key: string; options: Opt[]; custom?: boolean })
  | (Base & { kind: 'strings'; key: string; placeholder?: string; multiline?: boolean })
  | (Base & { kind: 'image'; key: string })
  | (Base & { kind: 'images'; key: string })
  | (Base & { kind: 'file'; key: string; accept: Accept })
  | (Base & { kind: 'tone'; key: string })
  | (Base & { kind: 'icon'; key: string })
  | (Base & { kind: 'group'; key?: string; fields: Field[]; open?: boolean })
  | (Base & { kind: 'list'; key: string; fields: Field[]; make: () => unknown; item: (it: any, i: number) => string; addLabel?: string }) // eslint-disable-line @typescript-eslint/no-explicit-any
  | (Base & { kind: 'refs'; key: string; from: RefSource })
  | (Base & { kind: 'ref'; key: string; from: RefSource })
  | (Base & { kind: 'blocks'; key: string })

const optOf = (o: Opt) => (typeof o === 'string' ? { value: o, label: o } : o)

function Shell({ label, help, children, htmlFor }: { label: string; help?: string; children: ReactNode; htmlFor?: string }) {
  const hid = useId()
  return (
    <div className="afield" role="group" aria-labelledby={htmlFor ? undefined : `${hid}-l`} aria-describedby={help ? `${hid}-h` : undefined}>
      {htmlFor ? <label htmlFor={htmlFor}>{label}</label> : <span id={`${hid}-l`} className="afield__label">{label}</span>}
      {children}
      {help && <span id={`${hid}-h`} className="ahelp">{help}</span>}
    </div>
  )
}

export function Fields({ fields, base }: { fields: Field[]; base: string }) {
  const { content } = useAdmin()
  const obj = getIn(content, base)
  return (
    <>
      {fields.map((f, i) => {
        if (f.showIf && !f.showIf(obj, content)) return null
        return <FieldView key={('key' in f && f.key) || `${f.label}-${i}`} f={f} base={base} />
      })}
    </>
  )
}

function useValue(base: string, key: string | undefined) {
  const { content, set } = useAdmin()
  const path = key ? (base ? `${base}.${key}` : key) : base
  return { value: getIn(content, path), path, set, content }
}

function FieldView({ f, base }: { f: Field; base: string }) {
  switch (f.kind) {
    case 'text': case 'url': case 'email': case 'tel': case 'date': return <TextField f={f} base={base} />
    case 'number': return <NumberField f={f} base={base} />
    case 'textarea': case 'rich': return <AreaField f={f} base={base} />
    case 'bool': return <BoolField f={f} base={base} />
    case 'select': return <SelectField f={f} base={base} />
    case 'multi': return <MultiField f={f} base={base} />
    case 'strings': return <StringsField f={f} base={base} />
    case 'image': return <ImageField f={f} base={base} />
    case 'images': return <ImagesField f={f} base={base} />
    case 'file': return <FileField f={f} base={base} />
    case 'tone': return <ToneField f={f} base={base} />
    case 'icon': return <IconField f={f} base={base} />
    case 'group': return <GroupField f={f} base={base} />
    case 'list': return <ListField f={f} base={base} />
    case 'refs': case 'ref': return <RefField f={f} base={base} />
    case 'range': return <RangeField f={f} base={base} />
    case 'blocks': return <BlocksField f={f} base={base} />
  }
}

function TextField({ f, base }: { f: Extract<Field, { kind: 'text' | 'url' | 'email' | 'tel' | 'date' }>; base: string }) {
  const { value, path, set } = useValue(base, f.key)
  const id = useId()
  return (
    <Shell label={f.label} help={f.help} htmlFor={id}>
      <input id={id} type={f.kind === 'text' ? 'text' : f.kind} value={(value as string) ?? ''} placeholder={f.placeholder} maxLength={f.maxLength} onChange={(e) => set(path, e.target.value)} autoComplete="off" />
    </Shell>
  )
}

function NumberField({ f, base }: { f: Extract<Field, { kind: 'number' }>; base: string }) {
  const { value, path, set } = useValue(base, f.key)
  const id = useId()
  return (
    <Shell label={f.label} help={f.help} htmlFor={id}>
      <input id={id} type="number" inputMode="decimal" min={f.min} max={f.max} step={f.step ?? 'any'} value={typeof value === 'number' ? value : ''} onChange={(e) => set(path, e.target.value === '' ? (f.nullable === false ? 0 : null) : Number(e.target.value))} />
    </Shell>
  )
}

function RangeField({ f, base }: { f: Extract<Field, { kind: 'range' }>; base: string }) {
  const { value, path, set } = useValue(base, f.key)
  const id = useId()
  const n = typeof value === 'number' ? value : f.min
  return (
    <Shell label={f.label} help={f.help} htmlFor={id}>
      <div className="arow">
        <input id={id} type="range" min={f.min} max={f.max} step={f.step ?? 1} value={n} onChange={(e) => set(path, Number(e.target.value))} />
        <output htmlFor={id} className="arange">{n}{f.unit ?? ''}</output>
      </div>
    </Shell>
  )
}

function AreaField({ f, base }: { f: Extract<Field, { kind: 'textarea' | 'rich' }>; base: string }) {
  const { value, path, set } = useValue(base, f.key)
  const id = useId()
  const help = f.kind === 'rich' ? `${f.help ? f.help + ' ' : ''}Formatting: blank line for a new paragraph, "- " for bullets, **bold**, *italic*, [label](https://link).` : f.help
  return (
    <Shell label={f.label} help={help} htmlFor={id}>
      <textarea id={id} rows={f.rows ?? (f.kind === 'rich' ? 6 : 3)} value={(value as string) ?? ''} placeholder={f.placeholder} onChange={(e) => set(path, e.target.value)} />
    </Shell>
  )
}

function BoolField({ f, base }: { f: Extract<Field, { kind: 'bool' }>; base: string }) {
  const { value, path, set } = useValue(base, f.key)
  const id = useId()
  return (
    <div className="afield afield--check">
      <label className="acheck" htmlFor={id}>
        <input id={id} type="checkbox" checked={!!value} onChange={(e) => set(path, e.target.checked)} /> <span>{f.label}</span>
      </label>
      {f.help && <span className="ahelp">{f.help}</span>}
    </div>
  )
}

function SelectField({ f, base }: { f: Extract<Field, { kind: 'select' }>; base: string }) {
  const { value, path, set, content } = useValue(base, f.key)
  const id = useId()
  const opts = (typeof f.options === 'function' ? f.options(content) : f.options).map(optOf)
  const current = (value as string) ?? ''
  const known = opts.some((o) => o.value === current)
  return (
    <Shell label={f.label} help={f.help} htmlFor={id}>
      <select id={id} value={current} onChange={(e) => set(path, e.target.value)}>
        {!known && current && <option value={current}>{current}</option>}
        {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {f.custom && <CustomAdd label={`Add your own ${f.label.toLowerCase()}`} onAdd={(v) => set(path, v)} />}
    </Shell>
  )
}

function CustomAdd({ label, onAdd }: { label: string; onAdd: (v: string) => void }) {
  const [v, setV] = useState('')
  return (
    <div className="arow">
      <input aria-label={label} placeholder={label} value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (v.trim()) { onAdd(v.trim()); setV('') } } }} />
      <button type="button" className="abtn" disabled={!v.trim()} onClick={() => { onAdd(v.trim()); setV('') }}>Add</button>
    </div>
  )
}

function MultiField({ f, base }: { f: Extract<Field, { kind: 'multi' }>; base: string }) {
  const { value, path, set } = useValue(base, f.key)
  const list = (Array.isArray(value) ? value : []) as string[]
  const opts = f.options.map(optOf)
  const extras = list.filter((v) => !opts.some((o) => o.value === v))
  const toggle = (v: string) => set(path, list.includes(v) ? list.filter((x) => x !== v) : [...list, v])
  return (
    <Shell label={f.label} help={f.help}>
      <div className="achips">
        {[...opts, ...extras.map((v) => ({ value: v, label: v }))].map((o) => (
          <label key={o.value} className={`achip ${list.includes(o.value) ? 'is-on' : ''}`}>
            <input type="checkbox" checked={list.includes(o.value)} onChange={() => toggle(o.value)} /> {o.label}
          </label>
        ))}
      </div>
      {f.custom && <CustomAdd label="Add another" onAdd={(v) => !list.includes(v) && set(path, [...list, v])} />}
    </Shell>
  )
}

function StringsField({ f, base }: { f: Extract<Field, { kind: 'strings' }>; base: string }) {
  const { value, path, set } = useValue(base, f.key)
  const list = (Array.isArray(value) ? value : []) as string[]
  return (
    <Shell label={f.label} help={f.help}>
      <ul className="astrings">
        {list.map((s, i) => (
          <li key={i} className="arow">
            {f.multiline ? <textarea rows={2} aria-label={`${f.label} ${i + 1}`} value={s} onChange={(e) => set(`${path}.${i}`, e.target.value)} /> : <input aria-label={`${f.label} ${i + 1}`} value={s} placeholder={f.placeholder} onChange={(e) => set(`${path}.${i}`, e.target.value)} />}
            <IconBtn label={`Move ${f.label} ${i + 1} up`} disabled={i === 0} onClick={() => set(path, moveItem(list, i, i - 1))}><ArrowUp size={16} /></IconBtn>
            <IconBtn label={`Move ${f.label} ${i + 1} down`} disabled={i === list.length - 1} onClick={() => set(path, moveItem(list, i, i + 1))}><ArrowDown size={16} /></IconBtn>
            <IconBtn label={`Remove ${f.label} ${i + 1}`} onClick={() => set(path, list.filter((_, j) => j !== i))}><X size={16} /></IconBtn>
          </li>
        ))}
      </ul>
      <button type="button" className="abtn" onClick={() => set(path, [...list, ''])}><Plus size={14} aria-hidden /> Add</button>
    </Shell>
  )
}

export function IconBtn({ label, onClick, disabled, children, danger }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode; danger?: boolean }) {
  return <button type="button" className={`aicon ${danger ? 'aicon--danger' : ''}`} aria-label={label} title={label} disabled={disabled} onClick={onClick}>{children}</button>
}

function ImageField({ f, base }: { f: Extract<Field, { kind: 'image' }>; base: string }) {
  const { value, path, set } = useValue(base, f.key)
  const { pick } = useMediaPicker()
  const img = value as ImageRef | null | undefined
  const choose = async () => {
    const [a] = await pick({ accept: 'image' })
    if (a) set(path, { src: a.url, alt: a.alt || img?.alt || '', width: a.width, height: a.height })
  }
  return (
    <Shell label={f.label} help={f.help}>
      {img?.src ? (
        <div className="aimage">
          <img src={img.src} alt={img.alt} />
          <div className="aimage__body">
            <label className="afield"><span>Alt text (describe the image)</span><input value={img.alt ?? ''} onChange={(e) => set(`${path}.alt`, e.target.value)} /></label>
            <div className="arow">
              <button type="button" className="abtn" onClick={() => void choose()}>Replace</button>
              <button type="button" className="abtn abtn--danger" onClick={() => set(path, null)}>Remove</button>
            </div>
          </div>
        </div>
      ) : (
        <button type="button" className="abtn" onClick={() => void choose()}><ImagePlus size={16} aria-hidden /> Choose or upload an image</button>
      )}
    </Shell>
  )
}

function ImagesField({ f, base }: { f: Extract<Field, { kind: 'images' }>; base: string }) {
  const { value, path, set } = useValue(base, f.key)
  const { pick } = useMediaPicker()
  const list = (Array.isArray(value) ? value : []) as ImageRef[]
  const add = async () => {
    const picked = await pick({ accept: 'image', multiple: true })
    if (picked.length) set(path, [...list, ...picked.map((a) => ({ src: a.url, alt: a.alt || '', width: a.width, height: a.height }))])
  }
  return (
    <Shell label={f.label} help={f.help}>
      <ul className="aimages">
        {list.map((im, i) => (
          <li key={im.src + i}>
            <img src={im.src} alt={im.alt} />
            <input aria-label={`Alt text for image ${i + 1}`} placeholder="Alt text" value={im.alt} onChange={(e) => set(`${path}.${i}.alt`, e.target.value)} />
            <div className="arow">
              <IconBtn label={`Move image ${i + 1} earlier`} disabled={i === 0} onClick={() => set(path, moveItem(list, i, i - 1))}><ArrowUp size={14} /></IconBtn>
              <IconBtn label={`Move image ${i + 1} later`} disabled={i === list.length - 1} onClick={() => set(path, moveItem(list, i, i + 1))}><ArrowDown size={14} /></IconBtn>
              <IconBtn label={`Remove image ${i + 1}`} onClick={() => set(path, list.filter((_, j) => j !== i))}><Trash2 size={14} /></IconBtn>
            </div>
          </li>
        ))}
      </ul>
      <button type="button" className="abtn" onClick={() => void add()}><ImagePlus size={16} aria-hidden /> Add images</button>
    </Shell>
  )
}

function FileField({ f, base }: { f: Extract<Field, { kind: 'file' }>; base: string }) {
  const { value, path, set } = useValue(base, f.key)
  const { pick } = useMediaPicker()
  const id = useId()
  const noun = f.accept === 'any' ? 'file' : f.accept
  return (
    <Shell label={f.label} help={f.help} htmlFor={id}>
      <div className="arow">
        <input id={id} value={(value as string) ?? ''} placeholder={`Choose a ${noun}, or paste a link`} onChange={(e) => set(path, e.target.value)} />
        <button type="button" className="abtn" onClick={async () => { const [a] = await pick({ accept: f.accept }); if (a) set(path, a.url) }}>Choose</button>
        {!!value && <button type="button" className="abtn" onClick={() => set(path, '')}>Clear</button>}
      </div>
    </Shell>
  )
}

export const TONE_OPTIONS: Opt[] = [{ value: '', label: 'Season default' }, ...TONE_NAMES.filter((t) => !['ink', 'stone', 'green', 'red'].includes(t)).map((t) => ({ value: t, label: t[0].toUpperCase() + t.slice(1) }))]

function ToneField({ f, base }: { f: Extract<Field, { kind: 'tone' }>; base: string }) {
  const { value, path, set } = useValue(base, f.key)
  const id = useId()
  const v = (value as string) ?? ''
  const isHex = /^#/.test(v)
  return (
    <Shell label={f.label} help={f.help} htmlFor={id}>
      <div className="arow">
        <select id={id} value={isHex ? '__custom' : v} onChange={(e) => set(path, e.target.value === '__custom' ? '#cccccc' : e.target.value)}>
          {TONE_OPTIONS.map((o) => { const x = optOf(o); return <option key={x.value} value={x.value}>{x.label}</option> })}
          <option value="__custom">Custom colour</option>
        </select>
        {isHex && <input type="color" aria-label={`${f.label} custom colour`} value={v} onChange={(e) => set(path, e.target.value)} />}
        {v && !isHex && <span className="aswatch" style={{ background: `var(--c-${v})` }} aria-hidden />}
      </div>
    </Shell>
  )
}

function IconField({ f, base }: { f: Extract<Field, { kind: 'icon' }>; base: string }) {
  const { value, path, set } = useValue(base, f.key)
  const id = useId()
  return (
    <Shell label={f.label} help={f.help} htmlFor={id}>
      <select id={id} value={(value as string) ?? 'Sparkles'} onChange={(e) => set(path, e.target.value)}>
        {ICON_NAMES.map((n) => <option key={n}>{n}</option>)}
      </select>
    </Shell>
  )
}

function GroupField({ f, base }: { f: Extract<Field, { kind: 'group' }>; base: string }) {
  const path = f.key ? `${base}.${f.key}` : base
  return (
    <details className="agroup" open={f.open !== false}>
      <summary><span>{f.label}</span><ChevronDown size={16} aria-hidden /></summary>
      {f.help && <p className="ahelp">{f.help}</p>}
      <div className="agroup__body"><Fields fields={f.fields} base={path} /></div>
    </details>
  )
}

function ListField({ f, base }: { f: Extract<Field, { kind: 'list' }>; base: string }) {
  const { value, path, set } = useValue(base, f.key)
  const list = (Array.isArray(value) ? value : []) as unknown[]
  const [open, setOpen] = useState<number | null>(null)
  const [drag, setDrag] = useState<number | null>(null)
  return (
    <Shell label={f.label} help={f.help}>
      <ol className="alist">
        {list.map((it, i) => (
          <li key={i} className={`alist__item ${drag === i ? 'is-drag' : ''}`} draggable={open !== i}
            onDragStart={() => setDrag(i)} onDragEnd={() => setDrag(null)} onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (drag !== null) set(path, moveItem(list, drag, i)); setDrag(null) }}>
            <div className="alist__head">
              <button type="button" className="alist__title" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
                <ChevronDown size={16} aria-hidden className={open === i ? 'is-open' : ''} /> {f.item(it, i) || `${f.label} ${i + 1}`}
              </button>
              <IconBtn label="Move up" disabled={i === 0} onClick={() => set(path, moveItem(list, i, i - 1))}><ArrowUp size={16} /></IconBtn>
              <IconBtn label="Move down" disabled={i === list.length - 1} onClick={() => set(path, moveItem(list, i, i + 1))}><ArrowDown size={16} /></IconBtn>
              <IconBtn label="Duplicate" onClick={() => set(path, [...list.slice(0, i + 1), structuredClone(it), ...list.slice(i + 1)])}><Copy size={16} /></IconBtn>
              <IconBtn label="Remove" danger onClick={() => { set(path, list.filter((_, j) => j !== i)); setOpen(null) }}><Trash2 size={16} /></IconBtn>
            </div>
            {open === i && <div className="alist__body"><Fields fields={f.fields} base={`${path}.${i}`} /></div>}
          </li>
        ))}
      </ol>
      <button type="button" className="abtn" onClick={() => { set(path, [...list, f.make()]); setOpen(list.length) }}><Plus size={14} aria-hidden /> {f.addLabel ?? 'Add'}</button>
    </Shell>
  )
}

const REF_LABEL: Record<RefSource, (x: any) => string> = { // eslint-disable-line @typescript-eslint/no-explicit-any
  projects: (x) => x.title || x.id, services: (x) => x.name || x.id, tools: (x) => x.name || x.id, aiSkills: (x) => x.name || x.id,
  results: (x) => x.metric || x.id, contentItems: (x) => x.title || x.id, screenshots: (x) => x.caption || x.image?.alt || x.id,
}

function RefField({ f, base }: { f: Extract<Field, { kind: 'refs' | 'ref' }>; base: string }) {
  const { value, path, set, content } = useValue(base, f.key)
  const items = ((content as unknown as Record<string, unknown[]>)[f.from] ?? []) as { id: string }[]
  const id = useId()
  if (f.kind === 'ref') {
    return (
      <Shell label={f.label} help={f.help} htmlFor={id}>
        <select id={id} value={(value as string) ?? ''} onChange={(e) => set(path, e.target.value)}>
          <option value="">None</option>
          {items.map((x) => <option key={x.id} value={x.id}>{REF_LABEL[f.from](x)}</option>)}
        </select>
      </Shell>
    )
  }
  const list = (Array.isArray(value) ? value : []) as string[]
  return (
    <Shell label={f.label} help={items.length ? f.help : `${f.help ?? ''} Nothing to link yet.`.trim()}>
      <div className="achips">
        {items.map((x) => (
          <label key={x.id} className={`achip ${list.includes(x.id) ? 'is-on' : ''}`}>
            <input type="checkbox" checked={list.includes(x.id)} onChange={() => set(path, list.includes(x.id) ? list.filter((v) => v !== x.id) : [...list, x.id])} /> {REF_LABEL[f.from](x)}
          </label>
        ))}
      </div>
    </Shell>
  )
}

function BlocksField({ f, base }: { f: Extract<Field, { kind: 'blocks' }>; base: string }) {
  const { path } = useValue(base, f.key)
  return <Shell label={f.label} help={f.help}><BlockListEditor path={path} /></Shell>
}
