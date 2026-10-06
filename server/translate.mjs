// Free machine translation through MyMemory (api.mymemory.translated.net). It needs no key or account. Anonymous use is limited to
// about 5,000 characters a day; giving an email address raises that to about 50,000. The site's own text is sent to that service.

const ENDPOINT = 'https://api.mymemory.translated.net/get'
const LANG = /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/
const MAX_PIECE = 450

export const validLang = (s) => typeof s === 'string' && LANG.test(s)
export const validEmail = (s) => typeof s === 'string' && s.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
/** The service sometimes sends back HTML entities such as &#39; for an apostrophe. */
export const decodeEntities = (s) => String(s)
  .replace(/&#(\d+);/g, (_m, n) => String.fromCodePoint(Math.min(Number(n), 0x10ffff)))
  .replace(/&#x([0-9a-f]+);/gi, (_m, n) => String.fromCodePoint(Math.min(parseInt(n, 16), 0x10ffff)))
  .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m)

/** Split into pieces the service accepts (500 bytes), at sentence ends where possible, never in the middle of a word. */
export function chunk(text, max = MAX_PIECE) {
  const out = []
  let rest = String(text).trim()
  while (Buffer.byteLength(rest) > max) {
    let cut = Math.min(rest.length, max)
    while (Buffer.byteLength(rest.slice(0, cut)) > max) cut -= 10
    const head = rest.slice(0, cut)
    const at = Math.max(head.lastIndexOf('. '), head.lastIndexOf('? '), head.lastIndexOf('! '), head.lastIndexOf('; '), head.lastIndexOf(', '), head.lastIndexOf(' '))
    const end = at > max / 3 ? at + 1 : cut
    out.push(rest.slice(0, end).trim())
    rest = rest.slice(end).trim()
  }
  if (rest) out.push(rest)
  return out
}

const fail = (message, status) => Object.assign(new Error(message), { status })

export function createTranslate({ fetchImpl = globalThis.fetch } = {}) {
  async function piece(q, from, to, email) {
    const url = new URL(ENDPOINT)
    url.searchParams.set('q', q)
    url.searchParams.set('langpair', `${from}|${to}`)
    if (email) url.searchParams.set('de', email)
    let res
    try { res = await fetchImpl(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(20000) }) } catch { throw fail('The free translation service could not be reached. Try again in a minute.', 502) }
    if (res.status === 429) throw fail('The free translation service says you have used today\'s allowance. Add your email address to raise it, or try again tomorrow.', 429)
    if (!res.ok) throw fail('The free translation service had a problem. Try again in a minute.', 502)
    const j = await res.json().catch(() => null)
    const text = j?.responseData?.translatedText
    if (j?.quotaFinished || /MYMEMORY WARNING|USED ALL AVAILABLE FREE TRANSLATIONS/i.test(String(text ?? ''))) throw fail('You have used today\'s free translation allowance. Add your email address to raise it from about 5,000 to about 50,000 characters a day, or continue tomorrow.', 429)
    if (typeof text !== 'string' || !text.trim() || (j.responseStatus && Number(j.responseStatus) !== 200)) throw fail(`The free translation service could not translate: ${String(j?.responseDetails ?? 'no answer').slice(0, 120)}`, 502)
    return decodeEntities(text).trim()
  }
  return {
    /**
     * Translate each text in order. Long texts are cut into pieces and joined again.
     * @param {string[]} texts
     * @param {{ from: string, to: string, email?: string }} opts
     */
    async texts(texts, { from, to, email = '' }) {
      if (!validLang(from) || !validLang(to)) throw fail('Choose a language code such as fr or es.', 400)
      const out = []
      for (const t of texts) {
        const parts = chunk(t)
        const done = []
        for (const part of parts) done.push(await piece(part, from, to, validEmail(email) ? email : ''))
        out.push(done.join(' '))
      }
      return out
    },
  }
}
