import { useEffect, useRef, useState } from 'react'
import { ChevronsDown, Smartphone } from 'lucide-react'
import { useContent } from '../../hooks/useContent'
import { useMotion } from '../../hooks/useMotion'
import { useScrollVar } from '../../hooks/useScrollVar'
import { useStageInteraction } from '../../hooks/useStageInteraction'
import { HeroScene } from './HeroScene'
import { TideCanvas } from './TideCanvas'

export function Hero() {
  const { content } = useContent()
  const { portfolio } = content
  const { reduced, finePointer } = useMotion()
  const root = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const [tapped, setTapped] = useState(false)
  const [motionOn, setMotionOn] = useState(false)
  const [canMotion, setCanMotion] = useState(false)

  useScrollVar(root, !reduced)
  const { tideOn, tilt, ...handlers } = useStageInteraction(stage, { enabled: !reduced, radius: finePointer ? 190 : 120 })

  useEffect(() => {
    setCanMotion(!reduced && !finePointer && typeof DeviceOrientationEvent !== 'undefined')
  }, [reduced, finePointer])

  useEffect(() => {
    if (!motionOn) return
    const onOrient = (e: DeviceOrientationEvent) => {
      const x = Math.max(-20, Math.min(20, (e.gamma ?? 0) * 0.6))
      const y = Math.max(-14, Math.min(14, ((e.beta ?? 45) - 45) * -0.4))
      tilt(x, y)
    }
    window.addEventListener('deviceorientation', onOrient)
    return () => window.removeEventListener('deviceorientation', onOrient)
  }, [motionOn, tilt])

  const enableMotion = async () => {
    const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
    try {
      if (typeof DOE.requestPermission === 'function') {
        if ((await DOE.requestPermission()) !== 'granted') return
      }
      setMotionOn(true)
    } catch {
      setMotionOn(false)
    }
  }

  const onTap = () => {
    if (reduced) return
    setTapped(true)
    window.setTimeout(() => setTapped(false), 650)
  }

  return (
    <section ref={root} id="top" className={`hero ${reduced ? 'hero--static' : ''}`} aria-label="Introduction">
      <div
        ref={stage}
        className={`hero__stage ${tapped ? 'is-tapped' : ''}`}
        onClick={onTap}
        {...handlers}
      >
        <div className="hero__sun" aria-hidden />
        <HeroScene portfolio={portfolio} />
        {!reduced && (
          <div className={`tide ${tideOn ? 'is-on' : ''}`} aria-hidden inert>
            <div className="tide__clip">
              <div className="tide__bg" />
              {finePointer && <TideCanvas active={tideOn} />}
              <div className="tide__moon" />
              <HeroScene portfolio={portfolio} tide />
            </div>
            <div className="tide__ring" />
          </div>
        )}
        <div className="hero__hint" aria-hidden>
          <span>Scroll</span>
          <ChevronsDown size={18} />
        </div>
        {canMotion && !motionOn && (
          <button type="button" className="hero__motion btn btn--ghost" onClick={(e) => { e.stopPropagation(); void enableMotion() }}>
            <Smartphone size={16} aria-hidden /> Tilt with my phone
          </button>
        )}
      </div>
    </section>
  )
}
