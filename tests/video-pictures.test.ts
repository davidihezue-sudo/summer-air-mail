import { mkdtempSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { isVideoSrc } from '../src/utils/media'
import { createMedia } from '../server/media.mjs'

describe('short videos used as pictures', () => {
  it('tells a video file from a picture by its name', () => {
    expect(isVideoSrc('/uploads/me-1a2b.mp4')).toBe(true)
    expect(isVideoSrc('/uploads/me.WEBM?v=2')).toBe(true)
    expect(isVideoSrc('/uploads/me.webp')).toBe(false)
    expect(isVideoSrc('/uploads/video.png')).toBe(false)
    expect(isVideoSrc('')).toBe(false)
    expect(isVideoSrc(undefined)).toBe(false)
  })
})

describe('deleting from the library', () => {
  const setup = async () => {
    const dir = mkdtempSync(join(tmpdir(), 'sam-media-'))
    mkdirSync(join(dir, 'uploads'), { recursive: true })
    for (const f of ['clip.mp4', 'clip-poster.webp', 'pic.webp']) writeFileSync(join(dir, 'uploads', f), 'x')
    const mk = (id: string, url: string, type: string, extra = {}) => ({ id, url, filename: id, type, mime: '', size: 1, alt: '', caption: '', tags: [], projectIds: [], uploadedAt: '2026-01-01', ...extra })
    writeFileSync(join(dir, 'media.json'), JSON.stringify([mk('v', '/uploads/clip.mp4', 'video', { poster: '/uploads/clip-poster.webp' }), mk('p', '/uploads/clip-poster.webp', 'image'), mk('i', '/uploads/pic.webp', 'image')]))
    const media = createMedia(dir)
    await media.init()
    return { dir, media }
  }
  it('takes a video\'s cover picture with it', async () => {
    const { dir, media } = await setup()
    expect((await media.remove('v', () => false)).ok).toBe(true)
    expect(media.list().map((a: { id: string }) => a.id)).toEqual(['i'])
    expect(existsSync(join(dir, 'uploads', 'clip.mp4'))).toBe(false)
    expect(existsSync(join(dir, 'uploads', 'clip-poster.webp'))).toBe(false)
    expect(existsSync(join(dir, 'uploads', 'pic.webp'))).toBe(true)
  })
  it('keeps the cover when something else uses it, and refuses a file in use', async () => {
    const { media } = await setup()
    expect((await media.remove('v', (u: string) => u.endsWith('poster.webp'))).ok).toBe(true)
    expect(media.list().map((a: { id: string }) => a.id).sort()).toEqual(['i', 'p'])
    const r = await media.remove('i', () => true)
    expect(r.ok).toBe(false)
    expect(r.status).toBe(409)
  })
})
