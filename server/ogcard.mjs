// Share preview cards (1200 by 630): what shows when a link is pasted into LinkedIn, WhatsApp, Slack or an email.
// Drawn on the server from the page's own title, in the site's three fonts, so every page has a card with no work from the owner.
import sharp from 'sharp'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const dir = fileURLToPath(new URL('./fonts/', import.meta.url))
const FONT = {
  display: { family: 'Italiana', file: join(dir, 'Italiana-Regular.ttf') },
  script: { family: 'Pinyon Script', file: join(dir, 'PinyonScript-Regular.ttf') },
  body: { family: 'Figtree Medium', file: join(dir, 'Figtree-Medium.ttf') },
  bold: { family: 'Figtree Bold', file: join(dir, 'Figtree-Bold.ttf') },
}
const W = 1200
const H = 630
const INK = '#17323F'
const RED = '#B5262E'
const SAND = '#EED9B4'
const PAPER = '#FBF4E4'

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const clip = (s, n) => { const t = String(s ?? '').replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1).trimEnd()}...` : t }

/** One piece of text as a transparent image, drawn with a font file so the right typeface is used on any machine. */
async function text(value, { font, size, color, width, height, align = 'left' }) {
  if (!String(value ?? '').trim()) return null
  return sharp({ text: { text: `<span foreground="${color}" font_size="${size * 1024}">${esc(value)}</span>`, font: font.family, fontfile: font.file, width, height, align, rgba: true, wrap: 'word' } }).png().toBuffer()
}

/** A stamp edge: a row of round notches around the paper card. */
function frameSvg() {
  const dots = []
  for (let x = 18; x < W; x += 24) { dots.push(`<circle cx="${x}" cy="8" r="6"/>`, `<circle cx="${x}" cy="${H - 8}" r="6"/>`) }
  for (let y = 18; y < H; y += 24) { dots.push(`<circle cx="8" cy="${y}" r="6"/>`, `<circle cx="${W - 8}" cy="${y}" r="6"/>`) }
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${PAPER}"/><g fill="${SAND}">${dots.join('')}</g><rect x="26" y="26" width="${W - 52}" height="${H - 52}" rx="6" fill="none" stroke="${INK}" stroke-width="3"/><rect x="0" y="${H - 14}" width="${W}" height="14" fill="${RED}"/></svg>`)
}

/**
 * Draw a card. `image` is an optional picture (a Buffer) shown as a framed print on the right.
 * Returns a PNG Buffer.
 */
export async function renderCard({ title, kicker = '', subtitle = '', name = '', host = '', image = null }) {
  const hasImage = !!image
  const textW = hasImage ? 640 : 1020
  const layers = [{ input: frameSvg(), left: 0, top: 0 }]
  if (hasImage) {
    const picW = 380
    const picH = 440
    const pic = await sharp(image).rotate().resize(picW, picH, { fit: 'cover' }).png().toBuffer()
    const frame = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${picW + 28}" height="${picH + 28}"><rect width="100%" height="100%" rx="4" fill="#fff" stroke="${INK}" stroke-width="3"/></svg>`)
    layers.push({ input: frame, left: 740 - 14 + 40, top: 95 - 14 }, { input: pic, left: 780, top: 95 })
  }
  const kick = await text(String(kicker).toUpperCase(), { font: FONT.bold, size: 22, color: RED, width: textW, height: 40 })
  const big = await text(clip(title, 90), { font: FONT.display, size: String(title ?? '').length > 46 ? 58 : 72, color: INK, width: textW, height: 250 })
  const sub = await text(clip(subtitle, 120), { font: FONT.body, size: 28, color: INK, width: textW, height: 90 })
  const who = await text(name, { font: FONT.script, size: 46, color: RED, width: 560, height: 80 })
  const site = await text(host, { font: FONT.bold, size: 22, color: INK, width: 380, height: 40, align: 'right' })
  if (kick) layers.push({ input: kick, left: 70, top: 80 })
  if (big) layers.push({ input: big, left: 70, top: 142 })
  if (sub) layers.push({ input: sub, left: 70, top: 410 })
  if (who) layers.push({ input: who, left: 70, top: 520 })
  if (site) layers.push({ input: site, left: hasImage ? 70 + textW - 380 : W - 70 - 380, top: 548 })
  return sharp({ create: { width: W, height: H, channels: 3, background: PAPER } }).composite(layers).png({ compressionLevel: 9 }).toBuffer()
}

export async function readPicture(path) {
  try { return await readFile(path) } catch { return null }
}
