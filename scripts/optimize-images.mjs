// Converts JPG and PNG files in public/images to WebP (transparency kept) and caps width at 2000px.
// Usage: npm run images   then point portfolio.config.ts at the new .webp files.
import sharp from 'sharp'
import { readdirSync, statSync } from 'node:fs'
import { extname, join, parse } from 'node:path'

const ROOT = 'public/images'
const MAX_WIDTH = 2000

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

let count = 0
for (const file of walk(ROOT)) {
  if (!['.jpg', '.jpeg', '.png'].includes(extname(file).toLowerCase())) continue
  const out = join(parse(file).dir, `${parse(file).name}.webp`)
  const info = await sharp(file).resize({ width: MAX_WIDTH, withoutEnlargement: true }).webp({ quality: 82, alphaQuality: 90 }).toFile(out)
  console.log(`${file} -> ${out} (${Math.round(info.size / 1024)} KB, ${info.width}x${info.height})`)
  count++
}
console.log(count ? `Done. ${count} image(s) converted.` : `No JPG or PNG files found in ${ROOT}.`)
