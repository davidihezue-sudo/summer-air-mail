// Phone audit: overflow, menu width, tap targets and text size on the public site and every admin page, at four phone widths.
//   CHROME=... node scripts/mobile.mjs        (needs the Vite dev server for sample content: npm run dev)
import { chromium } from 'playwright-core'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createApp } from '../server/index.mjs'
import { NAV_IDS } from './nav-ids.mjs'

const DEV = process.env.DEV_URL ?? 'http://localhost:5173'
const WIDTHS = [[320, 640], [360, 740], [390, 844], [430, 932]]
const failures = []
const check = (ok, msg) => { if (!ok) { failures.push(msg); console.log(`FAIL  ${msg}`) } }
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] })
const ctxOf = (w, h) => browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 })

/** Controls a thumb has to hit: anything clickable smaller than 40px either way, unless it is a text link inside a sentence. */
const smallTargets = (page) => page.evaluate(() => {
  const out = []
  const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !e.closest('[aria-hidden="true"]') && !e.closest('.sr-only') }
  for (const e of document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button]')) {
    if (!vis(e)) continue
    const r = e.getBoundingClientRect()
    if (e.matches('a') && e.closest('p, li, dd, figcaption, .prose') && getComputedStyle(e).display === 'inline') continue
    if (e.matches('input[type=checkbox], input[type=radio], input[type=range]')) continue
    if (e.classList.contains('skip') || e.closest('.hp')) continue
    if (e.classList.contains('aswitch__btn')) continue // its tap area is enlarged with a pseudo element
    if (r.height < 36 || r.width < 36) out.push(`${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]} ${Math.round(r.width)}x${Math.round(r.height)} "${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 24)}"`)
  }
  return out
})
const smallText = (page) => page.evaluate(() => [...document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=hidden]):not([type=color]), select, textarea')].filter((e) => e.getBoundingClientRect().width > 0 && parseFloat(getComputedStyle(e).fontSize) < 16).map((e) => `${e.tagName.toLowerCase()}#${e.id || e.className}`))
const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)

for (const [w, h] of WIDTHS) {
  // ---- public ----
  for (const scheme of ['light', 'dark']) {
    const ctx = await ctxOf(w, h)
    const page = await ctx.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(`${DEV}/?sample=1&preview=1&season=autumn&scheme=${scheme}`)
    await page.waitForSelector('#top'); await page.waitForTimeout(1500)
    const total = await page.evaluate(() => document.documentElement.scrollHeight)
    for (let y = 0; y < total; y += 500) { await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), y); await page.waitForTimeout(30) }
    check((await overflow(page)) <= 0, `public ${w}px ${scheme}: sideways overflow ${await overflow(page)}`)
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(300)
    const small = await smallTargets(page)
    check(small.length === 0, `public ${w}px ${scheme}: small tap targets ${small.slice(0, 6).join('; ')}`)
    check((await smallText(page)).length === 0, `public ${w}px ${scheme}: inputs under 16px (iPhones zoom)`)
    if (scheme === 'light') {
      await page.click('.header__burger'); await page.waitForTimeout(500)
      const dw = await page.evaluate(() => document.querySelector('dialog.drawer')?.getBoundingClientRect().width ?? 0)
      check(dw <= Math.max(190, w * 0.5) + 1, `public ${w}px: menu is ${Math.round(dw)}px wide, more than half the screen`)
      const links = await page.locator('.drawer__link').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height))
      check(links.length > 0 && links.every((x) => x >= 44), `public ${w}px: menu links are all at least 44px tall`)
      const fits = await page.evaluate(() => { const p = document.querySelector('.drawer .modal__panel'); return p.scrollWidth <= p.clientWidth + 1 })
      check(fits, `public ${w}px: menu content fits its width`)
    }
    check(errors.length === 0, `public ${w}px ${scheme}: console errors ${errors.join(' | ')}`)
    await ctx.close()
  }
}

// ---- admin ----
const dir = mkdtempSync(join(tmpdir(), 'sam-mobile-'))
const { app, auth } = await createApp({ dataDir: join(dir, 'data'), distDir: resolve('dist') })
await auth.setCredentials('owner', 'correct horse battery staple')
const server = await new Promise((ok) => { const s = app.listen(0, '127.0.0.1', () => ok(s)) })
const base = `http://127.0.0.1:${server.address().port}`
for (const [w, h] of WIDTHS) {
  const ctx = await ctxOf(w, h)
  const page = await ctx.newPage()
  await page.goto(`${base}/admin`)
  await page.fill('input[autocomplete=username]', 'owner'); await page.fill('input[type=password]', 'correct horse battery staple')
  await page.click('button:has-text("Sign in")'); await page.waitForSelector('h1:has-text("Dashboard")')
  const bad = []; const smalls = new Set(); const zoom = new Set()
  for (const id of NAV_IDS) {
    await page.goto(`${base}/admin#/${id}`); await page.waitForTimeout(350)
    const o = await overflow(page)
    if (o > 0) bad.push(`${id}(+${o})`)
    for (const s of await smallTargets(page)) smalls.add(`${id}: ${s}`)
    for (const s of await smallText(page)) zoom.add(`${id}: ${s}`)
  }
  check(bad.length === 0, `admin ${w}px: sideways overflow on ${bad.join(', ')}`)
  check(smalls.size === 0, `admin ${w}px: small tap targets ${[...smalls].slice(0, 8).join('; ')}`)
  check(zoom.size === 0, `admin ${w}px: inputs under 16px ${[...zoom].slice(0, 6).join('; ')}`)
  await page.goto(`${base}/admin#/dashboard`); await page.waitForTimeout(300)
  await page.click('.atop__menu'); await page.waitForTimeout(500)
  const aw = await page.evaluate(() => document.querySelector('.aside')?.getBoundingClientRect().width ?? 0)
  check(aw <= Math.max(200, w * 0.5) + 1, `admin ${w}px: menu is ${Math.round(aw)}px wide, more than half the screen`)
  const fits = await page.evaluate(() => { const a = document.querySelector('.aside'); return a.scrollWidth <= a.clientWidth + 1 })
  check(fits, `admin ${w}px: menu content fits its width`)
  await ctx.close()
  console.log(`checked admin at ${w}px`)
}
server.close(); rmSync(dir, { recursive: true, force: true })
await browser.close()
console.log(failures.length ? `\n${failures.length} phone problem(s)` : '\nPhone checks passed')
process.exit(failures.length ? 1 : 0)
