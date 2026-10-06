import { useEffect, useState } from 'react'
import { useContent } from '../hooks/useContent'
import { navigate } from '../utils/route'

/** The page behind the one-time link made in Visit Insights. Opening it once tells the server this device is yours. */
export function OwnDevicePage({ token }: { token: string }) {
  const { content } = useContent()
  const [state, setState] = useState<'working' | 'done' | 'failed'>('working')
  const [message, setMessage] = useState('')
  useEffect(() => {
    document.title = 'Add this device'
    let live = true
    fetch('/api/own/claim', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }) })
      .then(async (r) => {
        const j = (await r.json().catch(() => ({}))) as { error?: string }
        if (!live) return
        if (r.ok) setState('done'); else { setState('failed'); setMessage(j.error ?? 'That did not work.') }
      })
      .catch(() => live && (setState('failed'), setMessage('Could not reach the site. Check your connection and try again.')))
    return () => { live = false }
  }, [token])
  const name = content.portfolio.profile.preferredName || 'this site'
  return (
    <main id="main" className="statuspage">
      <p className="eyebrow">{name}</p>
      <h1 className="h2">{state === 'working' ? 'One moment' : state === 'done' ? 'This device is now counted as yours' : 'This link did not work'}</h1>
      <p className="lede">
        {state === 'working' && 'Adding this device.'}
        {state === 'done' && 'Visits from this phone or computer will no longer be counted as outside visitors. They are kept in a separate "You and home" count. You can close this page.'}
        {state === 'failed' && message}
      </p>
      <a className="btn btn--solid" href="/" onClick={(e) => { e.preventDefault(); navigate('/') }}>Go to the site</a>
    </main>
  )
}
