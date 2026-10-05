import type { Portfolio } from '../content/types'

const esc = (s: string) => String(s ?? '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,')
const clean = (s: string | undefined) => String(s ?? '').trim()

/** A vCard 3.0 contact the visitor can save to their phone. Only details the owner has filled in are included. */
export function buildVCard(p: Pick<Portfolio, 'profile'>, siteUrl = ''): string {
  const pr = p.profile
  const full = clean(pr.fullName) || clean(pr.preferredName)
  const parts = full.split(/\s+/)
  const family = parts.length > 1 ? parts[parts.length - 1] : ''
  const given = parts.length > 1 ? parts.slice(0, -1).join(' ') : full
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `N:${esc(family)};${esc(given)};;;`, `FN:${esc(full)}`]
  if (clean(pr.title)) lines.push(`TITLE:${esc(clean(pr.title))}`)
  if (clean(pr.email)) lines.push(`EMAIL;TYPE=INTERNET:${esc(clean(pr.email))}`)
  if (clean(pr.phone)) lines.push(`TEL;TYPE=CELL:${esc(clean(pr.phone))}`)
  if (clean(pr.location)) lines.push(`ADR;TYPE=WORK:;;${esc(clean(pr.location))};;;;`)
  if (/^https?:\/\//i.test(siteUrl)) lines.push(`URL:${siteUrl}`)
  for (const [kind, url] of Object.entries(pr.social ?? {})) if (/^https?:\/\//i.test(clean(url))) lines.push(`URL;TYPE=${kind}:${clean(url)}`)
  lines.push('END:VCARD')
  return lines.join('\r\n') + '\r\n'
}
