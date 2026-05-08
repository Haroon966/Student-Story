/** First 8 hex chars of UUID without dashes — matches AI cite tokens. */
export function uuidToShort(full: string): string {
  return full.replace(/-/g, '').slice(0, 8).toLowerCase()
}
