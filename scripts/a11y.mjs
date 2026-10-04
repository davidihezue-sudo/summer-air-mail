// Accessibility audit with axe-core. Needs the Vite dev server for sample content:
//   npm run dev   (in one terminal)   then   CHROME=... npm run a11y
import { chromium } from 'playwright-core'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'

const require = createRequire(import.meta.url)
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')
const DEV = process.env.DEV_URL ?? 'http://localhost:5173'

const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] })
let total = 0

async function audit(page, label) {
  await page.evaluate(axeSource)
  const result = await page.evaluate(async () => {
    // eslint-disable-next-line no-undef
    const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } })
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 4).map((n) => n.target.join(' ') + ' :: ' + (n.any[0]?.message ?? n.failureSummary ?? '').slice(0, 140)) }))
  })
  total += result.length
  console.log(`${result.length ? 'FAIL' : 'PASS'}  ${label}${result.length ? '' : ''}`)
  for (const v of result) console.log(`   - [${v.impact}] ${v.id}: ${v.help}\n     ${v.nodes.join('\n     ')}`)
}

for (const [season, scheme] of ['spring', 'summer', 'autumn', 'winter'].flatMap((x) => [[x, 'light'], [x, 'dark']])) {
  for (const [w, h, tag] of [[1440, 900, 'desktop'], [390, 844, 'mobile']]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } })
    const page = await ctx.newPage()
    await page.goto(`${DEV}/?sample=1&preview=1&season=${season}&scheme=${scheme}`)
    await page.waitForSelector('#top')
    await page.waitForTimeout(1800)
    // Scroll through so lazy sections and reveal animations have rendered.
    const height = await page.evaluate(() => document.documentElement.scrollHeight)
    for (let y = 0; y < height; y += 600) { await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), y); await page.waitForTimeout(90) }
    await page.waitForTimeout(1200)
    await audit(page, `public ${season} ${scheme} ${tag}`)
    await ctx.close()
  }
}
// ---- admin ----
if (process.env.SKIP_ADMIN !== '1') {
  const { mkdtempSync, rmSync } = await import('node:fs')
  const { tmpdir } = await import('node:os')
  const { join, resolve } = await import('node:path')
  const { createApp } = await import('../server/index.mjs')
  const dir = mkdtempSync(join(tmpdir(), 'sam-a11y-'))
  const { app, auth } = await createApp({ dataDir: join(dir, 'data'), distDir: resolve('dist') })
  await auth.setCredentials('owner', 'correct horse battery staple')
  const server = await new Promise((ok) => { const s = app.listen(0, '127.0.0.1', () => ok(s)) })
  const base = `http://127.0.0.1:${server.address().port}`
  for (const [w, h, tag] of [[1440, 900, 'desktop'], [390, 844, 'mobile']]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } })
    const page = await ctx.newPage()
    await page.goto(`${base}/admin`)
    await audit(page, `admin login ${tag}`)
    await page.fill('input[autocomplete=username]', 'owner')
    await page.fill('input[type=password]', 'correct horse battery staple')
    await page.click('button:has-text("Sign in")')
    await page.waitForSelector('h1:has-text("Dashboard")')
    for (const p of ['dashboard', 'profile', 'hero', 'seasons', 'sections', 'navigation', 'projects', 'services', 'results', 'media', 'publish', 'seo', 'advanced', 'cursor', 'design', 'looks', 'languages', 'inbox', 'subscribers', 'insights', 'qualityScore', 'bulk', 'altText', 'team', 'server', 'applications', 'notes', 'announcement', 'engage', 'profilePage', 'maintenance', 'quality', 'extras', 'mediaDisplay', 'toolsDisplay', 'tools', 'platforms']) {
      await page.goto(`${base}/admin#/${p}`)
      await page.waitForTimeout(p === 'seasons' || p === 'publish' ? 2200 : 500)
      await audit(page, `admin ${p} ${tag}`)
    }
    // an open project editor with its nested groups
    await page.goto(`${base}/admin#/projects`)
    await page.getByRole('button', { name: /Add project/ }).first().click()
    await page.waitForSelector('text=Editing project')
    await page.getByRole('switch', { name: /This project has a case study/ }).click()
    await page.locator('summary:has-text("Content blocks")').click()
    await page.locator('#block-type').selectOption('chart')
    await page.getByRole('button', { name: /Add block/ }).click()
    await audit(page, `admin project editor ${tag}`)
    await ctx.close()
  }
  server.close()
  rmSync(dir, { recursive: true, force: true })
}
await browser.close()
console.log(total ? `\n${total} violation group(s)` : '\nNo accessibility violations found')
process.exit(total ? 1 : 0)
