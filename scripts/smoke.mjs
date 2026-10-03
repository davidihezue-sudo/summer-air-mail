// End to end smoke test. Usage: SHOTS=./screenshots node scripts/smoke.mjs
// Needs `npm run dev` (port 5173, for ?sample=1) and `npm run preview` (port 4173, production build) running.
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const DEV = process.env.DEV_URL ?? 'http://localhost:5173'
const PROD = process.env.PROD_URL ?? 'http://localhost:4173'
const SHOTS = process.env.SHOTS ?? './screenshots'
const exe = process.env.CHROME ?? undefined
mkdirSync(SHOTS, { recursive: true })

const failures = []
const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); if (!ok) failures.push(msg) }

const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] })

async function newPage(width, height = 800, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, ...opts })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errors.push(`${m.type()}: ${m.text()}`) })
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  return { page, errors, ctx }
}

// 1. Production default site: every width, no horizontal overflow, no console problems
for (const w of [320, 375, 390, 430, 768, 1024, 1440, 1920]) {
  const { page, errors, ctx } = await newPage(w, w < 700 ? 800 : 900)
  await page.goto(PROD)
  await page.waitForSelector('#top')
  await page.waitForTimeout(1900)
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  check(over <= 0, `prod ${w}px: no horizontal overflow (${over})`)
  await page.screenshot({ path: `${SHOTS}/prod-${w}-hero.png` })
  // scroll through the whole page to trigger reveals, then capture full page
  const h = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < h; y += 500) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(60) }
  const over2 = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  check(over2 <= 0, `prod ${w}px: no horizontal overflow after scroll (${over2})`)
  if ([390, 1440].includes(w)) await page.screenshot({ path: `${SHOTS}/prod-${w}-full.png`, fullPage: true })
  check(errors.length === 0, `prod ${w}px: clean console ${errors.join(' | ')}`)
  await ctx.close()
}

// 2. Default site hides data-driven sections
{
  const { page, ctx } = await newPage(1280)
  await page.goto(PROD); await page.waitForSelector('#top')
  for (const id of ['work', 'case-studies', 'tools', 'content', 'websites', 'testimonials', 'mentoring']) {
    check((await page.locator(`#${id}`).count()) === 0, `default: #${id} hidden without content`)
  }
  for (const id of ['overview', 'about', 'services', 'strategy', 'contact']) {
    check((await page.locator(`#${id}`).count()) === 1, `default: #${id} rendered`)
  }
  check((await page.locator('text=Download CV').count()) === 0, 'default: no CV button without a file')
  await ctx.close()
}

