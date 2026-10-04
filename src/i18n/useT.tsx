import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { LanguagePack } from '../content/types'
import { UI_DEFAULTS, type UiKey } from './ui'

interface LangCtx {
  lang: string
  languages: { code: string; label: string }[]
  setLang: (code: string) => void
  t: (key: UiKey) => string
  rtl: boolean
}
const Ctx = createContext<LangCtx>({ lang: '', languages: [], setLang: () => {}, t: (k) => UI_DEFAULTS[k], rtl: false })

export function LangProvider({ pack, languages, lang, setLang, children }: { pack?: LanguagePack; languages: LangCtx['languages']; lang: string; setLang: (c: string) => void; children: ReactNode }) {
  const value = useMemo<LangCtx>(() => ({
    lang, languages, setLang, rtl: !!pack?.rtl,
    t: (k) => (pack?.ui?.[k]?.trim() ? pack.ui[k] : UI_DEFAULTS[k]),
  }), [pack, languages, lang, setLang])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export const useT = () => useContext(Ctx)
