import { useContent } from '../../hooks/useContent'
import { getProjects } from '../../content/selectors'
import { hasValue } from '../../utils/text'

/** Brands from your own published projects. Nothing here is typed in separately, so it can never claim a client you have not listed. */
export function ClientStrip() {
  const { content } = useContent()
  if (!content.portfolio.extras.clientStrip) return null
  const names = [...new Set(getProjects(content).map((p) => p.client.trim()).filter((c) => hasValue(c)))]
  if (names.length < 2) return null
  return (
    <aside className="clients" aria-label="Brands I have worked with">
      <p className="clients__label">Brands I have worked with</p>
      <ul className="clients__list">{names.map((n) => <li key={n}>{n}</li>)}</ul>
    </aside>
  )
}
