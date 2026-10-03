import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

interface Options {
  enabled: boolean
  /** Radius of the Night Tide circle in px. */
  radius: number
}

/**
 * Drives the hero stamp tilt and the Night Tide circle by writing CSS variables
 * (--rx --ry --tx --ty --tr) on the stage. Values are eased in one rAF loop that
 * sleeps as soon as everything has settled. No React re-render per pointer move.
 */
export function useStageInteraction(stage: RefObject<HTMLElement | null>, { enabled, radius }: Options) {
  const s = useRef({ rx: 0, ry: 0, trx: 0, try: 0, r: 0, tr: 0, running: false, frame: 0, gx: 0, gy: 0 })
  const holdTimer = useRef<number>(0)
  const startPt = useRef({ x: 0, y: 0 })
  const [tideOn, setTideOn] = useState(false)

  const loop = useCallback(() => {
    const el = stage.current
    const st = s.current
    if (!el) return
    st.rx += (st.trx - st.rx) * 0.12
    st.ry += (st.try - st.ry) * 0.12
    st.r += (st.tr - st.r) * 0.16
    el.style.setProperty('--rx', `${st.rx.toFixed(2)}deg`)
    el.style.setProperty('--ry', `${st.ry.toFixed(2)}deg`)
    el.style.setProperty('--tr', `${Math.max(0, st.r).toFixed(1)}px`)
    const settled = Math.abs(st.trx - st.rx) < 0.02 && Math.abs(st.try - st.ry) < 0.02 && Math.abs(st.tr - st.r) < 0.3
    if (settled) {
      st.running = false
      return
    }
    st.frame = requestAnimationFrame(loop)
  }, [stage])

  const wake = useCallback(() => {
    if (!s.current.running) {
      s.current.running = true
      s.current.frame = requestAnimationFrame(loop)
    }
  }, [loop])

  const aim = useCallback(
    (clientX: number, clientY: number) => {
      const el = stage.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const nx = (clientX - rect.left) / rect.width - 0.5
      const ny = (clientY - rect.top) / rect.height - 0.5
      s.current.try = nx * 20
      s.current.trx = -ny * 14
      el.style.setProperty('--tx', `${clientX - rect.left}px`)
      el.style.setProperty('--ty', `${clientY - rect.top}px`)
      el.style.setProperty('--mx', `${((nx + 0.5) * 100).toFixed(1)}%`)
      el.style.setProperty('--my', `${((ny + 0.5) * 100).toFixed(1)}%`)
      wake()
    },
    [stage, wake],
  )

  const rest = useCallback(() => {
    window.clearTimeout(holdTimer.current)
    s.current.trx = 0
    s.current.try = 0
    s.current.tr = 0
    setTideOn(false)
    wake()
  }, [wake])

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled) return
      if (e.pointerType === 'touch') {
        if (holdTimer.current && Math.hypot(e.clientX - startPt.current.x, e.clientY - startPt.current.y) > 12) {
          window.clearTimeout(holdTimer.current)
          holdTimer.current = 0
        }
        aim(e.clientX, e.clientY)
        return
      }
      aim(e.clientX, e.clientY)
      s.current.tr = radius
      setTideOn(true)
    },
    [aim, enabled, radius],
  )

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled || e.pointerType !== 'touch') return
      startPt.current = { x: e.clientX, y: e.clientY }
      aim(e.clientX, e.clientY)
      holdTimer.current = window.setTimeout(() => {
        s.current.tr = radius * 0.8
        setTideOn(true)
        wake()
      }, 280)
    },
    [aim, enabled, radius, wake],
  )

  const tilt = useCallback(
    (x: number, y: number) => {
      s.current.try = x
      s.current.trx = y
      wake()
    },
    [wake],
  )

  useEffect(() => {
    const st = s.current
    return () => {
      cancelAnimationFrame(st.frame)
      window.clearTimeout(holdTimer.current)
    }
  }, [])

  return { tideOn, onPointerMove, onPointerDown, onPointerUp: rest, onPointerLeave: rest, onPointerCancel: rest, tilt }
}
