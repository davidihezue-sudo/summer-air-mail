// Shrinks large videos so they can be uploaded and played on a phone: H.264 in an MP4, at most 1080 pixels on the longer side,
// no location or camera metadata, quick start. Uses ffmpeg-static (installed with npm) or an ffmpeg already on the machine.
import { spawn, spawnSync } from 'node:child_process'

let found
export async function findFfmpeg() {
  if (found !== undefined) return found
  found = null
  try {
    const m = await import('ffmpeg-static')
    const p = m.default
    if (p && spawnSync(p, ['-version']).status === 0) found = p
  } catch { /* the package or its binary is not there */ }
  if (!found && spawnSync('ffmpeg', ['-version']).status === 0) found = 'ffmpeg'
  return found
}
export const resetFfmpegCache = () => { found = undefined }

/** Reads size, duration and codecs from ffmpeg's own report. */
export function probe(ffmpeg, file) {
  return new Promise((resolve) => {
    const p = spawn(ffmpeg, ['-nostdin', '-i', file], { stdio: ['ignore', 'ignore', 'pipe'] })
    let err = ''
    p.stderr.on('data', (d) => { if (err.length < 200000) err += d })
    p.on('close', () => {
      const dur = /Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/.exec(err)
      const dim = /Video:[^\n]*?, (\d{2,5})x(\d{2,5})/.exec(err)
      const rot = /rotate\s*:\s*(-?\d+)/.exec(err)
      let width = dim ? Number(dim[1]) : 0
      let height = dim ? Number(dim[2]) : 0
      if (rot && Math.abs(Number(rot[1])) % 180 === 90) [width, height] = [height, width]
      resolve({
        seconds: dur ? Number(dur[1]) * 3600 + Number(dur[2]) * 60 + Number(dur[3]) : 0, width, height,
        video: /Video: (\w+)/.exec(err)?.[1] ?? '', audio: /Audio: (\w+)/.exec(err)?.[1] ?? '', hasVideo: !!dim,
      })
    })
    p.on('error', () => resolve({ seconds: 0, width: 0, height: 0, video: '', audio: '', hasVideo: false }))
  })
}

/** Keep a video untouched only when it is already small, already H.264 in an MP4, and not larger than full HD. */
export function needsOptimizing({ ext, size, info, maxSide = 1920, keepBelow = 25 * 1024 * 1024 }) {
  if (!info.hasVideo) return true
  if (ext !== 'mp4') return true
  if (info.video !== 'h264') return true
  if (Math.max(info.width, info.height) > maxSide) return true
  return size > keepBelow
}

let chain = Promise.resolve()
/** Runs one conversion at a time so a big batch cannot swamp a small server. */
export function transcode({ ffmpeg, input, output, info, maxSide = 1080, crf = 27, onProgress = () => {}, timeoutMs = 45 * 60 * 1000 }) {
  const job = chain.then(() => new Promise((resolve, reject) => {
    // Scale the longer side down to maxSide, keep the shape, never enlarge.
    const long = Math.max(info.width, info.height)
    const scale = long > maxSide ? (info.width >= info.height ? `scale=${maxSide}:-2` : `scale=-2:${maxSide}`) : 'scale=trunc(iw/2)*2:trunc(ih/2)*2'
    const args = ['-nostdin', '-y', '-i', input, '-map', '0:v:0', '-map', '0:a:0?', '-vf', scale, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', String(crf), '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '128k', '-map_metadata', '-1', '-movflags', '+faststart', '-progress', 'pipe:1', '-nostats', output]
    const p = spawn(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let err = ''
    p.stderr.on('data', (d) => { if (err.length < 20000) err += d })
    let buf = ''
    p.stdout.on('data', (d) => {
      buf += d
      const lines = buf.split('\n'); buf = lines.pop() ?? ''
      for (const l of lines) {
        const m = /^out_time_(?:us|ms)=(\d+)/.exec(l)
        if (m && info.seconds) onProgress(Math.min(0.99, Number(m[1]) / 1e6 / info.seconds))
      }
    })
    const timer = setTimeout(() => p.kill('SIGKILL'), timeoutMs)
    p.on('error', (e) => { clearTimeout(timer); reject(e) })
    p.on('close', (code) => { clearTimeout(timer); if (code === 0) resolve()
      else reject(new Error(`ffmpeg failed: ${err.split('\n').slice(-4).join(' ').slice(0, 300)}`)) })
  }))
  chain = job.catch(() => {})
  return job
}

/** One still frame, used as the video's cover image. */
export function posterFrame({ ffmpeg, input, output, atSeconds = 1 }) {
  return new Promise((resolve) => {
    const p = spawn(ffmpeg, ['-nostdin', '-y', '-ss', String(atSeconds), '-i', input, '-frames:v', '1', '-vf', 'scale=720:-2', '-q:v', '3', output], { stdio: 'ignore' })
    p.on('error', () => resolve(false))
    p.on('close', (code) => resolve(code === 0))
  })
}
