import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { PostMark } from '../ui/art'

const KEY = 'sam-intro-seen'

function alreadySeen() {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

/** Postmark stamp-down intro. About 1.4 seconds, once per session, skipped for reduced motion. */
export function Loader({ name, label, skip }: { name: string; label: string; skip: boolean }) {
  const [show, setShow] = useState(() => !skip && !alreadySeen())
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!show) return
    try {
      sessionStorage.setItem(KEY, '1')
    } catch {
      /* storage unavailable: loader may replay, which is harmless */
    }
    const t1 = window.setTimeout(() => setLeaving(true), 1000)
    const t2 = window.setTimeout(() => setShow(false), 1450)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [show])

  if (!show) return null
  return (
    <div className={`loader ${leaving ? 'is-leaving' : ''}`} aria-hidden>
      <motion.div
        className="loader__mark"
        initial={{ scale: 1.8, rotate: -16, opacity: 0 }}
        animate={{ scale: 1, rotate: -6, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 11, mass: 0.9 }}
      >
        <PostMark name={name} label={label} />
        <span className="loader__name">{name}</span>
        <svg className="loader__lines" viewBox="0 0 300 60" aria-hidden>
          {[10, 24, 38, 52].map((y, i) => (
            <motion.path
              key={y}
              d={`M0 ${y}c25-8 50 8 75 0s50-8 75 0 50 8 75 0 50-8 75 0`}
              stroke="var(--c-red)"
              strokeWidth="2.5"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.25 + i * 0.07, duration: 0.5 }}
            />
          ))}
        </svg>
      </motion.div>
    </div>
  )
}
