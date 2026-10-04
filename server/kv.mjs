// Storage behind every server record. Files in the data folder by default; Postgres when DATABASE_URL is set.
// Each record is one named JSON document (content.json, users.json, enquiries.json ...), so both back ends
// behave the same and a backup is the same set of documents either way. Uploaded media files stay on disk.
import { existsSync } from 'node:fs'
import { chmod, copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { randomBytes } from 'node:crypto'

export function fileKv(dir) {
  return {
    kind: 'file', dir,
    async init() { await mkdir(dir, { recursive: true }) },
    /** Returns null when missing. Throws on a damaged file so it is never silently overwritten. */
    async read(name) {
      const file = join(dir, name)
      if (!existsSync(file)) return null
      try { return JSON.parse(await readFile(file, 'utf8')) } catch (e) { throw new Error(`${name} is unreadable (${e.message}). Restore ${name}.bak or fix the file.`, { cause: e }) }
    },
    async write(name, value, { backup = false } = {}) {
      const file = join(dir, name)
      const tmp = `${file}.${randomBytes(4).toString('hex')}.tmp`
      await writeFile(tmp, JSON.stringify(value), { mode: 0o600 })
      if (backup && existsSync(file)) await copyFile(file, `${file}.bak`).catch(() => {})
      await rename(tmp, file)
      await chmod(file, 0o600).catch(() => {})
    },
    async names() { return [] },
    async close() {},
  }
}

export async function postgresKv(url, { pool } = {}) {
  let p = pool
  if (!p) {
    const { default: pg } = await import('pg')
    p = new pg.Pool({ connectionString: url, max: 4, ssl: /sslmode=require|ssl=true/.test(url) ? { rejectUnauthorized: false } : undefined })
  }
  return {
    kind: 'postgres',
    async init() { await p.query('CREATE TABLE IF NOT EXISTS sam_kv (name text PRIMARY KEY, value jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())') },
    async read(name) { const r = await p.query('SELECT value FROM sam_kv WHERE name = $1', [name]); return r.rows[0]?.value ?? null },
    async write(name, value) {
      await p.query('INSERT INTO sam_kv (name, value) VALUES ($1, $2::jsonb) ON CONFLICT (name) DO UPDATE SET value = EXCLUDED.value, updated_at = now()', [name, JSON.stringify(value)])
    },
    async names() { return (await p.query('SELECT name FROM sam_kv')).rows.map((r) => r.name) },
    async close() { await p.end() },
  }
}

export async function createKv({ dataDir, env = process.env }) {
  const kv = env.DATABASE_URL ? await postgresKv(env.DATABASE_URL) : fileKv(dataDir)
  await kv.init()
  return kv
}

/** Accepts a ready kv or a folder path (used by tests and scripts). */
export const asKv = (x) => (typeof x === 'string' ? fileKv(x) : x)
