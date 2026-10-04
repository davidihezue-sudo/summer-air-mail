// One command for everyday use: get the latest code, install anything new, then start the site so a phone on the same Wi-Fi can open it.
//   npm run go
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'

const win = process.platform === 'win32'
const run = (cmd, args) => spawnSync(cmd, args, { stdio: 'inherit', shell: win })

if (existsSync('.git')) {
  console.log('\n[1/3] Getting the latest code from GitHub...')
  const pull = run('git', ['pull', '--ff-only'])
  if (pull.status !== 0) {
    console.log('\nGit could not update automatically (you may have local changes or no connection).')
    console.log('Carrying on with the code you have. If you expected an update, run "git status" and ask for help.\n')
  }
} else console.log('\n[1/3] Not a git folder, skipping the update.')

console.log('\n[2/3] Checking packages...')
if (run('npm', ['install', '--no-audit', '--no-fund']).status !== 0) { console.error('\nnpm install failed. Fix the message above and run "npm run go" again.'); process.exit(1) }

console.log('\n[3/3] Starting the site. Press Ctrl+C to stop it.\n')
const dev = run('node', ['scripts/dev-all.mjs', '--host'])
process.exit(dev.status ?? 0)
