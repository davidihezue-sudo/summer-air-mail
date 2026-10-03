import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/italiana/latin-400.css'
import '@fontsource/pinyon-script/latin-400.css'
import '@fontsource-variable/figtree/wght.css'
import './styles/base.css'
import './styles/hero.css'
import './styles/sections.css'
import './styles/seasons.css'
import Root from './Root'
import { loadContent } from './content/bundle'

async function boot() {
  const el = document.getElementById('root')!
  if (location.pathname === '/admin' || location.pathname.startsWith('/admin/')) {
    const { mountAdmin } = await import('./admin/mount')
    mountAdmin(el)
    return
  }
  const initial = await loadContent()
  createRoot(el).render(
    <StrictMode>
      <Root initial={initial} />
    </StrictMode>,
  )
}

void boot()
