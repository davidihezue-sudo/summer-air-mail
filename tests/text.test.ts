import { describe, expect, it } from 'vitest'
import {
  buildEnquiryMessage, formatBudget, hasValue, mailtoUrl, safeHref, validateEnquiry, visibleStats, whatsappUrl,
} from '../src/utils/text'
import { portfolio } from '../src/content/portfolio.config'

describe('hasValue', () => {
  it('rejects empty and bracketed placeholders', () => {
    expect(hasValue('')).toBe(false)
    expect(hasValue('   ')).toBe(false)
    expect(hasValue('[Add your bio]')).toBe(false)
    expect(hasValue('Real text')).toBe(true)
    expect(hasValue(null)).toBe(false)
  })
})

describe('contact links', () => {
  it('encodes WhatsApp messages using digits only', () => {
    const url = whatsappUrl('+44 (0)7700 900123', 'Hello & welcome\nLine 2')
    expect(url).toBe('https://wa.me/4407700900123?text=Hello%20%26%20welcome%0ALine%202')
  })
  it('refuses invalid WhatsApp numbers', () => {
    expect(whatsappUrl('', 'x')).toBe('')
    expect(whatsappUrl('12', 'x')).toBe('')
  })
  it('builds a correctly encoded mailto', () => {
    const url = mailtoUrl('a@b.co', 'Job: Sam', 'Hi there\nBye')
    expect(url).toBe('mailto:a@b.co?subject=Job%3A%20Sam&body=Hi%20there%0ABye')
    expect(mailtoUrl('not-an-email', 's', 'b')).toBe('')
  })
  it('blocks unsafe link protocols', () => {
    expect(safeHref('javascript:alert(1)')).toBe('')
    expect(safeHref('https://example.com')).toBe('https://example.com')
    expect(safeHref('[placeholder]')).toBe('')
    expect(safeHref('')).toBe('')
  })
})

describe('enquiry form', () => {
  const ok = { name: 'Sam', email: 'sam@example.com', company: '', enquiryType: 'Freelance project', service: '', budget: '', message: 'I would like to talk.' }
  it('validates required fields', () => {
    expect(validateEnquiry(ok)).toEqual({})
    const errs = validateEnquiry({ ...ok, name: '', email: 'bad', message: 'hi', enquiryType: '' })
    expect(Object.keys(errs).sort()).toEqual(['email', 'enquiryType', 'message', 'name'])
  })
  it('includes optional fields only when supplied', () => {
    const msg = buildEnquiryMessage({ ...ok, company: 'Acme', budget: '£500 to £1,000' }, 'Alex')
    expect(msg).toContain('Company: Acme')
    expect(msg).toContain('Budget: £500 to £1,000')
    expect(msg).not.toContain('Service of interest')
  })
})

describe('currency', () => {
  it('formats GBP and CAD ranges', () => {
    expect(formatBudget({ min: 500, max: 1000 }, 'en-GB', 'GBP')).toBe('£500 to £1,000')
    expect(formatBudget({ min: 5000, max: null }, 'en-CA', 'CAD')).toContain('5,000+')
    expect(formatBudget({ min: 5000, max: null }, 'en-CA', 'CAD')).toMatch(/\$/)
  })
})

describe('statistics', () => {
  it('never shows empty or zero stats', () => {
    expect(visibleStats(portfolio)).toEqual([])
    const p = { ...portfolio, profile: { ...portfolio.profile, yearsExperience: 4 }, stats: [{ key: 'a', label: 'A', value: 0 }, { key: 'b', label: 'B', value: 7 }] }
    const keys = visibleStats(p).map((s) => s.key)
    expect(keys).toEqual(['years', 'b'])
  })
})
