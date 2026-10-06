import { useCallback, useEffect, useMemo, useState } from 'react'
import App from './App'
import { normalizeContent, type LoadedContent } from './content/bundle'
import { applyApplication, applyAudience, applyLanguage, applySchedule, applicationExpired, type ApplicationBundle } from './content/derive'
import { ContentProvider } from './hooks/useContent'
import { ThemeProvider, type ThemePreview } from './hooks/useTheme'
import { ConsentBanner } from './components/layout/ConsentBanner'
import { useAnalytics } from './utils/analytics'
import { configureTracking, track } from './utils/track'
import { LangProvider } from './i18n/useT'
import { DomTranslate } from './i18n/DomTranslate'
import { parseRoute, isPreviewMode } from './utils/route'
import { Suspense, lazy } from 'react'
import { NotFound } from './pages/NotFound'

// Pages other than the home page load only when someone goes to them.
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const CardPage = lazy(() => import('./pages/CardPage').then((m) => ({ default: m.CardPage })))
const NotePage = lazy(() => import('./pages/NotePage').then((m) => ({ default: m.NotePage })))
const Maintenance = lazy(() => import('./pages/Maintenance').then((m) => ({ default: m.Maintenance })))
import type { SeasonName, SiteContent } from './content/types'

const SEASONS: SeasonName[] = ['spring', 'summer', 'autumn', 'winter']

function previewFromUrl(): ThemePreview | undefined {
  const q = new URLSearchParams(location.search)
  if (!q.has('preview')) return undefined
  const season = q.get('season') as SeasonName | null
  const scheme = q.get('scheme')
  const celebration = q.get('celebration')
  return { season: season && SEASONS.includes(season) ? season : undefined, scheme: scheme === 'dark' || scheme === 'light' ? scheme : undefined, celebration: celebration ?? undefined }
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
  // An audience view (Recruiters, Clients...) shares the /for/ address. It is part of the public content, so it needs no request.
  const audience = useMemo(() => (slug ? raw.audiences.find((a) => a.enabled !== false && a.slug.toLowerCase() === slug.toLowerCase()) : undefined), [raw.audiences, slug])
  useEffect(() => {
    if (!slug || audience) { setAppState({ status: 'idle' }); return }
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
  }, [slug, audience])

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
    // A link can build on a view: the view first, then the link's own settings on top.
    const base = audience ?? (appState.status === 'ok' ? raw.audiences.find((a) => a.id === appState.app.audienceId && a.enabled !== false) : undefined)
    if (base) c = applyAudience(c, base)
    if (appState.status === 'ok') c = applyApplication(c, appState.app)
    c = applySchedule(c)
    return applyLanguage(c, pack)
  }, [raw, appState, pack, audience])

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
  else if (route.kind === 'card' && content.portfolio.card.enabled) page = <CardPage />
  else if (route.kind === 'note') page = <NotePage slug={route.slug} />
  else if (route.kind === 'notfound' || (route.kind === 'profile') || route.kind === 'card' || (route.kind === 'application' && !audience && appState.status === 'missing')) page = <NotFound />
  else if (route.kind === 'application' && !audience && appState.status !== 'ok') page = null
  else page = <App />

  return (
    <ContentProvider content={content}>
      <LangProvider pack={pack} languages={languages} lang={pack ? lang : ''} setLang={setLang}>
        <ThemeProvider preview={preview}>
          <DomTranslate ui={pack?.ui} />
          <Shell source={initial.source} preview={isPreview} greeting={appState.status === 'ok' && appState.app.greeting.enabled ? appState.app.greeting.text : ''}>
            <Suspense fallback={null}>{page}</Suspense>
          </Shell>
        </ThemeProvider>
      </LangProvider>
    </ContentProvider>
  )
}

function Shell({ source, preview, greeting, children }: { source: LoadedContent['source']; preview: boolean; greeting: string; children: React.ReactNode }) {
  const consent = useAnalytics(preview)
  const [hello, setHello] = useState(!!greeting)
  useEffect(() => { setHello(!!greeting) }, [greeting])
  return (
    <>
      {hello && greeting && <p className="greeting" role="status">{greeting} <button type="button" onClick={() => setHello(false)} aria-label="Dismiss greeting">&times;</button></p>}
      {children}
      {source === 'draft' && <p className="draft-ribbon">Draft preview. Not public until published.</p>}
      <ConsentBanner state={consent} />
    </>
  )
}
