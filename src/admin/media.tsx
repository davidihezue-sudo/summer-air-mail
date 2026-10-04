import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Copy, EyeOff, FileText, Film, Trash2, Upload } from 'lucide-react'
import type { MediaAsset } from '../content/types'
import { Modal } from '../components/ui/Modal'
import { api, ApiError } from './api'
import { useAdmin } from './store'
import { Confirm } from './ui'
import { RedactTool } from './RedactTool'

export type Accept = 'image' | 'video' | 'pdf' | 'any'
const matches = (a: MediaAsset, accept: Accept) => accept === 'any' || a.type === accept
const fmtSize = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)

interface PickOptions { accept?: Accept; multiple?: boolean }
interface PickerApi { pick: (o?: PickOptions) => Promise<MediaAsset[]> }
const PickerCtx = createContext<PickerApi>({ pick: async () => [] })
export const useMediaPicker = () => useContext(PickerCtx)

export function MediaPickerProvider({ children }: { children: ReactNode }) {
  const [req, setReq] = useState<{ opts: PickOptions; resolve: (a: MediaAsset[]) => void } | null>(null)
  const pick = useCallback((opts: PickOptions = {}) => new Promise<MediaAsset[]>((resolve) => setReq({ opts, resolve })), [])
  const close = (result: MediaAsset[]) => { req?.resolve(result); setReq(null) }
  return (
    <PickerCtx.Provider value={{ pick }}>
      {children}
      <Modal open={!!req} onClose={() => close([])} label="Choose from the media library" className="dialog dialog--wide adialog adialog--picker">
        {req && (
          <div className="apicker">
            <h2 className="adialog__title">Media library</h2>
            <MediaLibrary accept={req.opts.accept ?? 'any'} multiple={req.opts.multiple} onChoose={close} />
          </div>
        )}
      </Modal>
    </PickerCtx.Provider>
  )
}

