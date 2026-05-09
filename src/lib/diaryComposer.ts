import type { MediaKind } from '@/db/database'

/** Pending attachment fields needed to derive saved entry body text before submit. */
export type ComposerPendingMedia = {
  kind: MediaKind
  caption: string
}

/**
 * Message field content stored on the diary entry. Attachments may carry their own captions
 * (including transcribed audio descriptions).
 */
export function resolveComposerEntryBody(mainBody: string, pending: ComposerPendingMedia[]): string {
  const t = mainBody.trim()
  if (t) return t
  if (!pending.length) return ''
  const hasMediaCaption = pending.some(
    (p) =>
      (p.kind === 'image' || p.kind === 'video' || p.kind === 'audio') && p.caption.trim(),
  )
  if (hasMediaCaption) return ''
  const onlyAudio = pending.every((p) => p.kind === 'audio')
  if (onlyAudio) return ''
  return '(attachment)'
}
