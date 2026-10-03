import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3, Bot, Briefcase, Calendar, Clapperboard, Compass, ExternalLink, FileText, Film, Globe, Image as ImageIcon, LayoutDashboard, Layers,
  LayoutList, Link2, ListChecks, LogOut, Megaphone, Menu, MessageSquareQuote, Palette, PenTool, Rocket, Search, Settings, Share2, Sparkles, Target, User, Wrench, X,
  Laptop, Mail, Camera, BookOpen, Star, Workflow, Cpu, Footprints, Eye,
} from 'lucide-react'
import { useAdmin } from './store'
import { useRoute } from './router'
import { ENTITIES, PAGES } from './schema'
import { EntityPage } from './pages/EntityPage'
import { FormPage } from './pages/FormPage'
import { Dashboard } from './pages/Dashboard'
import { SectionsPage } from './pages/SectionsPage'
import { SeasonsPage } from './pages/SeasonsPage'
import { NavigationPage } from './pages/NavigationPage'
import { PublishPage } from './pages/PublishPage'
import { AdvancedPage } from './pages/AdvancedPage'
import { MediaPage } from './pages/MediaPage'
import { Badge } from './ui'

const NAV: { group: string; items: { id: string; label: string; icon: typeof User }[] }[] = [
  { group: 'Overview', items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  { group: 'Identity', items: [
    { id: 'profile', label: 'Personal Profile', icon: User }, { id: 'about', label: 'About & Recruiter Overview', icon: BookOpen }, { id: 'hero', label: 'Hero', icon: Rocket },
    { id: 'cv', label: 'Resume / CV', icon: FileText }, { id: 'social', label: 'Social Links', icon: Share2 }, { id: 'contact', label: 'Contact', icon: Mail },
  ] },
  { group: 'Look and layout', items: [
    { id: 'appearance', label: 'Appearance', icon: Palette }, { id: 'seasons', label: 'Seasons', icon: Calendar }, { id: 'sections', label: 'Sections & Visibility', icon: ListChecks },
    { id: 'navigation', label: 'Navigation', icon: Compass }, { id: 'footer', label: 'Footer', icon: Footprints },
  ] },
  { group: 'Portfolio', items: [
    { id: 'projects', label: 'Portfolio', icon: Briefcase }, { id: 'caseStudies', label: 'Case Studies', icon: BookOpen }, { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
    { id: 'posts', label: 'Social Media Content', icon: Camera }, { id: 'videos', label: 'Videos & Reels', icon: Film }, { id: 'screenshots', label: 'Screenshots', icon: Clapperboard },
    { id: 'results', label: 'Analytics & Results', icon: BarChart3 }, { id: 'websites', label: 'Websites & Digital Projects', icon: Laptop },
  ] },
  { group: 'Capabilities', items: [
    { id: 'services', label: 'Services', icon: Layers }, { id: 'skills', label: 'Skills', icon: Star }, { id: 'platforms', label: 'Platform Expertise', icon: Globe },
    { id: 'tools', label: 'Tools & Platforms', icon: Wrench }, { id: 'ai', label: 'AI & Automation', icon: Cpu }, { id: 'process', label: 'Marketing Process', icon: Workflow },
    { id: 'strategy', label: 'Strategy Framework', icon: Target }, { id: 'testimonials', label: 'Testimonials', icon: MessageSquareQuote }, { id: 'mentoring', label: 'Mentoring & Training', icon: PenTool },
  ] },
  { group: 'Publish', items: [
    { id: 'media', label: 'Media Library', icon: ImageIcon }, { id: 'publish', label: 'Preview & Publish', icon: Eye }, { id: 'seo', label: 'SEO', icon: Search },
    { id: 'analytics', label: 'Analytics Tracking', icon: Sparkles }, { id: 'advanced', label: 'Advanced Settings', icon: Settings },
  ] },
]
void [Bot, LayoutList, Link2]

function Page({ page, id }: { page: string; id?: string }) {
  if (page === 'dashboard') return <Dashboard />
  if (page === 'sections') return <SectionsPage />
  if (page === 'seasons') return <SeasonsPage />
  if (page === 'navigation') return <NavigationPage />
  if (page === 'publish') return <PublishPage />
  if (page === 'advanced') return <AdvancedPage />
  if (page === 'media') return <MediaPage />
  if (ENTITIES[page]) return <EntityPage key={page} def={ENTITIES[page]} id={id} />
  if (PAGES[page]) return <FormPage key={page} page={PAGES[page]} />
  return <p>That page does not exist. <a href="#/dashboard">Back to the dashboard</a></p>
}

export function Shell() {
  const { page, id } = useRoute()
  const { save, status, error, conflict, publish, logout, reload } = useAdmin()
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => setOpen(false), [page, id])
  useEffect(() => { if (!toast) return; const t = window.setTimeout(() => setToast(''), 4000); return () => window.clearTimeout(t) }, [toast])
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
          {NAV.map((g) => (
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
      </aside>
      {open && <button type="button" className="aside__scrim" aria-label="Close menu" onClick={() => setOpen(false)} />}

      <div className="amain">
        <header className="atop">
          <button type="button" className="aicon atop__menu" aria-label="Open menu" onClick={() => setOpen(true)}><Menu size={20} /></button>
          <div className="atop__status" role="status" aria-live="polite">
            <Badge tone={tone}>{stateLabel}</Badge>
            {status?.unpublished || !status?.publishedAt ? <Badge tone="warn">{status?.publishedAt ? 'Unpublished changes' : 'Not published yet'}</Badge> : <Badge tone="good">Live site is up to date</Badge>}
          </div>
          <div className="atop__actions">
            <a className="abtn" href="/?preview=draft" target="_blank" rel="noopener noreferrer"><ExternalLink size={14} aria-hidden /> Preview<span className="sr-only"> (opens in a new tab)</span></a>
            <button type="button" className="abtn abtn--primary" disabled={busy || save === 'saving'} onClick={async () => { setBusy(true); const ok = await publish(); setBusy(false); setToast(ok ? 'Published. Your live site is updated.' : 'Could not publish. See the message at the top of the page.') }}>
              <Rocket size={14} aria-hidden /> {busy ? 'Publishing' : 'Publish'}
            </button>
            <button type="button" className="abtn" onClick={() => void logout()}><LogOut size={14} aria-hidden /> Sign out</button>
          </div>
        </header>
        {(error || conflict) && (
          <div className="abanner" role="alert">
            {error}
            {conflict && <button type="button" className="abtn" onClick={() => void reload()}>Reload latest</button>}
          </div>
        )}
        <main id="amain" className="acontent" tabIndex={-1}><Page page={page} id={id} /></main>
        {toast && <p className="atoast" role="status">{toast}</p>}
      </div>
    </div>
  )
}
