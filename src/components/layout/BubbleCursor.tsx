import { useEffect, useRef } from 'react'

interface Bubble { x: number; y: number; r: number; vy: number; vx: number; life: number }

/** Optional desktop bubble trail. Draws only while bubbles are alive. */
export function BubbleCursor() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const bubbles: Bubble[] = []
    let frame = 0
    let last = 0
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i]
        b.y -= b.vy
        b.x += b.vx
        b.life -= 0.018
        if (b.life <= 0) {
          bubbles.splice(i, 1)
          continue
        }
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(42,141,176,${b.life * 0.7})`
        ctx.fillStyle = `rgba(169,220,235,${b.life * 0.25})`
        ctx.lineWidth = 1.2
        ctx.fill()
        ctx.stroke()
      }
      frame = bubbles.length ? requestAnimationFrame(tick) : 0
      if (!bubbles.length) ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.timeStamp - last < 55) return
      last = e.timeStamp
      bubbles.push({ x: e.clientX, y: e.clientY, r: 2 + Math.random() * 5, vy: 0.6 + Math.random() * 0.9, vx: (Math.random() - 0.5) * 0.6, life: 1 })
      if (bubbles.length > 28) bubbles.shift()
      if (!frame) frame = requestAnimationFrame(tick)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(frame)
    }
  }, [])
  return <canvas ref={ref} className="bubbles" aria-hidden />
}
