import { useEffect, useState } from 'react'

/** Tracks which section is nearest the reading line using one IntersectionObserver. */
export function useActiveSection(ids: string[]): string {
  const [active, setActive] = useState('')
  const key = ids.join('|')
  useEffect(() => {
    const els = key.split('|').map((id) => document.getElementById(id)).filter((e): e is HTMLElement => !!e)
    if (!els.length) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [key])
  return active
}
