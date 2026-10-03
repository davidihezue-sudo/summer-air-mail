import type { Portfolio } from '../content/types'

/** Writes the theme config to CSS variables so colours and fonts can be changed in one place. */
export function applyTheme(theme: Portfolio['theme']) {
  const root = document.documentElement
  for (const [name, value] of Object.entries(theme.colors)) root.style.setProperty(`--c-${name}`, value)
  root.style.setProperty('--font-display', theme.fonts.display)
  root.style.setProperty('--font-script', theme.fonts.script)
  root.style.setProperty('--font-body', theme.fonts.body)
  root.dataset.border = theme.borderStyle
  root.dataset.motion = theme.animationIntensity
}
