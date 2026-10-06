import type { Portfolio } from '../content/types'

type EventType = 'view' | 'project' | 'cta' | 'download' | 'contact' | 'note' | 'share'

let config: Pick<Portfolio['insights'], 'enabled' | 'respectDoNotTrack' | 'requireConsent'> | null = null
let allowed = false
let own = false
let via = ''

/** Remembers which audience view or link this visit started from, for this tab only, so what the visitor does next is credited to it. */
export function setVia(slug: string) {
  via = /^[A-Za-z0-9][A-Za-z0-9-]{1,79}$/.test(slug) ? slug : ''
  try { if (via) sessionStorage.setItem('sam-via', via) } catch { /* the visit is still counted, just not credited */ }
}

/** Called once content is known. Never sends from previews or when the visitor asks not to be tracked. The owner's visits are flagged so they are counted apart (or dropped, if the owner prefers). */
export function configureTracking(insights: Portfolio['insights'], preview: boolean) {
  config = insights
  try { const v = sessionStorage.getItem('sam-via'); if (v && !via) via = v } catch { /* storage blocked */ }
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean }
  const dnt = nav.doNotTrack === '1' || nav.globalPrivacyControl === true
  let owner = !!document.querySelector('meta[name="sam-owner"]')
  try { owner = owner || localStorage.getItem('sam-ignore') === '1' } catch { /* storage blocked */ }
  own = owner
  let consent = true
  if (insights.requireConsent && !owner) { try { consent = localStorage.getItem('sam-consent') === 'granted' } catch { consent = false } }
  allowed = insights.enabled && !preview && (!owner || insights.countOwn !== false) && !(insights.respectDoNotTrack && dnt) && consent
}

/** First party and cookieless. The server stores only daily totals. */
export function track(type: EventType, name = '') {
  if (!config || !allowed) return
  const body = JSON.stringify({ own: own || undefined, via: via || undefined, type, name: name.slice(0, 80), path: location.pathname, ref: type === 'view' && document.referrer ? new URL(document.referrer).hostname : '' })
  try {
    if (!navigator.sendBeacon?.('/api/track', new Blob([body], { type: 'application/json' }))) void fetch('/api/track', { method: 'POST', body, headers: { 'content-type': 'application/json' }, keepalive: true })
  } catch { /* analytics must never break the page */ }
}
