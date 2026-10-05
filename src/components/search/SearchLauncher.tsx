import { Suspense, lazy, useEffect, useState } from 'react'
import { useContent } from '../../hooks/useContent'

const SiteSearch = lazy(() => import('./SiteSearch').then((m) => ({ default: m.SiteSearch })))

/** Opens the search on Ctrl+K, Command+K or "/" (when not typing), and from the header button. The search itself loads the first time it is needed. */
export function SearchLauncher() {
  const { content } = useContent()
  const on = content.portfolio.extras.siteSearch
  const [open, setOpen] = useState(false)
  const [used, setUsed] = useState(false)
  useEffect(() => {
    if (!on) return
    const show = () => { setUsed(true); setOpen(true) }
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      const typing = !!t?.closest('input, textarea, select, [contenteditable="true"]')
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); show() }
      else if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); show() }
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('sam-search', show)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('sam-search', show) }
  }, [on])
  if (!on || !used) return null
  return <Suspense fallback={null}><SiteSearch open={open} onClose={() => setOpen(false)} /></Suspense>
}
