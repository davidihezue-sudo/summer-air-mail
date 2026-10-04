// Runs the API server and the Vite dev server together for local development.
//   npm run dev:all     this computer only
//   npm run dev:phone   also reachable from phones and tablets on the same Wi-Fi
import { spawn } from 'node:child_process'
import { networkInterfaces } from 'node:os'

const lan = process.argv.includes('--host')
const run = (cmd, args) => spawn(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' })
const procs = [run('node', ['--watch', 'server/index.mjs']), run('npx', ['vite', '--configLoader', 'runner', ...(lan ? ['--host'] : [])])]

if (lan) {
  const urls = Object.values(networkInterfaces()).flat().filter((i) => i && i.family === 'IPv4' && !i.internal).map((i) => `http://${i.address}:5173`)
  setTimeout(() => {
    console.log('\n  On your phone (same Wi-Fi), open one of:')
    for (const u of urls) console.log(`    ${u}        admin: ${u}/admin`)
    console.log('  Anyone on this network can reach the site while this runs. The admin still needs your login.\n')
  }, 2500)
}

const stop = () => procs.forEach((p) => p.kill())
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
procs.forEach((p) => p.on('exit', stop))
