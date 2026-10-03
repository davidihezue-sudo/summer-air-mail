// Public site checks in a real browser.
//   npm run build && npm run dev   (dev server provides ?sample=1 preview data)   then   CHROME=... npm run smoke
import { chromium } from 'playwright-core'
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createApp } from '../server/index.mjs'

const DEV = process.env.DEV_URL ?? 'http://localhost:5173'
const SHOTS = process.env.SHOTS ?? './screenshots'
mkdirSync(SHOTS, { recursive: true })

const failures = []
const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); if (!ok) failures.push(msg) }

const dir = mkdtempSync(join(tmpdir(), 'sam-smoke-'))
const { app } = await createApp({ dataDir: join(dir, 'data'), distDir: resolve('dist') })
const server = await new Promise((ok) => { const s = app.listen(0, '127.0.0.1', () => ok(s)) })
const PROD = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] })

async function newPage(width, height = 800, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, ...opts })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errors.push(`${m.type()}: ${m.text()}`) })
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  return { page, errors, ctx }
}
const jump = (page, id) => page.evaluate((i) => document.getElementById(i)?.scrollIntoView({ behavior: 'instant' }), id)

// 1. Every width: no horizontal overflow, clean console. Starter content and full sample content.
for (const [label, url] of [['starter content', PROD], ['sample content', `${DEV}/?sample=1&preview=1`]]) {
  for (const w of [320, 375, 390, 430, 768, 1024, 1440, 1920]) {
    const { page, errors, ctx } = await newPage(w, w < 700 ? 800 : 900)
    await page.goto(url)
    await page.waitForSelector('#top')
    await page.waitForTimeout(1800)
    const h = await page.evaluate(() => document.documentElement.scrollHeight)
    for (let y = 0; y < h; y += 500) { await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), y); await page.waitForTimeout(40) }
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    check(over <= 0, `${label} ${w}px: no horizontal overflow (${over})`)
    check(errors.length === 0, `${label} ${w}px: clean console ${errors.slice(0, 2).join(' | ')}`)
    if (label === 'starter content' && [390, 1440].includes(w)) { await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.screenshot({ path: `${SHOTS}/smoke-${w}-hero.png` }) }
    await ctx.close()
  }
}

// 2. Starter content hides every section that has nothing to show
{
  const { page, ctx } = await newPage(1280)
  await page.goto(PROD); await page.waitForSelector('#top'); await page.waitForSelector('#contact'); await page.waitForTimeout(800)
  for (const id of ['work', 'case-studies', 'results', 'tools', 'ai', 'content', 'screenshots', 'websites', 'testimonials', 'mentoring', 'skills', 'platforms']) {
    check((await page.locator(`#${id}`).count()) === 0, `starter: #${id} hidden without content`)
  }
  for (const id of ['overview', 'about', 'services', 'process', 'strategy', 'contact']) check((await page.locator(`#${id}`).count()) === 1, `starter: #${id} rendered`)
  check((await page.locator('text=Download CV').count()) === 0, 'starter: no CV button without a file')
  check(await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].every((a) => a.getAttribute('href') === '#' || !!document.getElementById(a.getAttribute('href').slice(1)) )), 'starter: every in-page link points at a real section')
  await ctx.close()
}

// 3. Automatic season follows the visitor's date
for (const [iso, expected] of [['2026-01-15', 'winter'], ['2026-04-10', 'spring'], ['2026-07-04', 'summer'], ['2026-10-31', 'autumn'], ['2026-12-21', 'winter'], ['2026-03-19', 'winter'], ['2026-03-20', 'spring']]) {
  const { page, ctx } = await newPage(1280)
  await page.clock.setFixedTime(new Date(`${iso}T12:00:00`))
  await page.goto(PROD); await page.waitForSelector('#top')
  check(await page.locator('html').getAttribute('data-season') === expected, `Auto season on ${iso} is ${expected}`)
  await ctx.close()
}

