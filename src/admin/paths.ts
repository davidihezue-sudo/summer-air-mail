/** Immutable get/set by dot path. Numeric segments index arrays. */
export function getIn(obj: unknown, path: string): unknown {
  if (!path) return obj
  let cur: unknown = obj
  for (const key of path.split('.')) {
    if (cur === null || cur === undefined) return undefined
    cur = (cur as Record<string, unknown>)[key]
  }
  return cur
}

export function setIn<T>(obj: T, path: string, value: unknown): T {
  if (!path) return value as T
  const [head, ...rest] = path.split('.')
  const isIndex = /^\d+$/.test(head)
  const base: unknown = obj ?? (isIndex ? [] : {})
  const copy: unknown = Array.isArray(base) ? [...base] : { ...(base as object) }
  ;(copy as Record<string, unknown>)[head] = rest.length ? setIn((copy as Record<string, unknown>)[head], rest.join('.'), value) : value
  return copy as T
}

export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length || from === to) return list
  const copy = [...list]
  const [x] = copy.splice(from, 1)
  copy.splice(to, 0, x)
  return copy
}
