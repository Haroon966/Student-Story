/** Append transcribed text to the diary message body with sensible spacing. */
export function mergeTranscriptIntoBody(previousBody: string, transcript: string): string {
  const t = transcript.trim()
  if (!t) return previousBody
  const p = previousBody.trimEnd()
  if (!p) return t
  return `${p}\n${t}`
}
