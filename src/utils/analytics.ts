import { useCallback, useEffect, useState } from 'react'
import { useContent } from '../hooks/useContent'

export const ID_PATTERNS = {
  ga4: /^G-[A-Z0-9]{4,14}$/,
  gtm: /^GTM-[A-Z0-9]{4,10}$/,
  metaPixel: /^\d{8,20}$/,
}

const KEY = 'sam-consent'
type Consent = 'granted' | 'denied' | null

function readConsent(): Consent {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'granted' || v === 'denied' ? v : null
  } catch {
    return null
  }
}

function privacySignal(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean }
  return nav.doNotTrack === '1' || nav.globalPrivacyControl === true
}

function addScript(src: string) {
  const s = document.createElement('script')
  s.async = true
  s.src = src
  document.head.appendChild(s)
}

type W = Window & { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void; fbq?: ((...a: unknown[]) => void) & { q?: unknown[]; queue?: unknown[]; loaded?: boolean; callMethod?: (...a: unknown[]) => void; version?: string; push?: unknown } }
let loaded = false

/** Loads only the trackers whose IDs are valid. No inline scripts, so a strict CSP can stay in place. */
export function loadTrackers(a: { ga4: string; gtm: string; metaPixel: string }) {
  if (loaded) return
  loaded = true
  const w = window as W
  w.dataLayer = w.dataLayer || []
  if (ID_PATTERNS.gtm.test(a.gtm)) {
    w.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })
    addScript(`https://www.googletagmanager.com/gtm.js?id=${a.gtm}`)
  }
  if (ID_PATTERNS.ga4.test(a.ga4)) {
    w.gtag = function gtag(...args: unknown[]) { w.dataLayer!.push(args) }
    w.gtag('js', new Date())
    w.gtag('config', a.ga4, { anonymize_ip: true })
    addScript(`https://www.googletagmanager.com/gtag/js?id=${a.ga4}`)
  }
  if (ID_PATTERNS.metaPixel.test(a.metaPixel)) {
    const fbq = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args)
      else fbq.queue!.push(args)
    } as NonNullable<W['fbq']>
    fbq.queue = []
    fbq.loaded = true
    fbq.version = '2.0'
    fbq.push = fbq
    w.fbq = fbq
    fbq('init', a.metaPixel)
    fbq('track', 'PageView')
    addScript('https://connect.facebook.net/en_US/fbevents.js')
  }
}

export interface ConsentState {
  needsConsent: boolean
  accept: () => void
  decline: () => void
}

export function useAnalytics(preview: boolean): ConsentState {
  const { content } = useContent()
  const a = content.portfolio.analytics
  const hasIds = ID_PATTERNS.ga4.test(a.ga4) || ID_PATTERNS.gtm.test(a.gtm) || ID_PATTERNS.metaPixel.test(a.metaPixel)
  const active = a.enabled && hasIds && !preview && !(a.respectDoNotTrack && privacySignal())
  const [consent, setConsent] = useState<Consent>(readConsent)

  useEffect(() => {
    if (!active) return
    if (!a.requireConsent || consent === 'granted') loadTrackers(a)
  }, [active, a, consent])

  const set = useCallback((v: Exclude<Consent, null>) => {
    try { localStorage.setItem(KEY, v) } catch { /* private mode: choice lasts for this visit only */ }
    setConsent(v)
  }, [])

  return { needsConsent: active && a.requireConsent && consent === null, accept: () => set('granted'), decline: () => set('denied') }
}
