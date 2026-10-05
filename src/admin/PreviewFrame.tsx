import { useEffect, useRef, useState } from 'react'
import { useAdmin } from './store'
import type { ProfessionalIntensity, SeasonName } from '../content/types'

export type Viewport = 'desktop' | 'tablet' | 'mobile'
const WIDTH: Record<Viewport, number> = { desktop: 1280, tablet: 768, mobile: 390 }
const HEIGHT: Record<Viewport, number> = { desktop: 760, tablet: 900, mobile: 780 }

/**
 * Live preview of the public site. Unsaved edits are sent to the frame with postMessage, so what you see
 * is the draft exactly as it will publish. The frame is same-origin and only trusts messages from this window.
 */
export function PreviewFrame({ viewport, season, professional, celebration }: { viewport: Viewport; season?: SeasonName; professional?: ProfessionalIntensity; celebration?: string }) {
  const { content } = useAdmin()
  const frame = useRef<HTMLIFrameElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [scale, setScale] = useState(1)
  const timer = useRef<number>(0)

  useEffect(() => {
    const onMsg = (e: MessageEvent) => { if (e.origin === location.origin && e.source === frame.current?.contentWindow && e.data?.type === 'sam-preview-ready') setReady(true) }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  useEffect(() => {
    if (!ready) return
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      frame.current?.contentWindow?.postMessage({ type: 'sam-preview', content, preview: { season, professional, celebration } }, location.origin)
    }, 220)
    return () => window.clearTimeout(timer.current)
  }, [content, ready, season, professional, celebration])

  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setScale(Math.min(1, el.clientWidth / WIDTH[viewport])))
    ro.observe(el)
    return () => ro.disconnect()
  }, [viewport])

  const w = WIDTH[viewport]
  const h = HEIGHT[viewport]
  return (
    <div ref={box} className="apreview" style={{ height: h * scale + 2 }}>
      <iframe
        ref={frame} title={`Site preview (${viewport})`} src={`/?preview=draft${season ? `&season=${season}` : ''}`}
        style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'top left' }} loading="lazy"
      />
    </div>
  )
}
