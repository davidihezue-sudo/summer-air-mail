import type { ConsentState } from '../../utils/analytics'

export function ConsentBanner({ state }: { state: ConsentState }) {
  if (!state.needsConsent) return null
  return (
    <div className="consent" role="dialog" aria-label="Analytics consent" aria-live="polite">
      <p>This site can use privacy-conscious analytics to see which pages are read. It is off unless you agree.</p>
      <div className="consent__actions">
        <button type="button" className="btn btn--ghost" onClick={state.decline}>No thanks</button>
        <button type="button" className="btn btn--solid" onClick={state.accept}>Allow analytics</button>
      </div>
    </div>
  )
}
