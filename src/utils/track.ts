import type { Portfolio } from '../content/types'

type EventType = 'view' | 'project' | 'cta' | 'download' | 'contact' | 'note' | 'share'

let config: Pick<Portfolio['insights'], 'enabled' | 'respectDoNotTrack' | 'requireConsent'> | null = null
let allowed = false

/** Called once content is known. Never sends from previews, from the owner, or when the visitor asks not to be tracked. */
export function configureTracking(insights: Portfolio['insights'], preview: boolean) {
  config = insights
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean }
  const dnt = nav.doNotTrack === '1' || nav.globalPrivacyControl === true
  let owner = !!document.querySelector('meta[name="sam-owner"]')
  try { owner = owner || localStorage.getItem('sam-ignore') === '1' } catch { /* storage blocked */ }
  let consent = true
  if (insights.requireConsent) { try { consent = localStorage.getItem('sam-consent') === 'granted' } catch { consent = false } }
  allowed = insights.enabled && !preview && !owner && !(insights.respectDoNotTrack && dnt) && consent
}

/** First party and cookieless. The server stores only daily totals. */
export function track(type: EventType, name = '') {
  if (!config || !allowed) return
  const body = JSON.stringify({ type, name: name.slice(0, 80), path: location.pathname, ref: type === 'view' && document.referrer ? new URL(document.referrer).hostname : '' })
  try {
    if (!navigator.sendBeacon?.('/api/track', new Blob([body], { type: 'application/json' }))) void fetch('/api/track', { method: 'POST', body, headers: { 'content-type': 'application/json' }, keepalive: true })
  } catch { /* analytics must never break the page */ }
}
