import { useEffect, useRef } from 'react'

/** Canvas moonlit water. Renders only while the Night Tide circle is open. */
export function TideCanvas({ active }: { active: boolean }) {
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
    const draw = (t: number) => {
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
        for (let x = 0; x <= w; x += 6) {
          const y = y0 + Math.sin(x * 0.03 + time * (0.8 + i * 0.15) + i) * (3 + i * 1.2)
          ctx.lineTo(x, y)
        }
        ctx.lineTo(w, h)
        ctx.closePath()
        ctx.fillStyle = `rgba(${40 + i * 8}, ${110 + i * 10}, ${170 + i * 8}, ${0.1 + i * 0.03})`
        ctx.fill()
      }
      // Moon reflection: a vertical shimmer of short bright dashes.
      const mx = w * 0.78
      for (let i = 0; i < 26; i++) {
        const y = h * 0.34 + i * (h * 0.024)
        const span = (6 + i * 1.6) * (0.6 + 0.4 * Math.sin(time * 2 + i))
        ctx.fillStyle = `rgba(235,245,255,${0.5 - i * 0.017})`
        ctx.fillRect(mx - span / 2 + Math.sin(time + i) * 3, y, span, 1.5)
      }
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
    }
  }, [active])

  return <canvas ref={ref} className="tide__canvas" aria-hidden />
}
