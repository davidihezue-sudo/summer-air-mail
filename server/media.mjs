import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, extname } from 'node:path'
import { randomBytes } from 'node:crypto'

/** Identify a file by its content, never by its name or the browser supplied type. */
export function sniff(buf) {
  if (buf.length < 12) return null
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { kind: 'image', ext: 'jpg', mime: 'image/jpeg' }
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { kind: 'image', ext: 'png', mime: 'image/png' }
  if (buf.subarray(0, 4).toString('latin1') === 'GIF8') return { kind: 'image', ext: 'gif', mime: 'image/gif' }
  if (buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') return { kind: 'image', ext: 'webp', mime: 'image/webp' }
  if (buf.subarray(4, 8).toString('latin1') === 'ftyp') return { kind: 'video', ext: 'mp4', mime: 'video/mp4' }
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return { kind: 'video', ext: 'webm', mime: 'video/webm' }
  if (buf.subarray(0, 5).toString('latin1') === '%PDF-') return { kind: 'pdf', ext: 'pdf', mime: 'application/pdf' }
  return null
}

const slugify = (s) => s.toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'file'

let sharpMod
async function getSharp() {
  if (sharpMod === undefined) {
    try { sharpMod = (await import('sharp')).default } catch { sharpMod = null }
  }
  return sharpMod
}

export function createMedia(dir) {
  const uploads = join(dir, 'uploads')
  const registryFile = join(dir, 'media.json')
  let items = []
  let queue = Promise.resolve()
  const persist = () => (queue = queue.then(async () => {
    const tmp = `${registryFile}.tmp`
    await writeFile(tmp, JSON.stringify(items))
    await rename(tmp, registryFile)
  }))

  return {
    uploads,
    async init() {
      await mkdir(uploads, { recursive: true })
      if (existsSync(registryFile)) {
        try { items = JSON.parse(await readFile(registryFile, 'utf8')) } catch { items = [] }
      }
    },
    list: () => items.slice().sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)),
    async add(buf, originalName, fields = {}) {
      const type = sniff(buf)
      if (!type) throw Object.assign(new Error('Unsupported file. Upload JPG, PNG, WebP, GIF, MP4, WebM or PDF.'), { status: 415 })
      let out = buf
      let ext = type.ext
      let mime = type.mime
      let width, height
      if (type.kind === 'image' && type.ext !== 'gif') {
        const sharp = await getSharp()
        if (sharp) {
          // Re-encode: strips metadata (including location), fixes orientation, caps the size, converts to WebP.
          const img = sharp(buf, { failOn: 'error' }).rotate().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
          const res = await img.webp({ quality: 84, alphaQuality: 90 }).toBuffer({ resolveWithObject: true })
          out = res.data; ext = 'webp'; mime = 'image/webp'
          width = res.info.width; height = res.info.height
        }
      }
      const name = `${slugify(originalName || 'file')}-${randomBytes(4).toString('hex')}.${ext}`
      await writeFile(join(uploads, name), out, { mode: 0o644 })
      const asset = {
        id: randomBytes(6).toString('hex'), url: `/uploads/${name}`, filename: originalName ? originalName.slice(0, 120) : name,
        type: type.kind, mime, size: out.length, ...(width ? { width, height } : {}),
        alt: String(fields.alt ?? '').slice(0, 300), caption: String(fields.caption ?? '').slice(0, 500),
        tags: [], projectIds: [], uploadedAt: new Date().toISOString(),
      }
      items.push(asset)
      await persist()
      return asset
    },
    async update(id, patch) {
      const a = items.find((x) => x.id === id)
      if (!a) return null
      if (typeof patch.alt === 'string') a.alt = patch.alt.slice(0, 300)
      if (typeof patch.caption === 'string') a.caption = patch.caption.slice(0, 500)
      if (Array.isArray(patch.tags)) a.tags = patch.tags.filter((t) => typeof t === 'string').map((t) => t.slice(0, 40)).slice(0, 20)
      if (Array.isArray(patch.projectIds)) a.projectIds = patch.projectIds.filter((t) => typeof t === 'string').slice(0, 100)
      await persist()
      return a
    },
    async remove(id, isUsed) {
      const a = items.find((x) => x.id === id)
      if (!a) return { ok: false, status: 404, error: 'Not found.' }
      if (isUsed(a.url)) return { ok: false, status: 409, error: 'This file is used by saved content. Remove it from the content first.' }
      items = items.filter((x) => x.id !== id)
      await persist()
      await rm(join(uploads, a.url.replace('/uploads/', '')), { force: true })
      return { ok: true }
    },
    extname,
    flush: () => queue,
  }
}
