import { Moon, Sun } from 'lucide-react'
import { useContent } from '../../hooks/useContent'
import { useTheme } from '../../hooks/useTheme'
import { useT } from '../../i18n/useT'

export function SchemeToggle() {
  const { content } = useContent()
  const { scheme, setScheme } = useTheme()
  const { t } = useT()
  if (!content.portfolio.design.colorToggle) return null
  const dark = scheme === 'dark'
  return (
    <button type="button" className="header__icon" onClick={() => setScheme(dark ? 'light' : 'dark')} aria-label={dark ? t('scheme.light') : t('scheme.dark')} aria-pressed={dark}>
      {dark ? <Sun aria-hidden size={20} /> : <Moon aria-hidden size={20} />}
    </button>
  )
}
