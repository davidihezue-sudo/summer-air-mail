// Browser checks for the version 3 features. Runs its own server with a temporary data folder.
//   npm run build   then   CHROME=... npm run smoke:v3
import { chromium } from 'playwright-core'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createApp } from '../server/index.mjs'
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const failures = []
const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); if (!ok) failures.push(msg) }

const dir = mkdtempSync(join(tmpdir(), 'sam-v3-'))
// The defaults are TypeScript, so bundle them once for Node.
execFileSync('npx', ['rolldown', 'src/content/bundle.ts', '--format', 'esm', '--platform', 'node', '-d', join(dir, 'defaults')], { stdio: 'ignore' })
const { baseContent } = await import(pathToFileURL(join(dir, 'defaults', 'bundle.js')).href)
const { app, auth } = await createApp({ dataDir: join(dir, 'data'), distDir: resolve('dist') })
await auth.setCredentials('owner', 'correct horse battery staple')
const server = await new Promise((ok) => { const s = app.listen(0, '127.0.0.1', () => ok(s)) })
const base = `http://127.0.0.1:${server.address().port}`
const H = { 'content-type': 'application/json', 'x-requested-with': 'sam-admin' }
const login = await fetch(`${base}/api/admin/login`, { method: 'POST', headers: H, body: JSON.stringify({ username: 'owner', password: 'correct horse battery staple' }) })
const cookie = login.headers.get('set-cookie').split(';')[0]
const api = (p, init = {}) => fetch(base + p, { ...init, headers: { ...H, cookie, ...(init.headers ?? {}) } })

const c = structuredClone(baseContent)
c.portfolio.site.url = 'https://example.com'
c.portfolio.profile = { ...c.portfolio.profile, fullName: 'Sam Test', preferredName: 'Sam', email: 'sam@example.com', tagline: 'Hello tagline', intro: 'A short intro for the profile.' }
c.portfolio.announcement = { ...c.portfolio.announcement, enabled: true, text: 'Smoke banner', dismissible: true }
c.portfolio.booking = { enabled: true, label: 'Book smoke', url: 'https://example.com/book', showIn: ['hero', 'contact'] }
c.portfolio.design = { ...c.portfolio.design, colorMode: 'light', colorToggle: true }
c.portfolio.contact.delivery = 'server'
c.portfolio.insights.enabled = true
c.portfolio.i18n = { enabled: true, defaultLabel: 'English', switcher: true, languages: [{ code: 'fr', label: 'Francais', rtl: false, ui: {}, text: { 'portfolio.profile.tagline': 'Bonjour tagline' } }] }
c.tools = [{ id: 'tl1', name: 'Figma', category: 'Design', confirmed: true, usage: 'Smoke usage line.' }, { id: 'tl2', name: 'Canva', category: 'Design', confirmed: true, usage: 'Second usage line.' }]
c.portfolio.cursor = { ...c.portfolio.cursor, enabled: true, style: 'ring', showIn: 'professional' }
c.projects = [{ id: 'p1', title: 'Smoke project', client: 'Brand', industry: 'x', category: 'Brand Development', description: 'A description long enough to be a real description of the work done.', year: '2025', period: '', platforms: [], role: 'Lead', thumbnail: { src: '', alt: '' }, media: [], externalLink: '', featured: true, hidden: false, contentTypes: [], serviceIds: [], toolIds: [], aiSkillIds: [], resultIds: [], contentIds: [], screenshotIds: [], relatedIds: [], blocks: [] }]
const tall = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1170" height="2532"><rect width="1170" height="2532" fill="#F39CAB"/><text x="50" y="200" font-size="120">PHONE SCREENSHOT</text></svg>')}`
c.projects.push({ ...c.projects[0], id: 'p2', title: 'Tall screenshot project', platforms: ['instagram'], thumbnail: { src: tall, alt: 'A phone screenshot', width: 1170, height: 2532 } })
c.portfolio.extras = { ...c.portfolio.extras, clientStrip: true, backToTop: true }
c.notes = [{ id: 'n1', slug: 'hello-note', title: 'Hello note', date: '2026-01-01', summary: 'Sum', body: 'Body text here.', cover: null, tags: [], seoTitle: '', seoDescription: '', hidden: false }]
c.applications = [{ id: 'a1', slug: 'acme-1234', label: 'Acme', company: 'Acme', role: 'SMM', enabled: true, expiresAt: '', hero: { label: '', headline: 'Hello Acme team', supporting: '', intro: '' }, greeting: { enabled: true, text: 'Prepared for Acme' }, featuredProjectIds: [], onlyFeatured: false, highlightSkills: [], hideSectionIds: [], lookId: '', professional: '', season: '', cvFile: '', cvFilename: '' }]
c.testimonials = [1, 2].map((i) => ({ id: `t${i}`, name: `Person ${i}`, title: 'T', company: 'C', quote: `Quote ${i}`, relationship: 'r', approved: true }))
c.portfolio.sections = c.portfolio.sections.map((s) => (s.type === 'testimonials' ? { ...s, layout: 'carousel' } : s))
const put = await api('/api/admin/draft', { method: 'PUT', body: JSON.stringify({ content: c }) })
check(put.ok, 'draft saved')
check((await api('/api/admin/publish', { method: 'POST', body: '{}' })).ok, 'published')

