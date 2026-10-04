import { useEffect, useRef } from 'react'
import type { CursorSettings, SeasonName } from '../../content/types'
import { clamp, isShapeStyle, resolveRgb } from '../../motion/cursor'

interface P { x: number; y: number; vx: number; vy: number; r: number; life: number; rot: number; vr: number; kind?: number }

interface Props {
  settings: CursorSettings
  /** Season default colour as "r,g,b". */
  rgb: string
  season: SeasonName
  /** Resolved URL for the image style. */
  imageSrc?: string
}

/**
 * One fixed canvas draws every pointer effect. The loop only runs while the pointer has moved
 * recently or particles are still alive, so an idle page costs nothing.
 */
export function CursorFx({ settings, rgb, season, imageSrc }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const size = clamp(settings.size, 8, 220)
    const alpha = clamp(settings.opacity, 0.05, 1)
    const smooth = clamp(settings.smoothing, 0, 0.95)
    const maxTrail = Math.round(clamp(settings.trail, 0, 40))
    const style = settings.style
    const shape = isShapeStyle(style)
    const color = resolveRgb(settings.color, rgb, (t) => getComputedStyle(document.documentElement).getPropertyValue(`--c-${t}`))
    const parts: P[] = []
    const history: { x: number; y: number }[] = []
    const mouse = { x: -999, y: -999, tx: -999, ty: -999, seen: false, active: true, grow: 1, tgrow: 1, vx: 0, vy: 0 }
    let frame = 0
    let lastSpawn = 0
    let idleSince = 0
    let img: HTMLImageElement | null = null
    if (style === 'image' && imageSrc) { img = new Image(); img.src = imageSrc }

    const resize = () => {
      canvas.width = Math.round(window.innerWidth * dpr)
      canvas.height = Math.round(window.innerHeight * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const rnd = (a: number, b: number) => a + Math.random() * (b - a)
    const rgba = (a: number, c = color) => `rgba(${c},${clamp(a, 0, 1)})`
    const star = (x: number, y: number, r: number, rot: number) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath()
      for (let i = 0; i < 8; i++) { const rad = i % 2 ? r * 0.28 : r; const a = (i * Math.PI) / 4; ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad) }
      ctx.closePath(); ctx.fill(); ctx.restore()
    }
    const petal = (x: number, y: number, r: number, rot: number) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.55, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore()
    }
    const spawn = (x: number, y: number) => {
      const s = size / 28
      switch (style) {
        case 'bubbles': parts.push({ x, y, vx: rnd(-0.3, 0.3), vy: -rnd(0.6, 1.5), r: rnd(2, 7) * s, life: 1, rot: 0, vr: 0 }); break
        case 'ripple': parts.push({ x, y, vx: 0, vy: 0, r: 2, life: 1, rot: 0, vr: 0 }); break
        case 'sparkles': parts.push({ x: x + rnd(-6, 6), y: y + rnd(-6, 6), vx: rnd(-0.4, 0.4), vy: rnd(0.2, 0.9), r: rnd(3, 7) * s, life: 1, rot: rnd(0, 3), vr: rnd(-0.05, 0.05) }); break
        case 'seasonal': parts.push({ x, y, vx: rnd(-0.6, 0.6), vy: season === 'winter' ? rnd(0.5, 1.1) : rnd(0.3, 1), r: (season === 'winter' ? rnd(1.5, 3.5) : rnd(3, 6)) * s, life: 1, rot: rnd(0, 6), vr: rnd(-0.06, 0.06), kind: Math.floor(rnd(0, 3)) }); break
        default: break
      }
      if (parts.length > 60) parts.shift()
    }

    const paintShape = () => {
      const k = size * mouse.grow
      const { x, y } = mouse
      switch (style) {
        case 'dot': ctx.fillStyle = rgba(alpha); ctx.beginPath(); ctx.arc(x, y, k / 2, 0, 6.3); ctx.fill(); break
        case 'ring': ctx.strokeStyle = rgba(alpha); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, k / 2, 0, 6.3); ctx.stroke(); ctx.fillStyle = rgba(alpha); ctx.beginPath(); ctx.arc(mouse.tx, mouse.ty, 2.5, 0, 6.3); ctx.fill(); break
        case 'glow': { const g = ctx.createRadialGradient(x, y, 0, x, y, k); g.addColorStop(0, rgba(alpha)); g.addColorStop(0.35, rgba(alpha * 0.45)); g.addColorStop(1, rgba(0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, k, 0, 6.3); ctx.fill(); break }
        case 'spotlight': { const R = k * 3; const g = ctx.createRadialGradient(x, y, 0, x, y, R); g.addColorStop(0, rgba(alpha * 0.5)); g.addColorStop(0.5, rgba(alpha * 0.2)); g.addColorStop(1, rgba(0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, 6.3); ctx.fill(); break }
        case 'water': {
          const g = ctx.createRadialGradient(x - k * 0.15, y - k * 0.2, k * 0.05, x, y, k / 2)
          g.addColorStop(0, 'rgba(255,255,255,0.85)'); g.addColorStop(0.35, rgba(alpha * 0.55)); g.addColorStop(1, rgba(alpha * 0.9))
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, k / 2, 0, 6.3); ctx.fill()
          ctx.strokeStyle = rgba(alpha); ctx.lineWidth = 1.2; ctx.stroke()
          break
        }
        case 'blob': {
          const sp = Math.min(1.8, Math.hypot(mouse.vx, mouse.vy) / 30)
          const ang = Math.atan2(mouse.vy, mouse.vx)
          ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(1 + sp * 0.5, 1 - sp * 0.2)
          ctx.fillStyle = rgba(alpha); ctx.beginPath(); ctx.arc(0, 0, k / 2, 0, 6.3); ctx.fill(); ctx.restore(); break
        }
        case 'crosshair': {
          ctx.strokeStyle = rgba(alpha); ctx.lineWidth = 1.5; const r = k / 2
          ctx.beginPath(); ctx.arc(x, y, r * 0.45, 0, 6.3); ctx.moveTo(x - r, y); ctx.lineTo(x - r * 0.45, y); ctx.moveTo(x + r * 0.45, y); ctx.lineTo(x + r, y)
          ctx.moveTo(x, y - r); ctx.lineTo(x, y - r * 0.45); ctx.moveTo(x, y + r * 0.45); ctx.lineTo(x, y + r); ctx.stroke(); break
        }
        case 'emoji': ctx.globalAlpha = alpha; ctx.font = `${k}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText((settings.emoji || '✦').slice(0, 4), x, y); ctx.globalAlpha = 1; break
        case 'image': if (img?.complete && img.naturalWidth) { ctx.globalAlpha = alpha; ctx.drawImage(img, x - k / 2, y - k / 2, k, k * (img.naturalHeight / img.naturalWidth)); ctx.globalAlpha = 1 } break
        default: break
      }
    }

    const tick = (now: number) => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      const ease = 1 - smooth * 0.92
      const px = mouse.x, py = mouse.y
      mouse.x += (mouse.tx - mouse.x) * ease
      mouse.y += (mouse.ty - mouse.y) * ease
      mouse.vx = mouse.x - px; mouse.vy = mouse.y - py
      mouse.grow += (mouse.tgrow - mouse.grow) * 0.2
      ctx.globalCompositeOperation = settings.blend === 'normal' ? 'source-over' : settings.blend
      if (mouse.seen && mouse.active) {
        if (style === 'comet') {
          history.push({ x: mouse.x, y: mouse.y })
          while (history.length > Math.max(2, maxTrail)) history.shift()
        } else if (now - lastSpawn > 55 - Math.min(35, maxTrail)) {
          lastSpawn = now
          if (Math.hypot(mouse.vx, mouse.vy) > 0.4 || style === 'ripple' || style === 'water') {
            if (style === 'water') { if (Math.random() < 0.25) parts.push({ x: mouse.x, y: mouse.y, vx: 0, vy: 0, r: size * 0.3, life: 1, rot: 0, vr: 0 }) } else spawn(mouse.x, mouse.y)
          }
        }
      } else if (style === 'comet' && history.length) history.shift()
      const cap = Math.max(8, maxTrail * 2)
      while (parts.length > cap && style !== 'seasonal') parts.shift()

      for (let i = parts.length - 1; i >= 0; i--) {
        const q = parts[i]
        q.x += q.vx; q.y += q.vy; q.rot += q.vr
        q.life -= style === 'ripple' || style === 'water' ? 0.02 : style === 'seasonal' ? 0.01 : 0.018
        if (q.life <= 0) { parts.splice(i, 1); continue }
        if (style === 'ripple' || style === 'water') {
          q.r += size / 40 + 0.6
          ctx.strokeStyle = rgba(q.life * alpha * 0.7); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 6.3); ctx.stroke()
        } else if (style === 'bubbles') {
          ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 6.3)
          ctx.fillStyle = rgba(q.life * 0.22 * alpha); ctx.strokeStyle = rgba(q.life * 0.8 * alpha); ctx.lineWidth = 1.2; ctx.fill(); ctx.stroke()
        } else if (style === 'sparkles') { ctx.fillStyle = rgba(q.life * alpha); star(q.x, q.y, q.r, q.rot) }
        else if (style === 'seasonal') {
          q.x += Math.sin(now / 500 + q.rot) * 0.3
          if (season === 'winter') { ctx.fillStyle = `rgba(255,255,255,${q.life * alpha})`; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 6.3); ctx.fill() }
          else if (season === 'summer') { ctx.fillStyle = `rgba(246,200,80,${q.life * alpha})`; star(q.x, q.y, q.r, q.rot) }
          else { const c = season === 'spring' ? ['243,156,171', '255,214,224', '147,195,131'] : ['196,98,45', '214,150,60', '150,70,30']; ctx.fillStyle = `rgba(${c[q.kind ?? 0]},${q.life * alpha})`; petal(q.x, q.y, q.r, q.rot) }
        }
      }

      if (style === 'comet' && history.length > 1) {
        for (let i = 1; i < history.length; i++) {
          const t = i / history.length
          ctx.strokeStyle = rgba(t * alpha); ctx.lineWidth = Math.max(1, t * size * 0.35); ctx.lineCap = 'round'
          ctx.beginPath(); ctx.moveTo(history[i - 1].x, history[i - 1].y); ctx.lineTo(history[i].x, history[i].y); ctx.stroke()
        }
        ctx.fillStyle = rgba(alpha); ctx.beginPath(); ctx.arc(mouse.x, mouse.y, Math.max(2, size * 0.18), 0, 6.3); ctx.fill()
      }
      if (shape && mouse.seen && mouse.active) paintShape()
      ctx.globalCompositeOperation = 'source-over'

      const moving = Math.hypot(mouse.tx - mouse.x, mouse.ty - mouse.y) > 0.3
      if (parts.length || history.length > 1 || moving || performance.now() - idleSince < 120 || (shape && mouse.seen && mouse.active)) {
        // Shape styles only need frames while moving; stop one beat after they settle.
        if (shape && !parts.length && !moving && performance.now() - idleSince > 120) { frame = 0; return }
        frame = requestAnimationFrame(tick)
      } else { frame = 0; ctx.clearRect(0, 0, window.innerWidth, window.innerHeight) }
    }
    const wake = () => { idleSince = performance.now(); if (!frame) frame = requestAnimationFrame(tick) }

    const inScope = (t: EventTarget | null) => settings.scope === 'page' || (t instanceof Element && !!t.closest('.hero'))
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      mouse.active = inScope(e.target)
      if (!mouse.seen) { mouse.x = e.clientX; mouse.y = e.clientY; mouse.seen = true }
      mouse.tx = e.clientX; mouse.ty = e.clientY
      mouse.tgrow = settings.growOnLinks && e.target instanceof Element && e.target.closest('a,button,[role=button],summary,label') ? 1.6 : 1
      wake()
    }
    const onLeave = () => { mouse.active = false; wake() }
    const onResize = () => { resize(); wake() }
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    window.addEventListener('resize', onResize)
    if (shape && settings.hideNativeCursor) document.documentElement.setAttribute('data-cursor-hide', '')
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('resize', onResize)
      document.documentElement.removeAttribute('data-cursor-hide')
      cancelAnimationFrame(frame)
    }
  }, [settings, rgb, season, imageSrc])

  return <canvas ref={ref} className="cursorfx" aria-hidden />
}

/** Small ripple where a touch screen is tapped. Respects reduced motion by being mounted only when allowed. */
export function TouchRipple({ rgb }: { rgb: string }) {
  useEffect(() => {
    const onTap = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return
      const d = document.createElement('span')
      d.className = 'tapripple'
      d.style.left = `${e.clientX}px`; d.style.top = `${e.clientY}px`; d.style.setProperty('--rgb', rgb)
      document.body.appendChild(d)
      window.setTimeout(() => d.remove(), 700)
    }
    window.addEventListener('pointerdown', onTap, { passive: true })
    return () => window.removeEventListener('pointerdown', onTap)
  }, [rgb])
  return null
}
