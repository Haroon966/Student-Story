import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { DiaryEntry, DiaryMedia } from '@/db/database'
import { deleteDiaryEntry } from '@/lib/diary'
import { formatEntrySavedAt } from '@/lib/formatChatTime'
import { Button } from '@/components/ui/button'
import { useBlobUrl } from '@/hooks/useBlobUrl'
import { AlertTriangle, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'

function MediaPreview({ media }: { media: DiaryMedia }) {
  const url = useBlobUrl(media.blob)

  if (!url) {
    return (
      <div
        className="w-full animate-pulse"
        style={{ height: '180px', borderRadius: 'var(--radius-md)', background: 'var(--theme-surface-muted)' }}
        aria-hidden
      />
    )
  }

  if (media.kind === 'image') {
    return (
      <img
        src={url}
        alt=""
        className="w-full object-cover"
        style={{ maxHeight: '280px', borderRadius: 'var(--radius-md)', background: 'var(--theme-surface-muted)' }}
      />
    )
  }

  if (media.kind === 'video') {
    return (
      <video
        src={url}
        controls
        className="w-full bg-black"
        style={{ maxHeight: '280px', borderRadius: 'var(--radius-md)' }}
      />
    )
  }

  return <audio src={url} controls className="w-full" />
}

type Props = {
  entry: DiaryEntry
  media: DiaryMedia[]
  onRemoved: () => void
}

export function EntryCard({ entry, media, onRemoved }: Props) {
  const [busy,  setBusy]  = useState(false)
  const [deleteWarningOpen, setDeleteWarningOpen] = useState(false)

  async function confirmRemove() {
    if (busy) return
    setBusy(true)
    try {
      await deleteDiaryEntry(entry.id)
      setDeleteWarningOpen(false)
      onRemoved()
    } finally {
      setBusy(false)
    }
  }

  const savedLabel = formatEntrySavedAt(entry.createdAt)

  return (
    <>
      <div className="flex justify-end">
        <div
          className="w-[min(92%,560px)] overflow-hidden"
          style={{
            borderRadius: 'var(--radius-2xl)',
            borderTopRightRadius: 'var(--radius-xs)',
            background: 'var(--theme-bubble-out)',
            border: '1px solid var(--theme-border)',
            borderLeft: '3px solid rgb(21 91 91 / 0.22)',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          {/* Body + menu row */}
          <div className="flex items-start gap-1 px-3 pt-2.5">
            <div className="min-w-0 flex-1">
              {entry.body.trim() ? (
                <div
                  className="whitespace-pre-wrap break-words"
                  style={{ fontSize: 'var(--text-base)', lineHeight: 'var(--leading-body)', color: 'var(--theme-charcoal)' }}
                >
                  {entry.body}
                </div>
              ) : null}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="mt-[-1px] shrink-0 rounded-[var(--radius-full)] p-1.5 transition-colors hover:bg-[rgb(21_91_91_/_0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-ring)] disabled:opacity-50"
                  style={{ color: 'var(--theme-bubble-meta)' }}
                  aria-label="Entry actions"
                  disabled={busy}
                >
                  <MoreHorizontal className="size-4" aria-hidden />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem inset destructive onSelect={() => setDeleteWarningOpen(true)}>
                  Delete entry
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Media attachments */}
          {media.length ? (
            <div className="mt-2 space-y-2.5 px-3">
              {media.map((m) => (
                <div key={m.id} className="space-y-1.5">
                  <MediaPreview media={m} />
                  {m.caption?.trim() ? (
                    <p
                      className="break-words px-0.5"
                      style={{
                        fontSize: 'var(--text-sm)',
                        fontStyle: 'italic',
                        color: 'var(--theme-charcoal-muted)',
                        lineHeight: 'var(--leading-snug)',
                      }}
                    >
                      {m.caption.trim()}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {/* Timestamp */}
          <div className="flex justify-end px-3 pb-2 pt-1.5">
            <time
              dateTime={new Date(entry.createdAt).toISOString()}
              style={{
                fontSize: 'var(--text-xs)',
                letterSpacing: 'var(--tracking-wide)',
                color: 'var(--theme-bubble-meta)',
                lineHeight: 'var(--leading-snug)',
              }}
            >
              Saved · {savedLabel}
            </time>
          </div>
        </div>
      </div>

      <Dialog open={deleteWarningOpen} onOpenChange={(open) => !busy && setDeleteWarningOpen(open)}>
        <DialogContent className="gap-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ color: 'var(--theme-danger)' }}>
              <AlertTriangle className="size-5 shrink-0" aria-hidden />
              Delete this story entry?
            </DialogTitle>
            <DialogDescription style={{ color: 'var(--theme-charcoal-muted)', fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-body)' }}>
              This entry and any attached photos, videos, or voice notes will be removed from this device. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" disabled={busy} onClick={() => setDeleteWarningOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={busy} onClick={() => void confirmRemove()}>
              {busy ? 'Deleting…' : 'Delete entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
