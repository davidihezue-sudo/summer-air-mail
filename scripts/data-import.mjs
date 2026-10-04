// Copies an old data folder into the store this project now uses (Postgres if DATABASE_URL is set, otherwise files).
//   npm run data:import -- "C:\\path\\to\\old-project\\data"
// Existing records in the new store are replaced by the old ones, so run it on an empty or throwaway store.
import '../server/loadenv.mjs'
import { cpSync, existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createKv } from '../server/kv.mjs'
import { defaultDataDir } from '../server/index.mjs'

const from = process.argv[2]
if (!from || !existsSync(from)) {
  console.error('Give the path of the old data folder, for example:\n  npm run data:import -- "C:\\Users\\you\\old-project\\data"')
  process.exit(1)
}
const FILES = ['content.json', 'admin.json', 'users.json', 'enquiries.json', 'subscribers.json', 'insights.json', 'snapshots.json', 'settings.json', 'media.json']
const dataDir = resolve(process.env.DATA_DIR ?? defaultDataDir())
const kv = await createKv({ dataDir })
let n = 0
for (const f of FILES) {
  const p = join(from, f)
  if (!existsSync(p)) continue
  try { await kv.write(f, JSON.parse(readFileSync(p, 'utf8'))); n++; console.log(`  imported ${f}`) } catch (e) { console.warn(`  skipped ${f}: ${e.message}`) }
}
if (existsSync(join(from, 'uploads')) && resolve(from) !== dataDir) { cpSync(join(from, 'uploads'), join(dataDir, 'uploads'), { recursive: true }); console.log('  copied uploads/') }
await kv.close()
console.log(`\nDone. ${n} record file${n === 1 ? '' : 's'} moved into ${kv.kind === 'postgres' ? 'your Postgres database' : dataDir}.`)