// 3. Sample content: interactions (dev server only)
{
  const { page, errors, ctx } = await newPage(1280, 860)
  await page.goto(`${DEV}/?sample=1`); await page.waitForSelector('#top')
  await page.waitForTimeout(1800)
  for (const id of ['work', 'case-studies', 'tools', 'content', 'websites', 'testimonials', 'mentoring', 'services']) {
    check((await page.locator(`#${id}`).count()) === 1, `sample: #${id} rendered`)
  }
  // hero scroll breakout
  await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 0.5, behavior: 'instant' })); await page.waitForTimeout(250)
  const p1 = await page.evaluate(() => getComputedStyle(document.getElementById('top')).getPropertyValue('--p'))
  check(parseFloat(p1) > 0.3 && parseFloat(p1) < 0.7, `hero --p tracks scroll (${p1})`)
  await page.screenshot({ path: `${SHOTS}/sample-hero-mid.png` })
  await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 0.98, behavior: 'instant' })); await page.waitForTimeout(250)
  await page.screenshot({ path: `${SHOTS}/sample-hero-end.png` })
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(200)
  // night tide
  await page.mouse.move(900, 400); await page.waitForTimeout(700)
  const tr = await page.evaluate(() => getComputedStyle(document.querySelector('.hero__stage')).getPropertyValue('--tr'))
  check(parseFloat(tr) > 100, `night tide opens on hover (${tr})`)
  await page.screenshot({ path: `${SHOTS}/sample-tide.png` })
  // nav
  await page.click('.header__nav >> text=Services'); await page.waitForTimeout(1500)
  check(await page.evaluate(() => document.getElementById('services').getBoundingClientRect().top < 200), 'nav scrolls to Services')
  // services dialog
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${SHOTS}/sample-services.png` })
  await page.click('.towel__item >> nth=0', { force: true })
  check(await page.locator('dialog[open] .service-detail').count() === 1, 'service dialog opens')
  await page.keyboard.press('Escape')
  check(await page.locator('dialog[open]').count() === 0, 'Escape closes dialog')
  // work filters + lightbox
  await page.evaluate(() => document.getElementById('work').scrollIntoView()); await page.waitForTimeout(500)
  await page.screenshot({ path: `${SHOTS}/sample-work.png` })
  const total = await page.locator('.polaroid').count()
  await page.click('.filters .chip >> text=Campaigns')
  check((await page.locator('.polaroid').count()) < total, 'project filter narrows results')
  await page.click('.filters .chip >> text=All Work')
  await page.click('.polaroid >> nth=0', { force: true }); await page.waitForTimeout(300)
  check(await page.locator('dialog[open] .project').count() === 1, 'project lightbox opens')
  await page.keyboard.press('ArrowRight')
  check((await page.locator('.project__count').innerText()).startsWith('2'), 'ArrowRight advances gallery')
  await page.screenshot({ path: `${SHOTS}/sample-lightbox.png` })
  await page.click('dialog[open] >> text=Read the case study'); await page.waitForTimeout(500)
  check(await page.locator('dialog[open] .case').count() === 1, 'case study opens from lightbox')
  await page.locator('.metric').first().scrollIntoViewIfNeeded(); await page.waitForTimeout(1300)
  await page.screenshot({ path: `${SHOTS}/sample-case.png` })
  await page.keyboard.press('Escape')
  // tools flip
  await page.evaluate(() => document.getElementById('tools').scrollIntoView()); await page.waitForTimeout(400)
  await page.click('.ring >> nth=0')
  check((await page.locator('.ring[aria-pressed="true"]').count()) === 1, 'tool ring flips')
  await page.screenshot({ path: `${SHOTS}/sample-tools.png` })
  await page.evaluate(() => document.getElementById('content').scrollIntoView()); await page.waitForTimeout(400)
  await page.screenshot({ path: `${SHOTS}/sample-content.png` })
  await page.evaluate(() => document.getElementById('websites').scrollIntoView()); await page.waitForTimeout(1500)
  await page.screenshot({ path: `${SHOTS}/sample-websites.png` })
  await page.evaluate(() => document.getElementById('strategy').scrollIntoView()); await page.waitForTimeout(500)
  await page.screenshot({ path: `${SHOTS}/sample-strategy.png` })
  // contact form
  await page.click('.header__nav >> text=Contact'); await page.waitForTimeout(1800)
  check(await page.evaluate(() => document.activeElement?.id === 'enquiry-name'), 'Contact link focuses the enquiry form')
  await page.click('.form button[type=submit]')
  check((await page.locator('.field__error').count()) >= 3, 'empty form shows validation errors')
  await page.fill('#enquiry-name', 'Sam Recruiter'); await page.fill('#enquiry-email', 'sam@example.com')
  await page.selectOption('#enquiry-type', { index: 1 }); await page.fill('#enquiry-message', 'We have a role you might like.')
  await page.evaluate(() => { window.__opened = null; window.open = (u) => { window.__opened = u; return null } })
  await page.check('input[name=method] >> nth=1')
  await page.click('.form button[type=submit]')
  const opened = await page.evaluate(() => window.__opened)
  check(opened?.startsWith('https://wa.me/441234567890?text=Hello%20'), `WhatsApp url encoded (${opened?.slice(0, 60)})`)
  check((await page.locator('.form__status').innerText()).includes('Nothing is sent'), 'honest status after WhatsApp')
  await page.screenshot({ path: `${SHOTS}/sample-contact.png` })
  check(errors.length === 0, `sample: clean console ${errors.slice(0, 3).join(' | ')}`)
  await ctx.close()
}

// 4. Mobile: drawer navigation + reduced motion
{
  const { page, ctx } = await newPage(390, 844, { hasTouch: true, isMobile: true })
  await page.goto(`${DEV}/?sample=1`); await page.waitForSelector('#top'); await page.waitForTimeout(1800)
  await page.click('.header__burger')
  check(await page.locator('dialog.drawer[open]').count() === 1, 'mobile drawer opens')
  await page.screenshot({ path: `${SHOTS}/mobile-drawer.png` })
  await page.click('.drawer__link >> text=About'); await page.waitForTimeout(1500)
  check(await page.locator('dialog[open]').count() === 0, 'drawer closes on selection')
  check(await page.evaluate(() => document.getElementById('about').getBoundingClientRect().top < 150), 'drawer link scrolls to section')
  await ctx.close()
}
{
  const { page, ctx } = await newPage(1280, 800, { reducedMotion: 'reduce' })
  await page.goto(PROD); await page.waitForSelector('#top')
  check(await page.locator('.loader').count() === 0, 'reduced motion: loader skipped')
  check(await page.locator('.tide').count() === 0, 'reduced motion: night tide disabled')
  await page.screenshot({ path: `${SHOTS}/reduced-hero.png` })
  await ctx.close()
}

await browser.close()
console.log(failures.length ? `\n${failures.length} FAILED` : '\nAll smoke checks passed')
process.exit(failures.length ? 1 : 0)
