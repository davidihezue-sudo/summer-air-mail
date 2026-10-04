import { useEffect, useMemo, useState } from 'react'
import { useAdmin } from '../store'
import { api } from '../api'
import { Card, PageHead } from '../ui'

interface Hit { path: string; src: string; owner: string }

/** Walks the draft for images (anything with a src and an alt) that have no alt text. */
function findMissing(root: unknown): Hit[] {
  const hits: Hit[] = []
  const walk = (v: unknown, path: string, owner: string) => {
    if (Array.isArray(v)) { v.forEach((x, i) => walk(x, `${path}.${i}`, owner)); return }
    if (!v || typeof v !== 'object') return
    const o = v as Record<string, unknown>
    const name = (typeof o.title === 'string' && o.title) || (typeof o.name === 'string' && o.name) || (typeof o.metric === 'string' && o.metric) || owner
    if (typeof o.src === 'string' && o.src && /\.(webp|jpe?g|png|gif)(\?|$)/i.test(o.src) && 'alt' in o && !String(o.alt ?? '').trim()) hits.push({ path: `${path}.alt`, src: o.src, owner: name })
    for (const [k, x] of Object.entries(o)) if (typeof x === 'object') walk(x, path ? `${path}.${k}` : k, name)
  }
  walk(root, '', '')
  return hits
}

const suggest = (h: Hit) => (h.owner ? `Image from ${h.owner}` : '')

/** Helps write alt text. It suggests a starting point from where the image is used; a person must describe what is actually shown. */
export function AltTextPage() {
  const { content, set, media, refreshMedia, setMedia } = useAdmin()
  const hits = useMemo(() => findMissing(content), [content])
  const lib = media.filter((m) => m.type === 'image' && !m.alt.trim())
  const [draft, setDraft] = useState<Record<string, string>>({})
  useEffect(() => { void refreshMedia() }, [refreshMedia])

  return (
    <>
      <PageHead title="Alt Text Assistant" intro="Alt text lets people who use screen readers know what an image shows, and helps search. Describe what is actually in the picture. The suggestion below only says where the image is used, so edit it." />
      <Card title={`In your content (${hits.length} missing)`}>
        {hits.length === 0 && <p className="ahelp">Every image in your content has alt text.</p>}
        <ul className="arows">
          {hits.map((h) => (
            <li key={h.path} className="arow-item arow-item--block">
              <img src={h.src} alt="" className="aalt__img" loading="lazy" />
              <div className="aalt__form">
                <span className="ahelp">{h.owner || 'Image'}</span>
                <input aria-label={`Alt text for ${h.owner || 'image'}`} placeholder={suggest(h)} value={draft[h.path] ?? ''} onChange={(e) => setDraft((d) => ({ ...d, [h.path]: e.target.value }))} />
                <span className="arow">
                  <button type="button" className="abtn" onClick={() => setDraft((d) => ({ ...d, [h.path]: suggest(h) }))}>Use suggestion</button>
                  <button type="button" className="abtn abtn--primary" disabled={!(draft[h.path] ?? '').trim()} onClick={() => set(h.path, draft[h.path].trim())}>Save</button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </Card>
      <Card title={`In the media library (${lib.length} missing)`}>
        {lib.length === 0 && <p className="ahelp">Every library image has alt text.</p>}
        <ul className="arows">
          {lib.map((m) => (
            <li key={m.id} className="arow-item arow-item--block">
              <img src={m.url} alt="" className="aalt__img" loading="lazy" />
              <div className="aalt__form">
                <span className="ahelp">{m.filename}</span>
                <input aria-label={`Alt text for ${m.filename}`} value={draft[m.id] ?? ''} onChange={(e) => setDraft((d) => ({ ...d, [m.id]: e.target.value }))} />
                <button type="button" className="abtn abtn--primary" disabled={!(draft[m.id] ?? '').trim()} onClick={async () => { const r = await api.updateMedia(m.id, { alt: draft[m.id].trim() }); setMedia((l) => l.map((x) => (x.id === m.id ? r.asset : x))) }}>Save</button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </>
  )
}
