// Creates the admin login. The password is hashed with scrypt; the plain password is never stored.
//   npm run admin:setup                       (interactive)
//   npm run admin:hash                        (prints a hash for ADMIN_PASSWORD_HASH on hosts without a disk)
//   ADMIN_USERNAME=me ADMIN_PASSWORD='...' npm run admin:setup   (non-interactive)
import { createInterface } from 'node:readline'
import { resolve } from 'node:path'
import { createAuth, hashPassword, passwordProblem } from '../server/auth.mjs'
import { createKv } from '../server/kv.mjs'

const hashOnly = process.argv.includes('--hash')
const dir = resolve(process.env.DATA_DIR ?? 'data')

function ask(question, hidden = false) {
  return new Promise((done) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    if (hidden) {
      rl._writeToOutput = (s) => { if (s.includes(question)) rl.output.write(s); else if (/\r|\n/.test(s)) rl.output.write(s) }
    }
    rl.question(question, (a) => { rl.close(); done(a) })
  })
}

const username = process.env.ADMIN_USERNAME || (await ask('Admin username: '))
let password = process.env.ADMIN_PASSWORD
if (!password) {
  password = await ask('Password (at least 12 characters): ', true)
  const again = await ask('Repeat password: ', true)
  if (password !== again) { console.error('Passwords did not match.'); process.exit(1) }
}
const problem = passwordProblem(password)
if (!username.trim()) { console.error('Username is required.'); process.exit(1) }
if (problem) { console.error(problem); process.exit(1) }

if (hashOnly) {
  console.log(`\nSet these environment variables on your host:\nADMIN_USERNAME=${username}\nADMIN_PASSWORD_HASH=${await hashPassword(password)}\n`)
} else {
  const kv = await createKv({ dataDir: dir })
  await createAuth({ dir, kv }).setCredentials(username.trim(), password)
  await kv.close()
  console.log(`\nAdmin account saved ${kv.kind === 'postgres' ? 'in your Postgres database' : `to ${resolve(dir, 'admin.json')}`}. Sign in at /admin.`)
}
