import { api } from './api'
import type { Engine } from '../utils/translate'

/* eslint-disable @typescript-eslint/no-explicit-any */
const chromeTranslator = (): any => (globalThis as any).Translator

export type EngineChoice = 'auto' | 'chrome' | 'online'

/** Languages are matched on their first part: fr-CA and fr are both French. */
export const baseLang = (code: string) => code.toLowerCase().split('-')[0]

/** Whether this browser can translate on its own, with nothing sent anywhere. Chrome on a computer, version 138 or newer. */
export async function chromeAvailability(from: string, to: string): Promise<'unsupported' | 'unavailable' | 'downloadable' | 'downloading' | 'available'> {
  const T = chromeTranslator()
  if (!T || typeof T.availability !== 'function') return 'unsupported'
  try { return await T.availability({ sourceLanguage: baseLang(from), targetLanguage: baseLang(to) }) } catch { return 'unavailable' }
}

/** Chrome's own translator: free, runs on this computer, and the language file downloads once. Must be started from a click. */
export async function chromeEngine(from: string, to: string, onDownload?: (percent: number) => void): Promise<Engine> {
  const T = chromeTranslator()
  const t = await T.create({
    sourceLanguage: baseLang(from), targetLanguage: baseLang(to),
    monitor: (m: any) => m.addEventListener('downloadprogress', (e: any) => onDownload?.(Math.round((e.loaded ?? 0) * 100))),
  })
  return {
    name: 'Chrome, on this computer',
    translate: async (texts) => { const out: string[] = []; for (const s of texts) out.push(await t.translate(s)); return out },
  }
}

/** The free online service, called through your own server so nothing needs a key. Sentences go in small batches. */
export function onlineEngine(from: string, to: string, email: string): Engine {
  return {
    name: 'the free online service (MyMemory)',
    translate: async (texts) => {
      const out: string[] = []
      let batch: string[] = []
      let size = 0
      const flush = async () => {
        if (!batch.length) return
        try { out.push(...(await api.translate(batch, baseLang(from), baseLang(to), email)).texts) } catch (e) {
          // Running out of the day's allowance stops the whole run, with what was done kept.
          const err = e as Error & { status?: number }
          throw Object.assign(err, { fatal: err.status === 429 || err.status === 502 || err.status === 400 })
        }
        batch = []; size = 0
      }
      for (const t of texts) {
        if (batch.length >= 25 || size + t.length > 15000) await flush()
        batch.push(t); size += t.length
      }
      await flush()
      return out
    },
  }
}
