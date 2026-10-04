import { useCallback, useEffect, useMemo, useState } from 'react'
import App from './App'
import { normalizeContent, type LoadedContent } from './content/bundle'
import { applyApplication, applyLanguage, applySchedule, applicationExpired, type ApplicationBundle } from './content/derive'
import { ContentProvider } from './hooks/useContent'
import { ThemeProvider, type ThemePreview } from './hooks/useTheme'
import { ConsentBanner } from './components/layout/ConsentBanner'
import { useAnalytics } from './utils/analytics'
import { configureTracking, track } from './utils/track'
import { LangProvider } from './i18n/useT'
import { parseRoute, isPreviewMode } from './utils/route'
import { ProfilePage } from './pages/ProfilePage'
import { NotePage } from './pages/NotePage'
import { NotFound } from './pages/NotFound'
import { Maintenance } from './pages/Maintenance'
import type { SeasonName, SiteContent } from './content/types'

const SEASONS: SeasonName[] = ['spring', 'summer', 'autumn', 'winter']

function previewFromUrl(): ThemePreview | undefined {
  const q = new URLSearchParams(location.search)
  if (!q.has('preview')) return undefined
  const season = q.get('season') as SeasonName | null
  return { season: season && SEASONS.includes(season) ? season : undefined }
}

const readLang = () => {
  try { return new URLSearchParams(location.search).get('lang') ?? localStorage.getItem('sam-lang') ?? '' } catch { return '' }
}

type AppState = { status: 'idle' } | { status: 'loading' } | { status: 'missing' } | { status: 'ok'; app: ApplicationBundle }

/** Holds live content. In preview mode the admin can push unsaved edits in through postMessage. */
export default function Root({ initial }: { initial: LoadedContent }) {
  const [raw, setRaw] = useState(initial.content)
  const [preview, setPreview] = useState<ThemePreview | undefined>(previewFromUrl)
  const [path, setPath] = useState(location.pathname)
  const [lang, setLangState] = useState(readLang)
  const [appState, setAppState] = useState<AppState>({ status: 'idle' })
  const isPreview = isPreviewMode()
  const route = useMemo(() => parseRoute(path), [path])

  useEffect(() => {
    const onPop = () => setPath(location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    if (!isPreview) return
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.source !== window.parent) return
      const d = e.data as { type?: string; content?: unknown; preview?: ThemePreview }
      if (d?.type !== 'sam-preview') return
      if (d.content) setRaw(normalizeContent(d.content))
      if (d.preview) setPreview(d.preview)
    }
    window.addEventListener('message', onMessage)
    window.parent?.postMessage({ type: 'sam-preview-ready' }, location.origin)
    return () => window.removeEventListener('message', onMessage)
  }, [isPreview])

  // A tailored application link: fetched by its slug, never part of the public content.
  const slug = route.kind === 'application' ? route.slug : ''
  useEffect(() => {
    if (!slug) { setAppState({ status: 'idle' }); return }
    let live = true
    setAppState({ status: 'loading' })
    fetch(`/api/application/${encodeURIComponent(slug)}`, { headers: { Accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { application?: ApplicationBundle } | null) => {
        if (!live) return
        setAppState(j?.application && !applicationExpired(j.application) ? { status: 'ok', app: j.application } : { status: 'missing' })
      })
      .catch(() => live && setAppState({ status: 'missing' }))
    return () => { live = false }
  }, [slug])

  const i18n = raw.portfolio.i18n
  const packs = useMemo(() => (i18n.enabled ? i18n.languages.filter((l) => l.code) : []), [i18n])
  const pack = packs.find((l) => l.code === lang)
  const languages = useMemo(() => packs.map((l) => ({ code: l.code, label: l.label })), [packs])
  const setLang = useCallback((code: string) => {
    setLangState(code)
    try { localStorage.setItem('sam-lang', code) } catch { /* lasts for this visit */ }
  }, [])

  const content = useMemo<SiteContent>(() => {
    let c = raw
    if (appState.status === 'ok') c = applyApplication(c, appState.app)
    c = applySchedule(c)
    return applyLanguage(c, pack)
  }, [raw, appState, pack])

  useEffect(() => {
    document.documentElement.lang = pack?.code || raw.portfolio.site.locale.split('-')[0] || 'en'
    document.documentElement.dir = pack?.rtl ? 'rtl' : 'ltr'
  }, [pack, raw.portfolio.site.locale])

  useEffect(() => { configureTracking(raw.portfolio.insights, isPreview) }, [raw.portfolio.insights, isPreview])
  useEffect(() => { track('view') }, [path])

  const owner = !!document.querySelector('meta[name="sam-owner"]')
  const maintenance = content.portfolio.maintenance.enabled && !owner && !isPreview && initial.source !== 'draft'

  let page
  if (maintenance) page = <Maintenance />
  else if (route.kind === 'profile' && content.portfolio.profilePage.enabled) page = <ProfilePage />
  else if (route.kind === 'note') page = <NotePage slug={route.slug} />
  else if (route.kind === 'notfound' || (route.kind === 'profile') || (route.kind === 'application' && appState.status === 'missing')) page = <NotFound />
  else if (route.kind === 'application' && appState.status !== 'ok') page = null
  else page = <App />

  return (
    <ContentProvider content={content}>
      <LangProvider pack={pack} languages={languages} lang={pack ? lang : ''} setLang={setLang}>
        <ThemeProvider preview={preview}>
          <Shell source={initial.source} preview={isPreview} greeting={appState.status === 'ok' && appState.app.greeting.enabled ? appState.app.greeting.text : ''}>
            {page}
          </Shell>
        </ThemeProvider>
      </LangProvider>
    </ContentProvider>
  )
}

function Shell({ source, preview, greeting, children }: { source: LoadedContent['source']; preview: boolean; greeting: string; children: React.ReactNode }) {
  const consent = useAnalytics(preview)
  const [hello, setHello] = useState(!!greeting)
  return (
    <>
      {hello && greeting && <p className="greeting" role="status">{greeting} <button type="button" onClick={() => setHello(false)} aria-label="Dismiss greeting">&times;</button></p>}
      {children}
      {source === 'draft' && <p className="draft-ribbon">Draft preview. Not public until published.</p>}
      <ConsentBanner state={consent} />
    </>
  )
}
