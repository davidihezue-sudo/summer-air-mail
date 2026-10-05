import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, LogOut, Menu, Rocket, X } from 'lucide-react'
import { NAV } from './nav'
import { SearchBox } from './SearchBox'
import { useAdmin } from './store'
import { useRoute } from './router'
import { ENTITIES, PAGES } from './schema'
import './schemaExtra'
import { EntityPage } from './pages/EntityPage'
import { FormPage } from './pages/FormPage'
import { Dashboard } from './pages/Dashboard'
import { SectionsPage } from './pages/SectionsPage'
import { SeasonsPage } from './pages/SeasonsPage'
import { CelebrationsPage } from './pages/CelebrationsPage'
import { NavigationPage } from './pages/NavigationPage'
import { PublishPage } from './pages/PublishPage'
import { AdvancedPage } from './pages/AdvancedPage'
import { MediaPage } from './pages/MediaPage'
import { CursorPage } from './pages/CursorPage'
import { LooksPage } from './pages/LooksPage'
import { LanguagesPage } from './pages/LanguagesPage'
import { InboxPage } from './pages/InboxPage'
import { SubscribersPage } from './pages/SubscribersPage'
import { InsightsPage } from './pages/InsightsPage'
import { QualityPage } from './pages/QualityPage'
import { BulkPage } from './pages/BulkPage'
import { AltTextPage } from './pages/AltTextPage'
import { UsersPage } from './pages/UsersPage'
import { ServerPage } from './pages/ServerPage'
import { Badge } from './ui'


/** Pages that used to have a menu entry of their own and are now a view of another page. Old links and bookmarks still land in the right place. */
const ALIASES: Record<string, { page: string; view: string }> = { caseStudies: { page: 'projects', view: 'caseStudies' }, campaigns: { page: 'projects', view: 'campaigns' }, videos: { page: 'posts', view: 'videos' } }

function Page({ page: requested, id }: { page: string; id?: string }) {
  const alias = ALIASES[requested]
  const page = alias?.page ?? requested
  if (page === 'dashboard') return <Dashboard />
  if (page === 'sections') return <SectionsPage />
  if (page === 'seasons') return <SeasonsPage />
  if (page === 'celebrations') return <CelebrationsPage />
  if (page === 'navigation') return <NavigationPage />
  if (page === 'publish') return <PublishPage />
  if (page === 'advanced') return <AdvancedPage />
  if (page === 'media') return <MediaPage />
  if (page === 'cursor') return <CursorPage />
  if (page === 'looks') return <LooksPage />
  if (page === 'languages') return <LanguagesPage />
  if (page === 'inbox') return <InboxPage />
  if (page === 'subscribers') return <SubscribersPage />
  if (page === 'insights') return <InsightsPage />
  if (page === 'qualityScore') return <QualityPage />
  if (page === 'bulk') return <BulkPage />
  if (page === 'altText') return <AltTextPage />
  if (page === 'team') return <UsersPage />
  if (page === 'server') return <ServerPage />
  if (ENTITIES[page]) return <EntityPage key={`${page}-${alias?.view ?? ''}`} def={ENTITIES[page]} id={id} view={alias?.view} />
  if (PAGES[page]) return <FormPage key={page} page={PAGES[page]} />
  return <p>That page does not exist. <a href="#/dashboard">Back to the dashboard</a></p>
}

