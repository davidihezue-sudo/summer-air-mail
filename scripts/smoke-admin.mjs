// End to end test of the admin and the public site, against a real server with a temporary data folder.
//   npm run build && CHROME=/path/to/chromium npm run smoke:admin
import { chromium } from 'playwright-core'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createApp } from '../server/index.mjs'

const SHOTS = process.env.SHOTS ?? './screenshots'
const PASSWORD = 'correct horse battery staple'
const failures = []
const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); if (!ok) failures.push(msg) }
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')

const dir = mkdtempSync(join(tmpdir(), 'sam-e2e-'))
const { app, auth } = await createApp({ dataDir: join(dir, 'data'), distDir: resolve('dist') })
await auth.setCredentials('owner', PASSWORD)
const server = await new Promise((ok) => { const s = app.listen(0, '127.0.0.1', () => ok(s)) })
const BASE = `http://127.0.0.1:${server.address().port}`

const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
const problems = []
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) problems.push(`${m.type()}: ${m.text()}`) })
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`))

const saved = () => page.waitForSelector('.atop__status >> text=Draft saved', { timeout: 8000 })
const nav = async (path) => { await page.goto(`${BASE}/admin#/${path}`); await page.waitForTimeout(300) }

try {
  // ---- sign in ----
  await page.goto(`${BASE}/admin`)
  await page.waitForSelector('text=Sign in')
  await page.fill('input[autocomplete=username]', 'owner')
  await page.fill('input[type=password]', 'wrong password here')
  await page.click('button:has-text("Sign in")')
  await page.waitForSelector('[role=alert]:has-text("Incorrect")')
  check(true, 'wrong password shows an error')
  await page.fill('input[type=password]', PASSWORD)
  await page.click('button:has-text("Sign in")')
  await page.waitForSelector('h1:has-text("Dashboard")')
  check(await page.locator('text=Not published yet').count() > 0, 'dashboard says nothing is published yet')
  check((await page.locator('.atile').count()) >= 10, 'dashboard shows content tiles')
  await saved()
  check(true, 'starter content saved as the first draft automatically')

  // ---- profile ----
  await nav('profile')
  await page.getByLabel('Full name', { exact: true }).fill('Jane Marketer')
  await page.getByLabel('Professional name', { exact: true }).fill('Jane Marketer')
  await page.getByLabel('Email', { exact: true }).fill('jane@example.com')
  await page.getByLabel('WhatsApp number').fill('+44 7700 900123')
  await saved()
  check(true, 'profile edits autosave')

  // ---- appearance and seasons ----
  await nav('appearance')
  await page.getByLabel('Professional intensity').selectOption('creative')
  await nav('seasons')
  await page.getByRole('radio', { name: /Winter/ }).click()
  await page.waitForSelector('iframe[title^="Site preview"]')
  await page.waitForTimeout(2500)
  const frame = page.frameLocator('iframe[title^="Site preview"]')
  // preview a different season without changing the saved mode
  await page.getByRole('tab', { name: /Autumn/ }).click()
  await page.waitForTimeout(1500)
  check(await frame.locator('html').getAttribute('data-season') === 'autumn', 'season tab previews that season')
  await page.getByRole('radio', { name: /Spring/ }).click()
  await page.getByRole('radio', { name: /Auto/ }).click()
  check(await page.getByRole('radio', { name: /Auto/ }).getAttribute('aria-checked') === 'true', 'Auto mode selectable')
  await page.getByRole('radio', { name: /Winter/ }).click()
  // invalid dates are flagged
  await page.locator('#d-spring').fill('31')
  await page.locator('#m-spring').selectOption('2')
  check(await page.locator('text=not valid').count() > 0, 'invalid season dates are flagged')
  await page.getByRole('button', { name: 'Standard (northern hemisphere)' }).click()
  check(await page.locator('text=Spring from 20 March').count() > 0, 'standard season dates restored')
  await page.getByRole('button', { name: 'Southern hemisphere' }).click()
  check(await page.locator('text=Summer from 21 December').count() > 0, 'southern hemisphere preset applies')
  await page.getByRole('button', { name: 'Standard (northern hemisphere)' }).click()

  // ---- media upload with the privacy review step ----
  await nav('media')
  await page.locator('input[type=file]').setInputFiles({ name: 'my photo.png', mimeType: 'image/png', buffer: PNG })
  await page.waitForSelector('text=Hide sensitive information')
  await page.getByRole('button', { name: /Use image/ }).click()
  await page.waitForSelector('.amedia__item')
  check(await page.locator('.amedia__item').count() === 1, 'upload (after the privacy review) appears in the library')
  await page.locator('.amedia__item').first().click()
  await page.getByLabel(/Alt text/).fill('A tiny test image')
  await page.getByRole('button', { name: 'Save details' }).click()
  await page.waitForSelector('text=Saved.')

  // ---- create a project with a case study ----
  await nav('projects')
  await page.getByRole('button', { name: /Add project/ }).first().click()
  await page.waitForSelector('text=Editing project')
  await page.getByLabel('Project title').fill('Spring Launch Campaign')
  await page.getByLabel('Client or brand').fill('Example Brand')
  await page.getByLabel('Short description').fill('A campaign used for testing the admin.')
  await page.getByRole('switch', { name: /Published on the public site/ }).click()
  await page.getByRole('switch', { name: /This project has a case study/ }).click()
  // cover image from the library
  await page.getByRole('button', { name: /Choose or upload an image/ }).first().click()
  await page.waitForSelector('.apicker')
  await page.locator('.apicker .amedia__item').first().click()
  await page.waitForSelector('.aimage img')
  // case study text
  await page.getByLabel('Project objective').fill('Grow engaged followers in the launch period.')
  await page.getByLabel('The challenge', { exact: false }).first().fill('The brand was unknown to the target audience.')
  // a content block
  await page.locator('summary:has-text("Content blocks")').click()
  await page.locator('#block-type').selectOption('paragraph')
  await page.getByRole('button', { name: /Add block/ }).click()
  await page.locator('.alist__body textarea').last().fill('This paragraph was added with the block builder.')
  await saved()
  check(true, 'project, case study and content block saved')

  // ---- add a result ----
  await nav('results')
  await page.getByRole('button', { name: /Add result/ }).first().click()
  await page.getByLabel(/Metric \(for example/).fill('Engagement rate')
  await page.getByLabel('Starting value').fill('2.1')
  await page.getByLabel('Ending value').fill('4.6')
  await page.getByLabel('Unit (%, k, views)').fill('%')
  await page.getByLabel('Measurement period (required)').fill('Mar to Jun 2025')
  await page.getByRole('switch', { name: /Published on the public site/ }).click()
  await saved()

  // ---- hide a section, reorder another ----
  await nav('sections')
  await page.getByRole('switch', { name: /Show Services/ }).click()
  const labelsBefore = await page.locator('.alist--sections > li .alist__title strong').allInnerTexts()
  const resultsIdx = labelsBefore.findIndex((t) => /Results/i.test(t))
  const workIdx = labelsBefore.findIndex((t) => /Work/.test(t))
  check(resultsIdx > workIdx, 'results section starts after work')
  for (let i = 0; i < resultsIdx - workIdx; i++) await page.locator('.alist--sections > li').nth(resultsIdx - i).getByRole('button', { name: 'Move up' }).click()
  await saved()

  // ---- custom navigation ----
  await nav('navigation')
  await page.getByRole('button', { name: 'Custom' }).click()
  await page.waitForSelector('.alist__item')
  await saved()

  // ---- publish ----
  await page.getByRole('button', { name: /^Publish$/ }).click()
  await page.waitForSelector('.atoast:has-text("Published")')
  check(true, 'publish succeeds')

  // ---- the public site reflects every change ----
  const pub = await ctx.newPage()
  const pubProblems = []
  pub.on('console', (m) => { if (['error', 'warning'].includes(m.type())) pubProblems.push(m.text()) })
  await pub.goto(BASE + '/')
  await pub.waitForSelector('#top')
  await pub.waitForTimeout(2200)
  check(await pub.locator('html').getAttribute('data-season') === 'winter', 'public site uses the chosen season')
  check((await pub.title()).includes('Portfolio') || (await pub.title()).length > 0, 'page has a title')
  check(await pub.locator('.sr-only:has-text("Jane Marketer")').count() > 0, 'public hero uses the edited name')
  check(await pub.locator('#services').count() === 0, 'a section switched off in the admin is gone')
  check(await pub.locator('#work').count() === 1 && await pub.locator('#results').count() === 1, 'work and results sections appear because they now have content')
  const order = await pub.evaluate(() => [...document.querySelectorAll('main > section')].map((s) => s.id))
  check(order.indexOf('results') < order.indexOf('work') && order.indexOf('results') > -1, `section order follows the admin (${order.join(', ')})`)
  check(await pub.locator('.navlink:has-text("Services")').count() === 0, 'navigation hides the removed section (no broken links)')
  const raw = await (await fetch(BASE + '/')).text()
  check(raw.includes('<title>') && raw.includes('application/ld+json'), 'server-rendered head has title and structured data for crawlers')
  // open the project
  await pub.evaluate(() => document.getElementById('work')?.scrollIntoView({ behavior: 'instant' }))
  await pub.waitForTimeout(800)
  await pub.locator('.polaroid').first().click({ force: true })
  await pub.waitForSelector('dialog[open] .project')
  check(await pub.locator('dialog[open] :text("This paragraph was added with the block builder.")').count() === 1, 'content block renders in the project view')
  check(await pub.locator('dialog[open] :text("The brand was unknown to the target audience.")').count() === 1, 'case study challenge renders')
  check(await pub.locator('dialog[open] img[alt]').count() > 0, 'project images keep alt attributes')
  await pub.screenshot({ path: `${SHOTS}/e2e-project.png` })
  await pub.keyboard.press('Escape')
  await pub.evaluate(() => document.getElementById('results')?.scrollIntoView({ behavior: 'instant' }))
  await pub.waitForTimeout(1500)
  check(await pub.locator('.result:has-text("Engagement rate")').count() === 1, 'result card shows the metric')
  check(await pub.locator('.result :text("+119%")').count() === 1, 'percentage is calculated from the supplied start and end only')
  await pub.screenshot({ path: `${SHOTS}/e2e-results.png` })
  check(pubProblems.length === 0, `public site console is clean ${pubProblems.slice(0, 2).join(' | ')}`)
  await pub.close()

  // ---- professional intensity: restrained layout and plain titles ----
  await nav('appearance')
  await page.getByLabel('Professional intensity').selectOption('professional')
  await nav('sections')
  await page.getByRole('switch', { name: /Show Services/ }).click()
  await saved()
  await page.getByRole('button', { name: /^Publish$/ }).click()
  await page.waitForSelector('.atoast:has-text("Published")')
  const proPage = await ctx.newPage()
  await proPage.goto(BASE + '/')
  await proPage.waitForSelector('#services')
  await proPage.waitForTimeout(1500)
  check(await proPage.locator('html').getAttribute('data-professional') === 'professional', 'professional intensity applies to the public site')
  check(await proPage.locator('.svc-card').count() > 0 && await proPage.locator('.towel').count() === 0, 'professional mode shows clean service cards instead of the towel')
  check(await proPage.locator('.sticker').count() === 0 && await proPage.locator('.tide').count() === 0 && await proPage.locator('.decor').count() === 0, 'professional mode removes playful extras')
  check(await proPage.locator('#services-title').innerText() === 'Services', 'professional mode uses plain section titles')
  check(await proPage.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].every((a) => a.getAttribute('href') === '#' || !!document.getElementById(a.getAttribute('href').slice(1)))), 'every in-page link has a target')
  await proPage.screenshot({ path: `${SHOTS}/e2e-professional.png` })
  await proPage.close()

  // ---- draft stays private until published ----
  await nav('profile')
  await page.getByLabel('Full name', { exact: true }).fill('Draft Only Name')
  await saved()
  const live = await (await fetch(BASE + '/api/content')).json()
  check(live.content.portfolio.profile.fullName === 'Jane Marketer', 'unpublished edits are not visible publicly')

  // ---- mobile admin ----
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  const mp = await m.newPage()
  await mp.goto(`${BASE}/admin`)
  await mp.fill('input[autocomplete=username]', 'owner')
  await mp.fill('input[type=password]', PASSWORD)
  await mp.click('button:has-text("Sign in")')
  await mp.waitForSelector('h1:has-text("Dashboard")')
  await mp.getByRole('button', { name: 'Open menu' }).click()
  await mp.getByRole('link', { name: 'Sections & Visibility' }).click()
  await mp.waitForSelector('h1:has-text("Sections")')
  for (const p of ['dashboard', 'projects', 'seasons', 'media', 'services']) {
    await mp.goto(`${BASE}/admin#/${p}`)
    await mp.waitForTimeout(500)
    const over = await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    check(over <= 0, `mobile admin: no horizontal overflow on ${p} (${over})`)
  }
  await mp.screenshot({ path: `${SHOTS}/e2e-mobile-admin.png` })
  await m.close()

  // ---- sign out ----
  await page.getByRole('button', { name: 'Sign out' }).click()
  await page.waitForSelector('text=Sign in')
  const after = await fetch(BASE + '/api/admin/draft')
  check(after.status === 401, 'signing out ends the session (draft API returns 401)')
  const adminProblems = problems.filter((p) => !/Failed to load resource.*(401|404)/.test(p))
  check(adminProblems.length === 0, `admin console is clean ${adminProblems.slice(0, 3).join(' | ')}`)
} catch (e) {
  failures.push(`crashed: ${e.message}`)
  console.error(e)
  await page.screenshot({ path: `${SHOTS}/e2e-failure.png` }).catch(() => {})
} finally {
  await browser.close()
  server.close()
  rmSync(dir, { recursive: true, force: true })
}
console.log(failures.length ? `\n${failures.length} FAILED:\n- ${failures.join('\n- ')}` : '\nAll admin checks passed')
process.exit(failures.length ? 1 : 0)
