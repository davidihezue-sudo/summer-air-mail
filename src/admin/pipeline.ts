export const STAGES = ['new', 'replied', 'interview', 'won', 'closed'] as const
export type Stage = (typeof STAGES)[number]

export const STAGE_LABEL: Record<Stage, string> = { new: 'New', replied: 'Replied', interview: 'Interview or call', won: 'Won', closed: 'Closed' }
export const STAGE_HELP: Record<Stage, string> = {
  new: 'Not answered yet', replied: 'You have answered', interview: 'A call or interview is planned or done', won: 'It led to work', closed: 'No longer active',
}

const isOpen = (s: Stage) => s === 'new' || s === 'replied' || s === 'interview'

export type FollowUpState = '' | 'overdue' | 'today' | 'later'

/** Where a follow-up date stands today. Finished enquiries (won or closed) never nag. */
export function followUpState(followUp: string, stage: Stage, today: string): FollowUpState {
  if (!followUp || !isOpen(stage)) return ''
  return followUp < today ? 'overdue' : followUp === today ? 'today' : 'later'
}

/** A date a number of days after another, as YYYY-MM-DD. Works in UTC so daylight saving never shifts it. */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export const todayLocal = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
