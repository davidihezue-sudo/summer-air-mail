const BLOCKED = new Set(['__proto__', 'constructor', 'prototype'])
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * Fills gaps in stored content with defaults without losing anything stored.
 * Arrays are replaced wholesale (a stored list is the owner's list), objects merge key by key,
 * and a stored value with the wrong type falls back to the default.
 */
export function mergeDefaults<T>(defaults: T, stored: unknown): T {
  if (stored === undefined) return defaults
  if (defaults === undefined) return stored as T
  if (Array.isArray(defaults)) return (Array.isArray(stored) ? stored : defaults) as T
  if (isObj(defaults)) {
    if (!isObj(stored)) return defaults
    const out: Record<string, unknown> = {}
    for (const k of Object.keys(defaults)) {
      if (BLOCKED.has(k)) continue
      out[k] = mergeDefaults((defaults as Record<string, unknown>)[k], stored[k])
    }
    for (const k of Object.keys(stored)) {
      if (BLOCKED.has(k) || k in out) continue
      out[k] = stored[k]
    }
    return out as T
  }
  if (defaults === null) return (typeof stored === 'function' ? defaults : stored) as T
  return (typeof stored === typeof defaults ? stored : defaults) as T
}
