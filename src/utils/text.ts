import type { Portfolio } from '../content/types'

/** True when a value is real content: not empty and not a "[placeholder]". */
export function hasValue(value: string | null | undefined): value is string {
  if (!value) return false
  const v = value.trim()
  if (!v) return false
  return !(v.startsWith('[') && v.endsWith(']'))
}

export function isPlaceholder(value: string | null | undefined): boolean {
  return !!value && value.trim().startsWith('[') && value.trim().endsWith(']')
}

/** Only allow web, mail and phone links to be rendered as hrefs. */
export function safeHref(url: string | undefined | null): string {
  if (!hasValue(url)) return ''
  try {
    const u = new URL(url, 'https://example.invalid')
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(u.protocol) ? url : ''
  } catch {
    return ''
  }
}

export function whatsappDigits(number: string): string {
  return (number || '').replace(/\D/g, '')
}

export function whatsappUrl(number: string, message: string): string {
  const digits = whatsappDigits(number)
  if (digits.length < 7 || digits.length > 15) return ''
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export function mailtoUrl(to: string, subject: string, body: string): string {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return ''
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export function formatMoney(amount: number, locale: string, currency: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
  } catch {
    return `${currency} ${amount}`
  }
}

export function formatBudget(
  range: { min: number; max: number | null },
  locale: string,
  currency: string,
): string {
  const min = formatMoney(range.min, locale, currency)
  return range.max === null ? `${min}+` : `${min} to ${formatMoney(range.max, locale, currency)}`
}

export interface EnquiryValues {
  name: string
  email: string
  company: string
  /** Role being recruited for. Only used for recruiter enquiries. */
  role: string
  enquiryType: string
  service: string
  budget: string
  message: string
}

export type EnquiryErrors = Partial<Record<keyof EnquiryValues, string>>

export function validateEnquiry(v: EnquiryValues): EnquiryErrors {
  const errors: EnquiryErrors = {}
  if (v.name.trim().length < 2) errors.name = 'Please enter your name.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) errors.email = 'Please enter a valid email address.'
  if (!v.enquiryType) errors.enquiryType = 'Please choose what your enquiry is about.'
  if (v.message.trim().length < 10) errors.message = 'Please write a short message (at least 10 characters).'
  if (v.message.length > 3000) errors.message = 'Please keep your message under 3,000 characters.'
  return errors
}

export function buildEnquiryMessage(v: EnquiryValues, ownerName: string): string {
  const lines = [
    `Hello ${ownerName},`,
    '',
    v.message.trim(),
    '',
    `Name: ${v.name.trim()}`,
    `Email: ${v.email.trim()}`,
  ]
  if (v.company.trim()) lines.push(`Company: ${v.company.trim()}`)
  if (v.role.trim()) lines.push(`Role: ${v.role.trim()}`)
  lines.push(`Enquiry: ${v.enquiryType}`)
  if (v.service) lines.push(`Service of interest: ${v.service}`)
  if (v.budget) lines.push(`Budget: ${v.budget}`)
  return lines.join('\n')
}

/** CV link only when a file is configured and the button is enabled. */
export function cvLink(p: Portfolio): { href: string; filename: string; label: string } | null {
  if (!p.cv.enabled || !hasValue(p.profile.cvFile)) return null
  const href = safeHref(p.profile.cvFile)
  if (!href) return null
  const base = p.cv.filename.trim() || p.profile.cvFile.split('/').pop() || 'cv.pdf'
  const filename = /\.[a-z0-9]{2,4}$/i.test(base) ? base : `${base}.pdf`
  return { href, filename: filename.replace(/[^\w.\- ]/g, ''), label: 'Download CV' }
}

export type VideoSource =
  | { kind: 'file'; src: string }
  | { kind: 'youtube'; id: string }
  | { kind: 'vimeo'; id: string }
  | { kind: 'external'; src: string }
  | { kind: 'none' }

/** Classifies a video URL. Only direct files and YouTube/Vimeo are played in the page; everything else is a link. */
export function parseVideo(url: string | undefined): VideoSource {
  if (!hasValue(url)) return { kind: 'none' }
  const u = (url as string).trim()
  if (/^\/[^\s]+\.(mp4|webm)(\?.*)?$/i.test(u)) return { kind: 'file', src: u }
  try {
    const parsed = new URL(u)
    if (!['https:', 'http:'].includes(parsed.protocol)) return { kind: 'none' }
    const host = parsed.hostname.replace(/^www\./, '')
    if (/\.(mp4|webm)$/i.test(parsed.pathname)) return { kind: 'file', src: u }
    if (host === 'youtu.be') return /^[\w-]{6,15}$/.test(parsed.pathname.slice(1)) ? { kind: 'youtube', id: parsed.pathname.slice(1) } : { kind: 'external', src: u }
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      const v = parsed.searchParams.get('v') ?? parsed.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{6,15})/)?.[1]
      if (v && /^[\w-]{6,15}$/.test(v)) return { kind: 'youtube', id: v }
    }
    if (host === 'vimeo.com') {
      const id = parsed.pathname.match(/^\/(\d{5,12})/)?.[1]
      if (id) return { kind: 'vimeo', id }
    }
    return { kind: 'external', src: u }
  } catch {
    return { kind: 'none' }
  }
}

export function visibleStats(p: Portfolio) {
  const stats = p.stats.filter((s) => typeof s.value === 'number' && s.value > 0)
  const years = p.profile.yearsExperience
  if (typeof years === 'number' && years > 0 && !stats.some((s) => s.key === 'years')) {
    stats.unshift({ key: 'years', label: 'Years of experience', value: years, suffix: '+' })
  }
  return stats
}

/** Small spelling switch for built-in interface copy. */
export function spelling(locale: string) {
  const us = locale.toLowerCase() === 'en-us'
  return {
    colour: us ? 'color' : 'colour',
    organisation: us ? 'organization' : 'organisation',
    programme: us ? 'program' : 'programme',
  }
}

export function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
