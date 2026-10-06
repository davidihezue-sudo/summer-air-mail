import { useEffect } from 'react'
import { UI_DEFAULTS } from './ui'

const ATTRS = ['placeholder', 'aria-label', 'title'] as const
const SKIP = 'script, style, textarea, input, [translate="no"], .no-translate'

/**
 * Swaps the fixed wording built into the page (section headings, filter and form labels, buttons, season titles) for the chosen
 * language, using a pack's entries that are keyed by the English text. Only exact matches are swapped, in place, so React keeps
 * working normally; if React later writes new text the swap is applied again, and going back to English restores everything.
 */
export function DomTranslate({ ui }: { ui?: Record<string, string> }) {
  useEffect(() => {
    if (!ui) return
    const dict = new Map<string, string>()
    for (const [k, v] of Object.entries(ui)) if (!(k in UI_DEFAULTS) && typeof v === 'string' && v.trim() && k.trim()) dict.set(k.trim(), v)
    if (!dict.size) return

    const texts = new Map<Text, { en: string; fr: string }>()
    const attrs = new Map<Element, Map<string, { en: string; fr: string }>>()

    const doText = (n: Text) => {
      const raw = n.nodeValue ?? ''
      const t = raw.trim()
      if (!t) return
      const fr = dict.get(t)
      if (!fr || n.parentElement?.closest(SKIP)) return
      const next = raw.replace(t, fr)
      if (next === raw) return
      n.nodeValue = next
      texts.set(n, { en: raw, fr: next })
    }
    const doAttr = (el: Element, name: string) => {
      const raw = el.getAttribute(name)
      const fr = raw ? dict.get(raw.trim()) : undefined
      if (!raw || !fr || el.closest(SKIP.replace('textarea, input, ', ''))) return
      el.setAttribute(name, fr)
      let m = attrs.get(el)
      if (!m) attrs.set(el, (m = new Map()))
      m.set(name, { en: raw, fr })
    }
    const sweep = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) return doText(root as Text)
      if (root.nodeType !== Node.ELEMENT_NODE) return
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      for (let n = w.nextNode(); n; n = w.nextNode()) doText(n as Text)
      const els = [root as Element, ...(root as Element).querySelectorAll('[placeholder],[aria-label],[title]')]
      for (const el of els) for (const a of ATTRS) if (el.hasAttribute(a)) doAttr(el, a)
    }

    sweep(document.body)
    const obs = new MutationObserver((records) => {
      for (const r of records) {
        if (r.type === 'characterData') doText(r.target as Text)
        else if (r.type === 'attributes') doAttr(r.target as Element, r.attributeName ?? '')
        else r.addedNodes.forEach(sweep)
      }
      // Forget nodes the page has removed.
      if (texts.size > 2000) for (const n of texts.keys()) if (!n.isConnected) texts.delete(n)
    })
    obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] })

    return () => {
      obs.disconnect()
      // Put the English back, but only where the page has not changed the text since.
      for (const [n, v] of texts) if (n.isConnected && n.nodeValue === v.fr) n.nodeValue = v.en
      for (const [el, m] of attrs) for (const [name, v] of m) if (el.isConnected && el.getAttribute(name) === v.fr) el.setAttribute(name, v.en)
    }
  }, [ui])
  return null
}
