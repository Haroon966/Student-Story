import type { DiaryEntry, DiaryMedia } from '@/db/database'
import { useBlobUrl } from '@/hooks/useBlobUrl'
import { formatEntrySavedAt } from '@/lib/formatChatTime'
import { resolveEntryByShortId, resolveMediaByShortId } from '@/lib/aiResolve'
import type { ParsedSegment } from '@/lib/aiTokens'
import { useEffect, useState } from 'react'

function MediaBlobPreview({ media }: { media: DiaryMedia }) {
  const url = useBlobUrl(media.blob)

  if (!url) {
    return (
      <div
        className="max-h-40 w-full animate-pulse rounded-md bg-[var(--theme-surface-muted)]"
        aria-hidden
      />
    )
  }

  if (media.kind === 'image') {
    return (
      <img
        src={url}
        alt=""
        className="max-h-40 w-full rounded-md border border-[var(--theme-border)] object-contain"
      />
    )
  }
  if (media.kind === 'video') {
    return <video src={url} controls className="max-h-48 w-full rounded-md border border-[var(--theme-border)]" />
  }
  return <audio src={url} controls className="w-full" />
}

type Props = {
  studentId: string
  segment: Extract<ParsedSegment, { type: 'entry' } | { type: 'media' }>
}

/** Renders a cited story entry or attachment from local data. */
export function Reference({ studentId, segment }: Props) {
  const [entry, setEntry] = useState<DiaryEntry | null | undefined>(undefined)
  const [media, setMedia] = useState<DiaryMedia | null | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    if (segment.type === 'entry') {
      void resolveEntryByShortId(studentId, segment.shortId).then((r) => {
        if (!cancelled) setEntry(r)
      })
    } else {
      void resolveMediaByShortId(studentId, segment.shortId).then((r) => {
        if (!cancelled) setMedia(r)
      })
    }
    return () => {
      cancelled = true
    }
  }, [studentId, segment.type, segment.shortId])

  if (segment.type === 'entry') {
    if (entry === undefined) {
      return (
        <span className="my-1 inline-block min-h-[2.5rem] min-w-[8rem] animate-pulse rounded-md bg-[var(--theme-surface-muted)]" />
      )
    }
    if (!entry) {
      return (
        <span className="my-1 block rounded-md border border-dashed border-[var(--theme-border)] px-2 py-1 text-xs text-[var(--theme-charcoal-muted)]">
          Story entry not found (ref: {segment.shortId})
        </span>
      )
    }
    return (
      <div className="my-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-muted)] p-2 text-sm shadow-sm">
        <p className="text-[11px] font-medium text-[var(--theme-primary)]">
          Story · {formatEntrySavedAt(entry.createdAt)}
        </p>
        <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-[var(--theme-charcoal)]">{entry.body}</p>
      </div>
    )
  }

  if (media === undefined) {
    return (
      <span className="my-1 inline-block min-h-[4rem] min-w-full animate-pulse rounded-md bg-[var(--theme-surface-muted)]" />
    )
  }
  if (!media) {
    return (
      <span className="my-1 block rounded-md border border-dashed border-[var(--theme-border)] px-2 py-1 text-xs text-[var(--theme-charcoal-muted)]">
        Attachment not found (ref: {segment.shortId})
      </span>
    )
  }
  return (
    <div className="my-2 overflow-hidden rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-1 shadow-sm">
      <p className="px-1 pb-1 text-[11px] capitalize text-[var(--theme-charcoal-muted)]">{media.kind}</p>
      <MediaBlobPreview media={media} />
    </div>
  )
}
