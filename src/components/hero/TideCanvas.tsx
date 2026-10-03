import { useEffect, useRef } from 'react'
import type { TideMode } from '../../themes/types'

/** Canvas moonlit water. Renders only while the Night Tide circle is open. */
export function TideCanvas({ active, mode = 'water' }: { active: boolean; mode?: TideMode }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !active) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const scale = 0.5
    const resize = () => {
      canvas.width = Math.max(2, Math.round(canvas.clientWidth * scale))
      canvas.height = Math.max(2, Math.round(canvas.clientHeight * scale))
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    let frame = 0
    const drawers: Record<TideMode, (t: number) => void> = {
      water: (t) => {
        const { width: w, height: h } = canvas
        const g = ctx.createLinearGradient(0, 0, 0, h)
        g.addColorStop(0, '#0b1d33')
        g.addColorStop(1, '#0f3150')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)
        const time = t / 1000
        for (let i = 0; i < 7; i++) {
          const y0 = h * (0.3 + i * 0.1)
          ctx.beginPath()
          ctx.moveTo(0, h)
          for (let x = 0; x <= w; x += 6) ctx.lineTo(x, y0 + Math.sin(x * 0.03 + time * (0.8 + i * 0.15) + i) * (3 + i * 1.2))
          ctx.lineTo(w, h)
          ctx.closePath()
          ctx.fillStyle = `rgba(${40 + i * 8}, ${110 + i * 10}, ${170 + i * 8}, ${0.1 + i * 0.03})`
          ctx.fill()
        }
        const mx = w * 0.78
        for (let i = 0; i < 26; i++) {
          const span = (6 + i * 1.6) * (0.6 + 0.4 * Math.sin(time * 2 + i))
          ctx.fillStyle = `rgba(235,245,255,${0.5 - i * 0.017})`
          ctx.fillRect(mx - span / 2 + Math.sin(time + i) * 3, h * 0.34 + i * (h * 0.024), span, 1.5)
        }
      },
      // Spring: dewy morning light, soft drifting bokeh.
      dew: (t) => {
        const { width: w, height: h } = canvas
        const g = ctx.createLinearGradient(0, 0, w, h)
        g.addColorStop(0, '#16352f')
        g.addColorStop(1, '#244b3c')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)
        const time = t / 1000
        for (let i = 0; i < 26; i++) {
          const x = ((i * 97) % 100) / 100 * w + Math.sin(time * 0.4 + i) * 12
          const y = (((i * 53) % 100) / 100) * h + Math.cos(time * 0.3 + i * 2) * 10
          const r = (10 + (i % 5) * 7) * 0.5
          const rg = ctx.createRadialGradient(x, y, 0, x, y, r)
          rg.addColorStop(0, `rgba(255,236,200,${0.35 + 0.15 * Math.sin(time + i)})`)
          rg.addColorStop(1, 'rgba(255,236,200,0)')
          ctx.fillStyle = rg
          ctx.beginPath()
          ctx.arc(x, y, r, 0, Math.PI * 2)
          ctx.fill()
        }
      },
      // Autumn: embers rising from warm dark.
      embers: (t) => {
        const { width: w, height: h } = canvas
        const g = ctx.createLinearGradient(0, h, 0, 0)
        g.addColorStop(0, '#3a1a12')
        g.addColorStop(1, '#170b09')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)
        const time = t / 1000
        for (let i = 0; i < 40; i++) {
          const life = ((time * 0.12 + i * 0.137) % 1)
          const x = ((i * 71) % 100) / 100 * w + Math.sin(time + i) * 10
          const y = h * (1 - life)
          ctx.fillStyle = `rgba(${230 + (i % 3) * 8}, ${120 + (i % 4) * 20}, 40, ${(1 - life) * 0.8})`
          ctx.fillRect(x, y, 2, 2)
        }
      },
      // Winter: slow aurora ribbons and falling snow on deep navy.
      frost: (t) => {
        const { width: w, height: h } = canvas
        ctx.fillStyle = '#0a1626'
        ctx.fillRect(0, 0, w, h)
        const time = t / 1000
        for (let b = 0; b < 3; b++) {
          ctx.beginPath()
          ctx.moveTo(0, h * 0.5)
          for (let x = 0; x <= w; x += 8) ctx.lineTo(x, h * (0.25 + b * 0.1) + Math.sin(x * 0.02 + time * 0.5 + b * 2) * 14)
          ctx.lineTo(w, h * 0.7)
          ctx.lineTo(0, h * 0.7)
          ctx.closePath()
          ctx.fillStyle = `rgba(${90 + b * 20}, ${180 - b * 20}, ${200 + b * 15}, 0.12)`
          ctx.fill()
        }
        for (let i = 0; i < 50; i++) {
          const x = (((i * 61) % 100) / 100) * w + Math.sin(time + i) * 6
          const y = ((time * 18 + i * 37) % (h + 10)) - 5
          ctx.fillStyle = 'rgba(235,245,255,0.8)'
          ctx.fillRect(x, y, 1.6, 1.6)
        }
      },
    }
    const draw = (t: number) => {
      drawers[mode](t)
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
    }
  }, [active, mode])

  return <canvas ref={ref} className="tide__canvas" aria-hidden />
}
