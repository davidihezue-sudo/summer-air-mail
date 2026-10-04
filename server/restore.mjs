// Restores a backup zip made by Server & Backups: your content, messages, subscribers, settings and uploaded files.
// Logins and password hashes are never in a backup, so a restore can never change who can sign in.
import { unzipSync } from 'fflate'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export const RESTORE_FILES = ['content.json', 'settings.json', 'enquiries.json', 'subscribers.json', 'insights.json', 'snapshots.json', 'media.json']
const SAFE_UPLOAD = /^uploads\/[A-Za-z0-9][A-Za-z0-9._-]{0,200}$/

/** Only these names are read out of the zip, so a crafted archive cannot write anywhere else. */
const wanted = (name) => RESTORE_FILES.includes(name) || SAFE_UPLOAD.test(name)

export async function restoreBackup(buffer, { kv, dataDir }) {
  let files
  try { files = unzipSync(new Uint8Array(buffer), { filter: (f) => wanted(f.name) }) } catch { throw Object.assign(new Error('That does not look like a backup zip from this site.'), { status: 400 }) }
  const names = Object.keys(files)
  if (!names.includes('content.json')) throw Object.assign(new Error('That zip has no content.json, so it is not a backup from this site.'), { status: 400 })
  const parsed = {}
  for (const f of RESTORE_FILES) {
    if (!files[f]) continue
    try { parsed[f] = JSON.parse(Buffer.from(files[f]).toString('utf8')) } catch { throw Object.assign(new Error(`${f} in the zip is damaged.`), { status: 400 }) }
  }
  if (typeof parsed['content.json'] !== 'object' || parsed['content.json'] === null) throw Object.assign(new Error('content.json in the zip is not valid.'), { status: 400 })
  await mkdir(join(dataDir, 'uploads'), { recursive: true })
  let uploads = 0
  for (const n of names) {
    if (!SAFE_UPLOAD.test(n)) continue
    await writeFile(join(dataDir, n), files[n], { mode: 0o644 })
    uploads++
  }
  for (const [f, v] of Object.entries(parsed)) await kv.write(f, v)
  return { records: Object.keys(parsed).length, uploads }
}
