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
  lines.push(`Enquiry: ${v.enquiryType}`)
  if (v.service) lines.push(`Service of interest: ${v.service}`)
  if (v.budget) lines.push(`Budget: ${v.budget}`)
  return lines.join('\n')
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
