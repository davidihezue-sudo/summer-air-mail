import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { api, ApiError, type Status } from './api'
import { baseContent, normalizeContent } from '../content/bundle'
import type { MediaAsset, SiteContent } from '../content/types'
import { setIn } from './paths'

type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

interface AdminCtx {
  content: SiteContent
  status: Status | null
  save: SaveState
  error: string
  conflict: boolean
  media: MediaAsset[]
  /** Set one value by dot path inside the content. */
  set: (path: string, value: unknown) => void
  /** Free form edit. Receives a deep copy to mutate. */
  edit: (fn: (draft: SiteContent) => void) => void
  saveNow: () => Promise<void>
  publish: () => Promise<boolean>
  discard: () => Promise<void>
  replace: (content: SiteContent, rev: number, status: Status) => void
  reload: () => Promise<void>
  refreshMedia: () => Promise<void>
  setMedia: (fn: (m: MediaAsset[]) => MediaAsset[]) => void
  logout: () => Promise<void>
}

const Ctx = createContext<AdminCtx | null>(null)
export const useAdmin = () => {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAdmin outside provider')
  return v
}

const AUTOSAVE_MS = 1200

export function AdminProvider({ onLogout, children }: { onLogout: () => void; children: ReactNode }) {
  const [content, setContent] = useState<SiteContent | null>(null)
  const [status, setStatus] = useState<Status | null>(null)
  const [save, setSave] = useState<SaveState>('idle')
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState(false)
  const [media, setMediaState] = useState<MediaAsset[]>([])
  const rev = useRef(0)
  const latest = useRef<SiteContent | null>(null)
  const timer = useRef<number>(0)
  const dirty = useRef(false)
  const inflight = useRef<Promise<void> | null>(null)

  const load = useCallback(async () => {
    const d = await api.getDraft()
    rev.current = d.rev
    const c = normalizeContent(d.draft ?? structuredClone(baseContent))
    latest.current = c
    setContent(c)
    setStatus(d)
    // Nothing saved yet: the defaults are the starting draft.
    dirty.current = !d.draft
    setSave(d.draft ? 'saved' : 'dirty')
    setConflict(false)
    setError('')
  }, [])

  const refreshMedia = useCallback(async () => { setMediaState((await api.media()).media) }, [])

  useEffect(() => {
    load().then(refreshMedia).catch((e: ApiError) => { if (e.status === 401) onLogout(); else setError(e.message) })
  }, [load, refreshMedia, onLogout])

  const doSave = useCallback(async () => {
    if (!dirty.current || !latest.current) return
    if (inflight.current) { await inflight.current; if (!dirty.current) return }
    const snapshot = latest.current
    dirty.current = false
    setSave('saving')
    const p = api.saveDraft(snapshot, rev.current)
      .then((r) => {
        rev.current = r.rev
        setStatus(r)
        setSave(dirty.current ? 'dirty' : 'saved')
        setError('')
      })
      .catch((e: ApiError) => {
        dirty.current = true
        if (e.status === 401) return onLogout()
        if (e.status === 409) setConflict(true)
        setError(e.message)
        setSave('error')
      })
      .finally(() => { inflight.current = null })
    inflight.current = p
    await p
  }, [onLogout])

  const schedule = useCallback(() => {
    dirty.current = true
    setSave('dirty')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => void doSave(), AUTOSAVE_MS)
  }, [doSave])

  // First visit: nothing is saved yet, so save the starter content as the first draft.
  const hasContent = content !== null
  useEffect(() => {
    if (hasContent && dirty.current && !timer.current) schedule()
  }, [hasContent, schedule])

  const set = useCallback((path: string, value: unknown) => {
    if (!latest.current) return
    latest.current = setIn(latest.current, path, value)
    setContent(latest.current)
    schedule()
  }, [schedule])

  const edit = useCallback((fn: (d: SiteContent) => void) => {
    if (!latest.current) return
    const copy = structuredClone(latest.current)
    fn(copy)
    latest.current = copy
    setContent(copy)
    schedule()
  }, [schedule])

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty.current) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => { window.removeEventListener('beforeunload', warn); window.clearTimeout(timer.current) }
  }, [])

  const saveNow = useCallback(async () => { window.clearTimeout(timer.current); await doSave() }, [doSave])

  const publish = useCallback(async () => {
    await saveNow()
    if (dirty.current) return false
    try {
      const r = await api.publish()
      setStatus(r)
      return true
    } catch (e) {
      setError((e as Error).message)
      return false
    }
  }, [saveNow])

  const discard = useCallback(async () => {
    window.clearTimeout(timer.current)
    dirty.current = false
    const r = await api.discard()
    rev.current = r.rev
    const c = normalizeContent(r.draft ?? baseContent)
    latest.current = c
    setContent(c)
    setStatus(r)
    setSave('saved')
  }, [])

  const replace = useCallback((c: SiteContent, r: number, s: Status) => {
    rev.current = r
    latest.current = c
    dirty.current = false
    setContent(c)
    setStatus(s)
    setSave('saved')
  }, [])

  const logout = useCallback(async () => { await saveNow(); await api.logout().catch(() => {}); onLogout() }, [saveNow, onLogout])
  const setMedia = useCallback((fn: (m: MediaAsset[]) => MediaAsset[]) => setMediaState(fn), [])

  const value = useMemo<AdminCtx | null>(() => (content ? {
    content, status, save, error, conflict, media, set, edit, saveNow, publish, discard, replace, reload: load, refreshMedia, setMedia, logout,
  } : null), [content, status, save, error, conflict, media, set, edit, saveNow, publish, discard, replace, load, refreshMedia, setMedia, logout])

  if (!value) {
    return (
      <div className="admin-loading" role="status">
        {error ? (<><p>{error}</p><button className="abtn" onClick={() => void load().catch((e: Error) => setError(e.message))}>Try again</button></>) : 'Loading your portfolio'}
      </div>
    )
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