// 4. Every season renders its own look
{
  const colors = {}
  for (const s of ['spring', 'summer', 'autumn', 'winter']) {
    const { page, ctx } = await newPage(1280, 860)
    await page.goto(`${DEV}/?sample=1&preview=1&season=${s}`); await page.waitForSelector('#top'); await page.waitForTimeout(2000)
    colors[s] = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--c-sand').trim())
    check(await page.locator('html').getAttribute('data-season') === s, `season ${s} applies`)
    check(await page.locator('.decor__p').count() > 0, `${s}: seasonal decorations present`)
    await page.screenshot({ path: `${SHOTS}/smoke-season-${s}.png` })
    await ctx.close()
  }
  check(new Set(Object.values(colors)).size === 4, `each season has its own palette (${Object.values(colors).join(' ')})`)
}

// 5. Sample content: interactions
{
  const { page, errors, ctx } = await newPage(1280, 860)
  await page.goto(`${DEV}/?sample=1&preview=1&season=summer`); await page.waitForSelector('#top'); await page.waitForTimeout(1900)
  await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 0.5, behavior: 'instant' })); await page.waitForTimeout(300)
  const p1 = parseFloat(await page.evaluate(() => getComputedStyle(document.getElementById('top')).getPropertyValue('--p')))
  check(p1 > 0.3 && p1 < 0.7, `hero breakout tracks scroll (${p1})`)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(200)
  await page.mouse.move(900, 400); await page.waitForTimeout(700)
  check(parseFloat(await page.evaluate(() => getComputedStyle(document.querySelector('.hero__stage')).getPropertyValue('--tr'))) > 100, 'night tide opens on hover')
  await page.mouse.move(5, 5)

  await page.click('.header__nav >> text=Services'); await page.waitForTimeout(1500)
  check(await page.evaluate(() => document.getElementById('services').getBoundingClientRect().top < 200), 'nav scrolls to Services')
  await page.click('.towel__item >> nth=0', { force: true })
  check(await page.locator('dialog[open] .service-detail').count() === 1, 'service dialog opens')
  await page.keyboard.press('Escape')

  await jump(page, 'work'); await page.waitForTimeout(600)
  check(await page.locator('.polaroid').count() === 4, 'four sample projects')
  await page.getByRole('button', { name: 'Project type' }).click()
  await page.locator('.facet__menu .chip').first().click()
  check(await page.locator('.polaroid').count() < 4, 'type filter narrows results')
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await page.getByLabel('Search projects').fill('Project 3')
  check(await page.locator('.polaroid').count() === 1, 'search finds one project')
  await page.getByLabel('Search projects').fill('')
  await page.click('.polaroid >> nth=0', { force: true }); await page.waitForTimeout(500)
  check(await page.locator('dialog[open] .project').count() === 1, 'project view opens')
  check(await page.locator('dialog[open] .case').count() === 1, 'case study renders inside the project view')
  check(await page.locator('dialog[open] .block').count() >= 5, 'content blocks render')
  check(await page.locator('dialog[open] .chart svg').count() >= 1, 'chart block renders as SVG')
  check(await page.locator('dialog[open] .result').count() >= 1, 'linked results render in the project')
  await page.keyboard.press('ArrowRight')
  check((await page.locator('.project__count').innerText()).startsWith('2'), 'ArrowRight advances the gallery')
  await page.locator('dialog[open] .blk-gallery__grid button').first().click()
  await page.waitForSelector('.viewer')
  await page.getByRole('button', { name: 'Zoom in' }).click()
  check((await page.locator('.viewer__stage img').getAttribute('style')).includes('scale(1.4)'), 'image viewer zooms')
  await page.screenshot({ path: `${SHOTS}/smoke-viewer.png` })
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape')

  await jump(page, 'results'); await page.waitForTimeout(1500)
  check(await page.locator('.badge--illustrative').count() >= 1 && await page.locator('.badge--confidential').count() === 1, 'result type badges shown')
  check(await page.locator('.result:has-text("Sample confidential") :text("approved wording")').count() === 1, 'confidential result shows approved wording, not numbers')
  check(await page.locator('.result__pct').count() >= 1, 'percentage only where it can be calculated')
  await jump(page, 'screenshots'); await page.waitForTimeout(600)
  await page.locator('.shot button').first().click()
  check(await page.locator('.viewer').count() === 1, 'screenshot opens in the zoom viewer')
  await page.keyboard.press('Escape')
  await jump(page, 'tools'); await page.waitForTimeout(400)
  await page.click('.ring >> nth=0'); check((await page.locator('.ring[aria-pressed="true"]').count()) === 1, 'tool ring flips')
  await jump(page, 'skills'); check(await page.locator('.skilllist__level').count() >= 1 && await page.locator('[class*="percent"]').count() === 0, 'skills use words, not percentage bars')
  await jump(page, 'ai'); check(await page.locator('.aicard').count() === 2, 'AI skills render')

  // contact: recruiter mode
  await page.click('.header__nav >> text=Contact'); await page.waitForTimeout(1500)
  check(await page.evaluate(() => document.activeElement?.id === 'enquiry-name'), 'Contact link focuses the form')
  await page.click('.form button[type=submit]')
  check((await page.locator('.field__error').count()) >= 3, 'empty form shows validation errors')
  await page.fill('#enquiry-name', 'Sam Recruiter'); await page.fill('#enquiry-email', 'sam@example.com')
  check(await page.locator('#enquiry-role').count() === 0, 'role field hidden for ordinary enquiries')
  await page.selectOption('#enquiry-type', { label: "I'm contacting you about a job opportunity" })
  check(await page.locator('#enquiry-role').count() === 1, 'recruiter enquiry reveals company and role fields')
  await page.fill('#enquiry-role', 'Social Media Manager'); await page.fill('#enquiry-message', 'We would like to talk to you.')
  await page.evaluate(() => { window.__opened = null; window.open = (u) => { window.__opened = u; return null } })
  await page.check('input[name=method] >> nth=1')
  await page.click('.form button[type=submit]')
  const opened = await page.evaluate(() => window.__opened)
  check(opened?.startsWith('https://wa.me/441234567890?text=') && decodeURIComponent(opened).includes('Role: Social Media Manager'), 'WhatsApp message is encoded and includes the role')
  check((await page.locator('.form__status').innerText()).includes('Nothing is sent'), 'form is honest that nothing has been sent')
  check(errors.length === 0, `sample interactions: clean console ${errors.slice(0, 3).join(' | ')}`)
  await ctx.close()
}

