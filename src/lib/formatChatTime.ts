import { differenceInCalendarDays, format, isSameDay, isYesterday } from 'date-fns'

export function formatChatListTime(at: number): string {
  const d = new Date(at)
  const now = new Date()
  if (isSameDay(d, now)) return format(d, 'HH:mm')
  if (isYesterday(d)) return 'Yesterday'
  if (differenceInCalendarDays(now, d) < 7) return format(d, 'EEEE')
  return format(d, 'dd/MM/yyyy')
}

export function dayDividerLabel(at: number): string {
  const d = new Date(at)
  const now = new Date()
  if (isSameDay(d, now)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'MMMM d, yyyy')
}

export function dayKey(at: number): string {
  const d = new Date(at)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

/** Saved-at line on story entries: weekday, calendar date, year, and time (local). */
export function formatEntrySavedAt(at: number): string {
  return format(new Date(at), 'EEEE, MMMM d, yyyy · HH:mm')
}
