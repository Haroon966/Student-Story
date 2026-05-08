export type ParsedSegment =
  | { type: 'text'; value: string }
  | { type: 'entry'; shortId: string }
  | { type: 'media'; shortId: string }

const TAG_RE = /\[\[(entry|media):([a-f0-9]{1,12})\]\]/gi

/**
 * Split assistant markdown/text into alternating text and reference tokens.
 */
export function parseAssistantContent(content: string): ParsedSegment[] {
  const segments: ParsedSegment[] = []
  let last = 0
  TAG_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = TAG_RE.exec(content)) !== null) {
    if (m.index > last) {
      segments.push({ type: 'text', value: content.slice(last, m.index) })
    }
    const kind = m[1].toLowerCase() === 'entry' ? 'entry' : 'media'
    const shortId = m[2].toLowerCase()
    segments.push(kind === 'entry' ? { type: 'entry', shortId } : { type: 'media', shortId })
    last = m.index + m[0].length
  }
  if (last < content.length) {
    segments.push({ type: 'text', value: content.slice(last) })
  }
  return segments
}
