import type { ResultClass } from '../../content/types'

export const CLASS_LABEL: Record<ResultClass, string> = {
  verified: 'Verified result',
  team: 'Team result',
  confidential: 'Confidential result',
  illustrative: 'Illustrative example',
  individual: 'Individual result',
}

export function ClassBadge({ value }: { value: ResultClass }) {
  return <span className={`badge badge--${value}`}>{CLASS_LABEL[value]}</span>
}