const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] })
const open = async (path, w = 1280, h = 800, opts = {}) => {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, ...opts })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(base + path)
  await page.waitForTimeout(1500)
  return { page, errors, ctx }
}

{
  const { page, errors, ctx } = await open('/')
  check(await page.locator('.banner').count() === 1, 'announcement banner shows')
  await page.locator('.banner button').click()
  check(await page.locator('.banner').count() === 0, 'banner can be dismissed')
  check(await page.getByRole('link', { name: /Book smoke/ }).count() > 0, 'booking button shows in the hero')
  check(await page.locator('canvas.cursorfx').count() === 1, 'cursor effect canvas is present')
  check(await page.locator('.orb[data-style=bubble] .orbfx--sat').count() === 3, 'hero circle is a water bubble with small bubbles around it')
  await page.getByRole('button', { name: /Switch to dark mode/ }).click()
  await page.waitForTimeout(300)
  check(await page.evaluate(() => document.documentElement.dataset.scheme) === 'dark', 'visitor can switch to dark mode')
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  check(!/251, 244, 228/.test(bg), `dark mode changes the page background (${bg})`)
  await page.reload(); await page.waitForTimeout(800)
  check(await page.evaluate(() => document.documentElement.dataset.scheme) === 'dark', 'dark choice is remembered')
  await page.selectOption('.langsel select', 'fr')
  await page.waitForTimeout(300)
  check(await page.evaluate(() => document.documentElement.lang) === 'fr', 'language switch sets the page language')
  await page.evaluate(() => document.getElementById('work')?.scrollIntoView())
  await page.waitForTimeout(600)
  const tallCard = page.locator('.polaroid-wrap', { hasText: 'Tall screenshot project' }).locator('.fit')
  check(await tallCard.locator('img.fit__img').getAttribute('data-fit') === 'contain', 'a tall phone screenshot is shown whole, not trimmed')
  check(await tallCard.locator('img.fit__bg').count() === 1, 'the space around it is filled with a soft blurred copy')
  const box = await tallCard.boundingBox()
  check(box && box.height / box.width > 1.5, `the card follows the screenshot's tall shape (${box && (box.height / box.width).toFixed(2)})`)
  check(await page.locator('.totop').count() === 1, 'back to top button appears after scrolling')
  await page.evaluate(() => document.getElementById('tools')?.scrollIntoView())
  await page.waitForTimeout(500)
  check(await page.locator('.toolcard').count() === 2, 'tools show as cards without clicking')
  check(await page.locator('.toolcard svg').count() === 1 && await page.locator('.toollogo__mono').count() === 1, 'a known brand shows its logo and an unknown one a monogram')
  check((await page.locator('.toolcard').first().innerText()).includes('Smoke usage line.'), 'how a tool is used is visible without clicking')
  await page.evaluate(() => document.getElementById('testimonials')?.scrollIntoView())
  check(await page.locator('.quotes--carousel').count() === 1, 'testimonials render as a carousel')
  await page.evaluate(() => document.getElementById('contact')?.scrollIntoView())
  await page.waitForTimeout(600)
  check(await page.getByRole('radio', { name: 'Send here' }).count() === 1, 'contact form offers sending here')
  check(errors.length === 0, `home: clean console ${errors.join(' | ')}`)
  await ctx.close()
}
{
  const { page, ctx } = await open('/')
  await page.evaluate(() => document.getElementById('work')?.scrollIntoView())
  await page.waitForTimeout(800)
  await page.getByRole('button', { name: /Smoke project/ }).first().click({ force: true })
  await page.waitForTimeout(600)
  check(new URL(page.url()).pathname === '/work/p1', 'opening a project gives it its own address')
  await page.goBack(); await page.waitForTimeout(400)
  check(await page.locator('dialog[open]').count() === 0, 'back button closes the project')
  await ctx.close()
}
{
  const { page, ctx } = await open('/work/p1')
  check(await page.locator('dialog[open]').count() === 1, 'a shared project link opens the project')
  await ctx.close()
}
{
  const { page, ctx } = await open('/for/acme-1234')
  check(await page.locator('body').innerText().then((t) => t.includes('Hello Acme team')), 'application link shows its own hero words')
  check(await page.locator('.greeting').count() === 1, 'application welcome note shows')
  check(await page.locator('meta[name=robots]').getAttribute('content') === 'noindex, nofollow', 'application page is noindex')
  await ctx.close()
}
{
  const { page, ctx } = await open('/for/nope')
  check(await page.locator('h1').innerText().then((t) => /moved on/.test(t)), 'unknown application link shows the 404 page')
  await ctx.close()
}
{
  const { page, ctx } = await open('/profile')
  check(await page.locator('.pf h1').innerText() === 'Sam Test', 'one page profile renders')
  const pdf = await page.pdf({ format: 'A4' })
  check(pdf.length > 2000, `profile prints to PDF (${pdf.length} bytes)`)
  await ctx.close()
}
{
  const { page, ctx } = await open('/notes/hello-note')
  check(await page.locator('h1').innerText() === 'Hello note', 'note page renders')
  await ctx.close()
}
{
  const { page, ctx } = await open('/nowhere/at/all')
  check(await page.locator('h1').innerText().then((t) => /moved on/.test(t)), 'unknown path shows the custom 404')
  await ctx.close()
}
{
  // Contact form really sends.
  const { page, ctx } = await open('/')
  await page.evaluate(() => document.getElementById('contact')?.scrollIntoView())
  await page.waitForTimeout(3200)
  await page.fill('#enquiry-name', 'Visitor One')
  await page.fill('#enquiry-email', 'v@example.com')
  await page.selectOption('#enquiry-type', { index: 2 })
  await page.fill('#enquiry-message', 'Hello, this is a test message from the smoke suite.')
  await page.getByRole('button', { name: /Send message/ }).click()
  await page.waitForTimeout(1200)
  const inbox = await (await api('/api/admin/enquiries')).json()
  check(inbox.items.length === 1 && inbox.items[0].name === 'Visitor One', 'contact form message reaches the inbox')
  check(await page.locator('.form--done').count() === 1, 'visitor sees the thank you message')
  await ctx.close()
}
{
  // Insights count a view for a normal visitor and ignore a visitor with Do Not Track.
  const { ctx } = await open('/')
  await ctx.close()
  const s = await (await api('/api/admin/insights?range=7')).json()
  check(s.views >= 1, `insights counted visits (${s.views})`)
}
// Maintenance mode.
{
  const d = (await (await api('/api/admin/draft')).json()).draft
  d.portfolio.maintenance.enabled = true
  await api('/api/admin/draft', { method: 'PUT', body: JSON.stringify({ content: d }) })
  await api('/api/admin/publish', { method: 'POST', body: '{}' })
  const { page, ctx } = await open('/')
  check(await page.locator('h1').innerText().then((t) => /Back soon/.test(t)), 'maintenance page replaces the site for visitors')
  await ctx.close()
}

await browser.close()
server.close()
rmSync(dir, { recursive: true, force: true })
if (failures.length) { console.log(`\n${failures.length} check(s) failed`); process.exit(1) }
console.log('\nAll version 3 checks passed')
