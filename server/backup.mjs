import { ZipArchive } from 'archiver'
import { createWriteStream, existsSync } from 'node:fs'
import { mkdir, readdir, readFile, rm, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { PassThrough } from 'node:stream'
import { putObject, s3FromEnv } from './s3.mjs'

const INCLUDE_FILES = ['content.json', 'settings.json', 'enquiries.json', 'subscribers.json', 'insights.json', 'snapshots.json', 'media.json']

/** Streams a zip of everything the owner would need to restore the site. Credentials are never included. */
export function backupStream(dataDir, kv) {
  const archive = new ZipArchive({ zlib: { level: 6 } })
  const out = new PassThrough()
  archive.on('error', (e) => out.destroy(e))
  archive.pipe(out)
  void (async () => {
    for (const f of INCLUDE_FILES) {
      const v = await kv.read(f).catch(() => null)
      if (v !== null) archive.append(JSON.stringify(v), { name: f })
    }
    if (existsSync(join(dataDir, 'uploads'))) archive.directory(join(dataDir, 'uploads'), 'uploads')
    await archive.finalize()
  })().catch((e) => out.destroy(e))
  return out
}

const stamp = (d = new Date()) => d.toISOString().replace(/[:T]/g, '-').slice(0, 19)

export function createBackups({ dataDir, kv, env = process.env, getSettings, fetchImpl = fetch }) {
  const dir = join(dataDir, 'backups')
  let timer = null
  let last = { at: null, ok: null, file: '', uploaded: false, error: '' }

  async function list() {
    if (!existsSync(dir)) return []
    const names = (await readdir(dir)).filter((n) => /^backup-.*\.zip$/.test(n)).sort().reverse()
    return Promise.all(names.map(async (name) => ({ name, size: (await stat(join(dir, name))).size })))
  }

  async function run() {
    const s = getSettings()
    await mkdir(dir, { recursive: true })
    const name = `backup-${stamp()}.zip`
    const path = join(dir, name)
    try {
      await new Promise((ok, bad) => { const w = createWriteStream(path); backupStream(dataDir, kv).pipe(w).on('finish', ok).on('error', bad) })
      let uploaded = false
      const s3 = s3FromEnv(env)
      if (s.backups.s3 && s3) {
        await putObject({ ...s3, key: `${s3.prefix}${name}`, body: await readFile(path), fetchImpl })
        uploaded = true
      }
      for (const old of (await list()).slice(s.backups.keep)) await rm(join(dir, old.name), { force: true })
      last = { at: new Date().toISOString(), ok: true, file: name, uploaded, error: '' }
    } catch (e) {
      await rm(path, { force: true })
      last = { at: new Date().toISOString(), ok: false, file: '', uploaded: false, error: e.message }
    }
    return last
  }

  return {
    list, run, path: (name) => (/^backup-[\d-]+\.zip$/.test(name) ? join(dir, name) : null),
    status: () => ({ ...last, s3Configured: !!s3FromEnv(env) }),
    /** (Re)arm the schedule from current settings. Safe to call whenever settings change. */
    schedule() {
      if (timer) clearInterval(timer)
      timer = null
      const s = getSettings()
      if (s.backups.enabled) { timer = setInterval(() => { void run() }, s.backups.everyHours * 3600 * 1000); timer.unref?.() }
    },
    stop() { if (timer) clearInterval(timer) },
  }
}