/** Library grid used both as the Media Library page and inside the picker. */
export function MediaLibrary({ accept = 'any', multiple, onChoose }: { accept?: Accept; multiple?: boolean; onChoose?: (a: MediaAsset[]) => void }) {
  const { media, setMedia, refreshMedia } = useAdmin()
  const [q, setQ] = useState('')
  const [type, setType] = useState<Accept>(accept)
  const [selected, setSelected] = useState<string[]>([])
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [detail, setDetail] = useState<MediaAsset | null>(null)
  const [redact, setRedact] = useState<{ src: string; name: string; resolve: (b: Blob | null) => void } | null>(null)
  const [review, setReview] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState<MediaAsset | null>(null)
  const input = useRef<HTMLInputElement>(null)

  const list = useMemo(() => media.filter((a) => matches(a, type) && (!q || [a.filename, a.alt, a.caption, ...a.tags].join(' ').toLowerCase().includes(q.toLowerCase()))), [media, type, q])

  const uploadFiles = async (files: FileList | File[]) => {
    setError('')
    for (const file of Array.from(files)) {
      try {
        let blob: Blob = file
        let name = file.name
        if (review && file.type.startsWith('image/') && file.type !== 'image/gif') {
          const url = URL.createObjectURL(file)
          const result = await new Promise<Blob | null>((resolve) => setRedact({ src: url, name: file.name, resolve }))
          URL.revokeObjectURL(url)
          setRedact(null)
          if (result === null) continue // cancelled
          blob = result
          name = file.name.replace(/\.[a-z0-9]+$/i, '') + '.png'
        }
        setBusy(`Uploading ${name}`)
        const { asset, note } = await api.upload(blob, name, '', setBusy)
        setMedia((m) => [asset, ...m])
        if (asset.type === 'video') { void refreshMedia(); if (note) setError(`${file.name}: ${note}`) }
      } catch (e) {
        setError(`${file.name}: ${(e as ApiError).message}`)
      }
    }
    setBusy('')
  }

  const hideParts = async (a: MediaAsset) => {
    const blob = await new Promise<Blob | null>((resolve) => setRedact({ src: a.url, name: a.filename, resolve }))
    setRedact(null)
    if (!blob) return
    try {
      setBusy('Saving the edited copy')
      const { asset } = await api.upload(blob, a.filename.replace(/\.[a-z0-9]+$/i, '') + '-redacted.png', a.alt)
      setMedia((m) => [asset, ...m])
      setDetail(asset)
    } catch (e) { setError((e as Error).message) }
    setBusy('')
  }

  const toggle = (a: MediaAsset) => {
    if (!onChoose) return setDetail(a)
    if (!multiple) return onChoose([a])
    setSelected((s) => (s.includes(a.id) ? s.filter((x) => x !== a.id) : [...s, a.id]))
  }

  return (
    <div className="amedia">
      <div className="amedia__bar">
        <input type="search" aria-label="Search media" placeholder="Search by name, description or tag" value={q} onChange={(e) => setQ(e.target.value)} />
        <select aria-label="File type" value={type} onChange={(e) => setType(e.target.value as Accept)} disabled={accept !== 'any'}>
          <option value="any">All files</option><option value="image">Images</option><option value="video">Videos</option><option value="pdf">PDFs</option>
        </select>
        <button type="button" className="abtn abtn--primary" onClick={() => input.current?.click()}><Upload size={16} aria-hidden /> Upload</button>
        <input ref={input} type="file" hidden multiple accept={accept === 'image' ? 'image/*' : accept === 'video' ? 'video/*' : accept === 'pdf' ? 'application/pdf' : 'image/*,video/*,application/pdf'} onChange={(e) => { if (e.target.files) void uploadFiles(e.target.files); e.target.value = '' }} />
      </div>
      <label className="acheck"><input type="checkbox" checked={review} onChange={(e) => setReview(e.target.checked)} /> Review images for sensitive information before uploading (blur or cover names, numbers and faces)</label>
      <div
        className="adrop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) void uploadFiles(e.dataTransfer.files) }}
      >
        Drop files here. Photos are resized, converted to WebP and stripped of location data. Large videos (MP4, MOV, WebM, MKV, AVI, up to 2 GB) are shrunk automatically to a web friendly 1080p MP4 and given a cover image. PDFs are stored as they are.
      </div>
      {busy && <p role="status" className="ahelp">{busy}</p>}
      {error && <p role="alert" className="aerror">{error}</p>}
      {list.length === 0 ? <p className="ahelp">No files yet.</p> : (
        <ul className="amedia__grid">
          {list.map((a) => (
            <li key={a.id}>
              <button type="button" className={`amedia__item ${selected.includes(a.id) || detail?.id === a.id ? 'is-selected' : ''}`} onClick={() => toggle(a)} aria-pressed={selected.includes(a.id)} aria-label={`${a.filename}${a.alt ? `: ${a.alt}` : ''}`}>
                {a.type === 'image' || a.poster ? <img src={a.type === 'image' ? a.url : a.poster} alt="" loading="lazy" /> : <span className="amedia__icon">{a.type === 'video' ? <Film size={32} aria-hidden /> : <FileText size={32} aria-hidden />}</span>}
                <span className="amedia__name">{a.filename}</span>
                <span className="amedia__meta">{a.type} · {fmtSize(a.size)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {onChoose && multiple && <div className="adialog__actions"><button type="button" className="abtn abtn--primary" disabled={!selected.length} onClick={() => onChoose(media.filter((a) => selected.includes(a.id)))}>Use {selected.length || ''} selected</button></div>}

      {detail && (
        <Detail
          asset={detail}
          onClose={() => setDetail(null)}
          onUse={onChoose ? () => onChoose([detail]) : undefined}
          onRedact={() => void hideParts(detail)}
          onDelete={() => setConfirmDelete(detail)}
          onSaved={(a) => { setMedia((m) => m.map((x) => (x.id === a.id ? a : x))); setDetail(a) }}
        />
      )}
      {redact && <RedactTool src={redact.src} name={redact.name} onDone={(b) => redact.resolve(b)} />}
      <Confirm
        open={!!confirmDelete} title="Delete this file?" body="It will be removed from the library and from the server. Files used by saved content cannot be deleted."
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (!confirmDelete) return
          try { await api.deleteMedia(confirmDelete.id); setMedia((m) => m.filter((x) => x.id !== confirmDelete.id)); setDetail(null); setError('') } catch (e) { setError((e as Error).message); void refreshMedia() }
          setConfirmDelete(null)
        }}
      />
    </div>
  )
}

function Detail({ asset, onClose, onUse, onRedact, onDelete, onSaved }: { asset: MediaAsset; onClose: () => void; onUse?: () => void; onRedact: () => void; onDelete: () => void; onSaved: (a: MediaAsset) => void }) {
  const { content } = useAdmin()
  const [alt, setAlt] = useState(asset.alt)
  const [caption, setCaption] = useState(asset.caption)
  const [tags, setTags] = useState(asset.tags.join(', '))
  const [projectIds, setProjectIds] = useState(asset.projectIds)
  const [msg, setMsg] = useState('')
  useEffect(() => { setAlt(asset.alt); setCaption(asset.caption); setTags(asset.tags.join(', ')); setProjectIds(asset.projectIds); setMsg('') }, [asset.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const usedIn = useMemo(() => JSON.stringify(content).includes(asset.url), [content, asset.url])

  const save = async () => {
    try {
      const { asset: a } = await api.updateMedia(asset.id, { alt, caption, tags: tags.split(',').map((t) => t.trim()).filter(Boolean), projectIds })
      onSaved(a); setMsg('Saved.')
    } catch (e) { setMsg((e as Error).message) }
  }
  return (
    <aside className="amedia__detail" aria-label="File details">
      <button type="button" className="abtn abtn--ghost" onClick={onClose}>Close details</button>
      {asset.type === 'image' && <img src={asset.url} alt={asset.alt} />}
      {asset.type === 'video' && <video src={asset.url} poster={asset.poster} controls preload="metadata" />}
      <p className="amedia__meta">{asset.filename}<br />{asset.type} · {fmtSize(asset.size)}{asset.width ? ` · ${asset.width}x${asset.height}` : ''}<br />Uploaded {new Date(asset.uploadedAt).toLocaleDateString()}{usedIn ? ' · In use' : ''}</p>
      <label className="afield"><span>Alt text (describe the image for people who cannot see it)</span><textarea rows={2} value={alt} onChange={(e) => setAlt(e.target.value)} /></label>
      <label className="afield"><span>Caption</span><input value={caption} onChange={(e) => setCaption(e.target.value)} /></label>
      <label className="afield"><span>Tags (comma separated)</span><input value={tags} onChange={(e) => setTags(e.target.value)} /></label>
      <label className="afield"><span>Projects</span>
        <select multiple size={Math.min(5, Math.max(2, content.projects.length))} value={projectIds} onChange={(e) => setProjectIds(Array.from(e.target.selectedOptions).map((o) => o.value))}>
          {content.projects.map((p) => <option key={p.id} value={p.id}>{p.title || p.id}</option>)}
        </select>
      </label>
      <div className="arow">
        <button type="button" className="abtn abtn--primary" onClick={() => void save()}>Save details</button>
        {onUse && <button type="button" className="abtn" onClick={onUse}>Use this file</button>}
        <button type="button" className="abtn" onClick={() => { void navigator.clipboard?.writeText(location.origin + asset.url); setMsg('Link copied.') }}><Copy size={14} aria-hidden /> Copy link</button>
        {asset.type === 'image' && asset.mime !== 'image/gif' && <button type="button" className="abtn" onClick={onRedact}><EyeOff size={14} aria-hidden /> Hide parts</button>}
        <button type="button" className="abtn abtn--danger" onClick={onDelete}><Trash2 size={14} aria-hidden /> Delete</button>
      </div>
      {msg && <p role="status" className="ahelp">{msg}</p>}
    </aside>
  )
}
