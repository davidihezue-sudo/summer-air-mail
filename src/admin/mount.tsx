import { StrictMode, useCallback, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './admin.css'
import { api, ApiError, type Me } from './api'
import { Login } from './Login'
import { AdminProvider } from './store'
import { Shell } from './Shell'
import { MediaPickerProvider } from './media'

function AdminApp() {
  const [state, setState] = useState<'loading' | 'out' | 'in'>('loading')
  const [configured, setConfigured] = useState(true)
  const [serverError, setServerError] = useState('')
  const [me, setMe] = useState<Me | null>(null)

  const check = useCallback(async () => {
    try {
      const s = await api.session()
      setConfigured(s.configured)
      setServerError('')
      setMe(s.authenticated ? s : null)
      if (s.authenticated) { try { localStorage.setItem('sam-ignore', '1') } catch { /* private mode */ } }
      setState(s.authenticated ? 'in' : 'out')
    } catch (e) {
      setServerError((e as ApiError).message)
      setState('out')
    }
  }, [])
  useEffect(() => { void check() }, [check])
  useEffect(() => { document.title = 'Portfolio admin' }, [])

  if (state === 'loading') return <div className="admin-loading" role="status">Loading</div>
  if (state === 'out') return <Login configured={configured} serverError={serverError} onDone={() => void check()} />
  return (
    <AdminProvider me={me!} onLogout={() => setState('out')}>
      <MediaPickerProvider>
        <Shell />
      </MediaPickerProvider>
    </AdminProvider>
  )
}

export function mountAdmin(el: HTMLElement) {
  let meta = document.querySelector('meta[name="robots"]')
  if (!meta) { meta = document.createElement('meta'); meta.setAttribute('name', 'robots'); document.head.appendChild(meta) }
  meta.setAttribute('content', 'noindex, nofollow')
  createRoot(el).render(<StrictMode><div className="admin"><AdminApp /></div></StrictMode>)
}
