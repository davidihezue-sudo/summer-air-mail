import { useEffect } from 'react'
import { useContent } from '../hooks/useContent'
import { navigate } from '../utils/route'

export function NotFound() {
  const { content } = useContent()
  const n = content.portfolio.notFound
  useEffect(() => { document.title = n.title }, [n.title])
  return (
    <main id="main" className="statuspage">
      <p className="eyebrow">404</p>
      <h1 className="h2">{n.title}</h1>
      <p className="lede">{n.message}</p>
      <a className="btn btn--solid" href="/" onClick={(e) => { e.preventDefault(); navigate('/') }}>{n.buttonLabel}</a>
    </main>
  )
}