// 6. Mobile: drawer navigation
{
  const { page, ctx } = await newPage(390, 844, { hasTouch: true, isMobile: true })
  await page.goto(`${DEV}/?sample=1&preview=1`); await page.waitForSelector('#top'); await page.waitForTimeout(1800)
  await page.click('.header__burger')
  check(await page.locator('dialog.drawer[open]').count() === 1, 'mobile drawer opens')
  await page.click('.drawer__link >> text=About'); await page.waitForTimeout(1500)
  check(await page.locator('dialog[open]').count() === 0, 'drawer closes on selection')
  check(await page.evaluate(() => document.getElementById('about').getBoundingClientRect().top < 150), 'drawer link scrolls to the section')
  await ctx.close()
}

// 7. Reduced motion
{
  const { page, ctx } = await newPage(1280, 800, { reducedMotion: 'reduce' })
  await page.goto(`${DEV}/?sample=1&preview=1&season=autumn`); await page.waitForSelector('#top')
  check(await page.locator('.loader').count() === 0, 'reduced motion: loader skipped')
  check(await page.locator('.tide').count() === 0, 'reduced motion: night tide disabled')
  check(await page.locator('.decor').count() === 0, 'reduced motion: seasonal particles removed')
  check(await page.locator('canvas.bubbles').count() === 0, 'reduced motion: cursor trail removed')
  check(await page.locator('html').getAttribute('data-motion') === 'none', 'reduced motion: motion level is none')
  await page.screenshot({ path: `${SHOTS}/smoke-reduced.png` })
  await ctx.close()
}

await browser.close()
server.close()
rmSync(dir, { recursive: true, force: true })
console.log(failures.length ? `\n${failures.length} FAILED:\n- ${failures.join('\n- ')}` : '\nAll public site checks passed')
process.exit(failures.length ? 1 : 0)
