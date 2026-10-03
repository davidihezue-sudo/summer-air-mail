import { useCallback, useEffect, useState } from 'react'

function parse() {
  const [page = 'dashboard', id] = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent)
  return { page: page || 'dashboard', id }
}

/** Tiny hash router: #/projects or #/projects/<id>. No dependency needed. */
export function useRoute() {
  const [route, setRoute] = useState(parse)
  useEffect(() => {
    const on = () => { setRoute(parse()); window.scrollTo({ top: 0 }) }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const go = useCallback((path: string) => { location.hash = `#/${path}` }, [])
  return { ...route, go }
}
