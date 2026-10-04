import { CalendarClock } from 'lucide-react'
import { useContent } from '../../hooks/useContent'
import { useT } from '../../i18n/useT'
import { safeHref, hasValue } from '../../utils/text'
import { track } from '../../utils/track'

type Place = 'hero' | 'header' | 'contact' | 'profile'

/** The owner's booking link, shown only where they chose and only when it is a real web address. */
export function BookingButton({ place, className = 'btn btn--ghost' }: { place: Place; className?: string }) {
  const { content } = useContent()
  const { t } = useT()
  const b = content.portfolio.booking
  const href = safeHref(b.url)
  if (!b.enabled || !href || !b.showIn.includes(place)) return null
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer" onClick={() => track('cta', 'Booking')}>
      <CalendarClock size={18} aria-hidden /> {hasValue(b.label) ? b.label : t('booking.default')}<span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}
