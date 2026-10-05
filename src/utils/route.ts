export type Route =
  | { kind: 'home' }
  | { kind: 'work'; id: string }
  | { kind: 'profile' }
  | { kind: 'card' }
  | { kind: 'note'; slug: string }
  | { kind: 'application'; slug: string }
  | { kind: 'notfound' }

const dec = (s: string) => { try { return decodeURIComponent(s) } catch { return s } }

export function parseRoute(path: string): Route {
  const p = path.replace(/\/+$/, '') || '/'
  if (p === '/' || p === '/index.html') return { kind: 'home' }
  let m: RegExpExecArray | null
  if ((m = /^\/work\/([^/]+)$/.exec(p))) return { kind: 'work', id: dec(m[1]) }
  if (p === '/profile') return { kind: 'profile' }
  if (p === '/card') return { kind: 'card' }
  if ((m = /^\/notes\/([^/]+)$/.exec(p))) return { kind: 'note', slug: dec(m[1]) }
  if ((m = /^\/for\/([^/]+)$/.exec(p))) return { kind: 'application', slug: dec(m[1]) }
  return { kind: 'notfound' }
}

/** True when the page is the admin preview or a draft preview, where navigation must not change the address. */
export const isPreviewMode = () => new URLSearchParams(location.search).has('preview')

export function navigate(path: string, { replace = false } = {}) {
  if (isPreviewMode()) return
  if (replace) history.replaceState(null, '', path)
  else history.pushState(null, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export const workUrl = (id: string) => `/work/${encodeURIComponent(id)}`
