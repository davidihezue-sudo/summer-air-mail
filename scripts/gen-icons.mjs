// Renders the home-screen icons from public/favicon.svg. The artwork is used exactly as it is;
// only the canvas around it changes. Run with `npm run icons` and commit the PNGs in public/.
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import sharp from 'sharp'

const pub = fileURLToPath(new URL('../public/', import.meta.url))
const svg = await readFile(join(pub, 'favicon.svg'))
// The favicon's own background colour, read from the file so nothing is hard-coded twice.
const cream = /<rect width="64" height="64"[^>]*fill="(#[0-9a-f]{6})"/i.exec(svg.toString())?.[1]
if (!cream) throw new Error('Could not read the background colour from favicon.svg')

const render = (size) => sharp(svg, { density: Math.ceil((72 * size) / 64) * 2 }).resize(size, size).png()
const out = (name, buf) => writeFile(join(pub, name), buf)

// Same artwork at the sizes Android and browsers ask for. The favicon's rounded corners stay transparent.
await out('icon-192.png', await render(192).toBuffer())
await out('icon-512.png', await render(512).toBuffer())

// iOS fills transparent pixels with black, so the corners sit on the icon's own cream. iOS rounds the corners itself.
await out('apple-touch-icon.png', await sharp({ create: { width: 180, height: 180, channels: 4, background: cream } })
  .composite([{ input: await render(180).toBuffer() }]).png().toBuffer())

// Maskable: Android may crop to a circle of 40% of the width, so the green card (the part that matters)
// must sit inside it. The card's corners are 32.56 of 64 units from the centre, which gives a 78% scale.
const art = Math.floor((512 * 0.4) / (32.56 / 64) / 2) * 2
await out('icon-maskable-512.png', await sharp({ create: { width: 512, height: 512, channels: 4, background: cream } })
  .composite([{ input: await render(art).toBuffer(), gravity: 'centre' }]).png().toBuffer())

console.log(`Wrote apple-touch-icon.png, icon-192.png, icon-512.png, icon-maskable-512.png (maskable artwork ${art}px of 512)`)
