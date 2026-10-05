import { mkdir, rename, rm, writeFile } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { randomBytes } from 'node:crypto'
import { asKv } from './kv.mjs'
import { findFfmpeg, probe, needsOptimizing, transcode, posterFrame } from './video.mjs'
import { stat, readFile as readFileFs, open } from 'node:fs/promises'

/** Identify a file by its content, never by its name or the browser supplied type. */
export function sniff(buf) {
  if (buf.length < 12) return null
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { kind: 'image', ext: 'jpg', mime: 'image/jpeg' }
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { kind: 'image', ext: 'png', mime: 'image/png' }
  if (buf.subarray(0, 4).toString('latin1') === 'GIF8') return { kind: 'image', ext: 'gif', mime: 'image/gif' }
  if (buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') return { kind: 'image', ext: 'webp', mime: 'image/webp' }
  if (buf.subarray(4, 8).toString('latin1') === 'ftyp') {
    const brand = buf.subarray(8, 12).toString('latin1')
    if (brand === 'qt  ') return { kind: 'video', ext: 'mov', mime: 'video/quicktime' }
    if (/^(heic|heix|mif1|avif)/.test(brand)) return null
    return { kind: 'video', ext: 'mp4', mime: 'video/mp4' }
  }
  if (buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 11).toString('latin1') === 'AVI') return { kind: 'video', ext: 'avi', mime: 'video/x-msvideo' }
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return buf.subarray(0, 64).toString('latin1').includes('matroska') ? { kind: 'video', ext: 'mkv', mime: 'video/x-matroska' } : { kind: 'video', ext: 'webm', mime: 'video/webm' }
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

export function createMedia(dir, kvIn) {
  const kv = asKv(kvIn ?? dir)
  const uploads = join(dir, 'uploads')
  let items = []
  const jobs = new Map()
  let queue = Promise.resolve()
  const persist = () => (queue = queue.then(() => kv.write('media.json', items)))

  return {
    uploads,
    async init() {
      await mkdir(uploads, { recursive: true })
      await rm(join(dir, 'tmp'), { recursive: true, force: true })
      await mkdir(join(dir, 'tmp'), { recursive: true })
      try { const v = await kv.read('media.json'); items = Array.isArray(v) ? v : [] } catch { items = [] }
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
    /** Registers a file that is already on disk (a big upload). Videos are shrunk first. Returns { asset } or { job }. */
    async addFromDisk(tmpPath, originalName, fields = {}, { maxPlainBytes }) {
      const { size } = await stat(tmpPath)
      const fh = await open(tmpPath, 'r')
      const head = Buffer.alloc(64)
      await fh.read(head, 0, 64, 0)
      await fh.close()
      const type = sniff(head)
      if (!type) { await rm(tmpPath, { force: true }); throw Object.assign(new Error('Unsupported file. Upload JPG, PNG, WebP, GIF, PDF, or a video (MP4, MOV, WebM, MKV, AVI).'), { status: 415 }) }
      if (type.kind !== 'video') {
        if (size > maxPlainBytes) { await rm(tmpPath, { force: true }); throw Object.assign(new Error(`That file is larger than ${Math.round(maxPlainBytes / 1048576)} MB.`), { status: 413 }) }
        const buf = await readFileFs(tmpPath)
        await rm(tmpPath, { force: true })
        return { asset: await this.add(buf, originalName, fields) }
      }
      const ffmpeg = await findFfmpeg()
      const info = ffmpeg ? await probe(ffmpeg, tmpPath) : null
      if (!ffmpeg || !info?.hasVideo) {
        // Without ffmpeg only small, web ready files can be kept as they are.
        if (size > maxPlainBytes || !['mp4', 'webm'].includes(type.ext)) {
          await rm(tmpPath, { force: true })
          throw Object.assign(new Error(ffmpeg ? 'That video could not be read.' : `Large or unusual videos need ffmpeg to be shrunk. Run npm install again (it adds ffmpeg), or upload an MP4 under ${Math.round(maxPlainBytes / 1048576)} MB.`), { status: 415 })
        }
      }
      const jobId = randomBytes(6).toString('hex')
      const job = { id: jobId, status: 'processing', progress: 0, filename: originalName ? originalName.slice(0, 120) : 'video', asset: null, error: '', note: '' }
      jobs.set(jobId, job)
      for (const k of [...jobs.keys()].slice(0, Math.max(0, jobs.size - 40))) jobs.delete(k)
      void (async () => {
        try {
          const base = `${slugify(originalName || 'video')}-${randomBytes(4).toString('hex')}`
          const keep = !ffmpeg || !info.hasVideo ? true : !needsOptimizing({ ext: type.ext, size, info })
          let finalName = `${base}.${keep ? type.ext : 'mp4'}`
          const finalPath = join(uploads, finalName)
          if (keep) { await rename(tmpPath, finalPath).catch(async () => { await writeFile(finalPath, await readFileFs(tmpPath)); await rm(tmpPath, { force: true }) }) }
          else {
            await transcode({ ffmpeg, input: tmpPath, output: finalPath, info, onProgress: (p) => { job.progress = p } })
            await rm(tmpPath, { force: true })
          }
          const out = await stat(finalPath)
          let posterUrl
          if (ffmpeg) {
            const posterName = `${base}-poster.jpg`
            if (await posterFrame({ ffmpeg, input: finalPath, output: join(uploads, posterName), atSeconds: Math.min(1, (info?.seconds ?? 2) / 3) })) {
              const sharp = await getSharp()
              let pn = posterName
              let pbuf = await readFileFs(join(uploads, posterName))
              let pw, ph
              if (sharp) {
                const r = await sharp(pbuf).webp({ quality: 82 }).toBuffer({ resolveWithObject: true })
                pn = `${base}-poster.webp`; pbuf = r.data; pw = r.info.width; ph = r.info.height
                await rm(join(uploads, posterName), { force: true })
                await writeFile(join(uploads, pn), pbuf, { mode: 0o644 })
              }
              const pa = { id: randomBytes(6).toString('hex'), url: `/uploads/${pn}`, filename: `${base}-poster`, type: 'image', mime: sharp ? 'image/webp' : 'image/jpeg', size: pbuf.length, ...(pw ? { width: pw, height: ph } : {}), alt: '', caption: '', tags: ['video cover'], projectIds: [], uploadedAt: new Date().toISOString() }
              items.push(pa)
              posterUrl = pa.url
            }
          }
          const w = keep ? info?.width : (info.width >= info.height ? Math.min(info.width, 1080) : Math.round((info.width * Math.min(info.height, 1080)) / info.height))
          const h = keep ? info?.height : (info.width >= info.height ? Math.round((info.height * Math.min(info.width, 1080)) / info.width) : Math.min(info.height, 1080))
          const asset = {
            id: randomBytes(6).toString('hex'), url: `/uploads/${finalName}`, filename: originalName ? originalName.slice(0, 120) : finalName,
            type: 'video', mime: 'video/mp4', size: out.size, ...(w ? { width: w, height: h } : {}), ...(posterUrl ? { poster: posterUrl } : {}),
            alt: String(fields.alt ?? '').slice(0, 300), caption: String(fields.caption ?? '').slice(0, 500), tags: [], projectIds: [], uploadedAt: new Date().toISOString(),
          }
          items.push(asset)
          await persist()
          job.asset = asset
          job.note = keep ? 'Kept as uploaded.' : `Shrunk from ${(size / 1048576).toFixed(1)} MB to ${(out.size / 1048576).toFixed(1)} MB.`
          job.progress = 1
          job.status = 'done'
        } catch (e) {
          await rm(tmpPath, { force: true })
          job.status = 'error'
          job.error = e instanceof Error ? e.message.slice(0, 300) : 'Could not process that video.'
        }
      })()
      return { job: { id: jobId } }
    },
    job: (id) => { const j = jobs.get(id); return j ? { id: j.id, status: j.status, progress: j.progress, filename: j.filename, asset: j.asset, error: j.error, note: j.note } : null },
    tmpDir: join(dir, 'tmp'),
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
      const cover = a.type === 'video' && a.poster ? items.find((x) => x.url === a.poster) : null
      const dropCover = cover && !isUsed(cover.url)
      items = items.filter((x) => x.id !== id && !(dropCover && x.id === cover.id))
      await persist()
      await rm(join(uploads, a.url.replace('/uploads/', '')), { force: true })
      if (dropCover) await rm(join(uploads, cover.url.replace('/uploads/', '')), { force: true })
      return { ok: true }
    },
    extname,
    flush: () => queue,
  }
}
