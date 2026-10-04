import { useContent } from '../../hooks/useContent'
import { useT } from '../../i18n/useT'

export function LangSwitcher() {
  const { content } = useContent()
  const { lang, languages, setLang, t } = useT()
  const i = content.portfolio.i18n
  if (!i.enabled || !i.switcher || !languages.length) return null
  return (
    <label className="langsel">
      <span className="sr-only">{t('lang.label')}</span>
      <select value={lang} onChange={(e) => setLang(e.target.value)}>
        <option value="">{i.defaultLabel}</option>
        {languages.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
      </select>
    </label>
  )
}
