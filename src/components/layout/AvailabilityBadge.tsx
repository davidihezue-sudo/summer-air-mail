import { useContent } from '../../hooks/useContent'
import { hasValue } from '../../utils/text'

export function AvailabilityBadge() {
  const { content } = useContent()
  const text = content.portfolio.profile.availability
  if (!content.portfolio.extras.availabilityBadge || !hasValue(text)) return null
  return <p className="avail" role="status"><span className="avail__dot" aria-hidden />{text}</p>
}
