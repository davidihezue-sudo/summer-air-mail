// Reads a .env file from the project folder into process.env (existing variables win).
// Imported first by the server and the scripts so DATABASE_URL, SMTP_* and the rest work without any extra tool.
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export function parseEnv(text) {
  const out = {}
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const i = line.indexOf('=')
    if (i < 1) continue
    const key = line.slice(0, i).trim()
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue
    let val = line.slice(i + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1)
    else val = val.replace(/\s+#.*$/, '')
    out[key] = val
  }
  return out
}

export function loadEnv(file = resolve('.env'), target = process.env) {
  if (!existsSync(file)) return []
  const loaded = []
  for (const [k, v] of Object.entries(parseEnv(readFileSync(file, 'utf8')))) {
    if (target[k] === undefined && v !== '') { target[k] = v; loaded.push(k) }
  }
  return loaded
}

loadEnv()
