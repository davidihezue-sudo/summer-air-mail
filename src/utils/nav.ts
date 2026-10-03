export function goTo(id: string, focusId?: string) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'auto', block: 'start' })
  history.replaceState(null, '', `#${id}`)
  if (focusId) {
    window.setTimeout(() => document.getElementById(focusId)?.focus({ preventScroll: true }), 50)
  }
}
