// Runs the API server and the Vite dev server together for local development.
import { spawn } from 'node:child_process'

const run = (cmd, args) => spawn(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' })
const procs = [run('node', ['--watch', 'server/index.mjs']), run('npx', ['vite', '--configLoader', 'runner'])]
const stop = () => procs.forEach((p) => p.kill())
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
procs.forEach((p) => p.on('exit', stop))