export function Shell() {
  const { page, id } = useRoute()
  const { save, status, error, conflict, publish, logout, reload, me, canEdit } = useAdmin()
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => setOpen(false), [page, id])
  useEffect(() => { if (!toast) return; const t = window.setTimeout(() => setToast(''), 4000); return () => window.clearTimeout(t) }, [toast])
  // After the search opens a page, scroll to the setting that was asked for and flash it.
  useEffect(() => {
    const find = () => {
      let text = ''
      try { text = sessionStorage.getItem('sam-find') ?? ''; sessionStorage.removeItem('sam-find') } catch { return }
      if (!text) return
      window.setTimeout(() => {
        const want = text.toLowerCase()
        const el = Array.from(document.querySelectorAll<HTMLElement>('#amain label, #amain legend, #amain summary, #amain .alabel, #amain h2')).find((n) => (n.textContent ?? '').trim().toLowerCase().startsWith(want))
        if (!el) return
        let d = el.closest('details')
        while (d) { d.open = true; d = d.parentElement?.closest('details') ?? null }
        el.scrollIntoView({ block: 'center', behavior: 'smooth' })
        el.classList.add('afound')
        window.setTimeout(() => el.classList.remove('afound'), 2800)
      }, 250)
    }
    find()
    window.addEventListener('sam-find', find)
    return () => window.removeEventListener('sam-find', find)
  }, [page, id])
  const title = useMemo(() => NAV.flatMap((g) => g.items).find((i) => i.id === page)?.label ?? '', [page])
  useEffect(() => { document.title = `${title || 'Admin'} | Portfolio admin` }, [title])

  const stateLabel = save === 'saving' ? 'Saving' : save === 'dirty' ? 'Unsaved changes' : save === 'error' ? 'Not saved' : 'Draft saved'
  const tone = save === 'error' ? 'warn' : save === 'saved' ? 'good' : 'neutral'

  return (
    <div className="ashell">
      <a className="skip" href="#amain">Skip to content</a>
      <aside className={`aside ${open ? 'is-open' : ''}`} aria-label="Admin sections">
        <div className="aside__brand"><span>Portfolio admin</span><button type="button" className="aicon aside__close" aria-label="Close menu" onClick={() => setOpen(false)}><X size={18} /></button></div>
        <nav>
          {NAV.map((g) => ({ ...g, items: g.items.filter((i) => !i.owner || me.role === 'owner') })).map((g) => (
            <div key={g.group} className="aside__group">
              <p className="aside__label">{g.group}</p>
              <ul>
                {g.items.map((i) => (
                  <li key={i.id}>
                    <a href={`#/${i.id}`} className={page === i.id ? 'is-active' : ''} aria-current={page === i.id ? 'page' : undefined}><i.icon size={17} aria-hidden /> {i.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="aside__actions">
          <a className="abtn" href="/?preview=draft" target="_blank" rel="noopener noreferrer"><ExternalLink size={14} aria-hidden /> Preview the draft<span className="sr-only"> (opens in a new tab)</span></a>
          <a className="abtn" href="/" target="_blank" rel="noopener noreferrer">View live site<span className="sr-only"> (opens in a new tab)</span></a>
          <button type="button" className="abtn" onClick={() => void logout()}><LogOut size={14} aria-hidden /> Sign out</button>
        </div>
      </aside>
      {open && <button type="button" className="aside__scrim" aria-label="Close menu" onClick={() => setOpen(false)} />}

      <div className="amain">
        <header className="atop">
          <button type="button" className="aicon atop__menu" aria-label="Open menu" onClick={() => setOpen(true)}><Menu size={20} /></button>
          <SearchBox />
          <div className="atop__status" role="status" aria-live="polite">
            <Badge tone={tone}>{stateLabel}</Badge>
            {status?.unpublished || !status?.publishedAt ? <Badge tone="warn">{status?.publishedAt ? 'Unpublished changes' : 'Not published yet'}</Badge> : <Badge tone="good">Live site is up to date</Badge>}
          </div>
          <div className="atop__actions">
            <a className="abtn atop__secondary" href="/?preview=draft" target="_blank" rel="noopener noreferrer"><ExternalLink size={14} aria-hidden /> Preview<span className="sr-only"> (opens in a new tab)</span></a>
            <button type="button" className="abtn abtn--primary" title={me.canPublish ? undefined : 'Only the owner can publish'} disabled={busy || save === 'saving' || !me.canPublish} onClick={async () => { setBusy(true); const ok = await publish(); setBusy(false); setToast(ok ? 'Published. Your live site is updated.' : 'Could not publish. See the message at the top of the page.') }}>
              <Rocket size={14} aria-hidden /> {busy ? 'Publishing' : 'Publish'}
            </button>
            <button type="button" className="abtn atop__secondary" onClick={() => void logout()}><LogOut size={14} aria-hidden /> Sign out</button>
          </div>
        </header>
        {(error || conflict) && (
          <div className="abanner" role="alert">
            {error}
            {conflict && <button type="button" className="abtn" onClick={() => void reload()}>Reload latest</button>}
          </div>
        )}
        <main id="amain" className="acontent" tabIndex={-1}>
          {!canEdit && <p className="abanner">You can look around but not change anything. Your role is viewer.</p>}
          <fieldset disabled={!canEdit && !['inbox', 'insights', 'qualityScore'].includes(page)} className="afieldset"><Page page={page} id={id} /></fieldset>
        </main>
        {toast && <p className="atoast" role="status">{toast}</p>}
      </div>
    </div>
  )
}
