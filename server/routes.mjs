// Small pure helpers for the server: rate limiting and validating public form posts.
export function createLimiter({ max, windowMs }) {
  const hits = new Map()
  return (key, now = Date.now()) => {
    const h = hits.get(key)
    if (!h || now - h.first >= windowMs) { hits.set(key, { count: 1, first: now }); if (hits.size > 5000) for (const [k, v] of hits) if (now - v.first >= windowMs) hits.delete(k); return true }
    h.count++
    return h.count <= max
  }
}

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,200}\.[^\s@]{2,}$/
const str = (v, n) => String(v ?? '').replace(/\0/g, '').trim().slice(0, n)

/** A recommendation from a visitor. Needs their name, some real words and a tick agreeing it may be shown. */
export function parseEndorsement(body) {
  const b = body && typeof body === 'object' ? body : {}
  const out = { name: str(b.name, 80), role: str(b.role, 120), company: str(b.company, 120), quote: str(b.quote, 1200) }
  if (!out.name) return { error: 'Please enter your name.' }
  if (out.quote.length < 20) return { error: 'Please write a little more. A couple of sentences is plenty.' }
  if (b.consent !== true) return { error: 'Please tick the box to say your words may be shown.' }
  return { value: out, honeypot: !!str(b.website, 10), elapsed: Number(b.elapsed) || 0 }
}

export function parseContact(body) {
  const b = body && typeof body === 'object' ? body : {}
  const out = { name: str(b.name, 120), email: str(b.email, 254), type: str(b.type, 120), budget: str(b.budget, 60), company: str(b.company, 120), message: str(b.message, 5000) }
  if (!out.name) return { error: 'Please enter your name.' }
  if (!EMAIL.test(out.email)) return { error: 'Please enter a valid email address.' }
  if (out.message.length < 10) return { error: 'Please write a little more in your message.' }
  return { value: out, honeypot: !!str(b.website, 10), elapsed: Number(b.elapsed) || 0 }
}
