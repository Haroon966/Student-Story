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
import { AlertTriangle, ChevronDown } from 'lucide-react'
import { useState } from 'react'

function MediaPreview({ media }: { media: DiaryMedia }) {
  const url = useBlobUrl(media.blob)

  if (!url) {
    return (
      <div
        className="max-h-52 w-full animate-pulse rounded-md bg-[var(--theme-surface-muted)]"
        aria-hidden
      />
    )
  }

  if (media.kind === 'image') {
    return (
      <img
        src={url}
        alt=""
        className="max-h-52 w-full rounded-md bg-[var(--theme-surface-muted)] object-cover"
      />
    )
  }

  if (media.kind === 'video') {
    return <video src={url} controls className="max-h-60 w-full rounded-md bg-black" />
  }

  return <audio src={url} controls className="w-full" />
}

type Props = {
  entry: DiaryEntry
  media: DiaryMedia[]
  onRemoved: () => void
}

export function EntryCard({ entry, media, onRemoved }: Props) {
  const [busy, setBusy] = useState(false)
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
        <div className="max-w-[min(92%,560px)] rounded-lg rounded-tr-none border border-[var(--theme-border)] bg-[var(--theme-bubble-out)] px-2 pb-1 pt-2 text-[14.2px] leading-snug text-[var(--theme-charcoal)] shadow-sm">
          <div className="flex items-start gap-1 px-1">
            <div className="min-w-0 flex-1">
              {entry.body.trim() ? (
                <div className="whitespace-pre-wrap break-words">{entry.body}</div>
              ) : null}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="mt-[-2px] rounded-md p-1 text-[var(--theme-bubble-meta)] hover:bg-[rgb(21_91_91_/_0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-ring)] disabled:opacity-50"
                  aria-label="Message actions"
                  disabled={busy}
                >
                  <ChevronDown className="size-4" aria-hidden />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem inset destructive onSelect={() => setDeleteWarningOpen(true)}>
                  Delete for me
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {media.length ? (
            <div className="mt-2 space-y-3 px-0">
              {media.map((m) => (
                <div key={m.id} className="space-y-1.5">
                  <MediaPreview media={m} />
                  {m.caption?.trim() ? (
                    <p className="whitespace-pre-wrap break-words px-1 text-[13px] leading-snug text-[var(--theme-charcoal-muted)]">
                      {m.caption.trim()}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex justify-end px-2 pb-1 pt-1">
            <time
              dateTime={new Date(entry.createdAt).toISOString()}
              className="max-w-full text-right text-[11px] leading-snug tracking-tight text-[var(--theme-bubble-meta)] sm:text-[12px]"
            >
              Saved · {savedLabel}
            </time>
          </div>
        </div>
      </div>

      <Dialog open={deleteWarningOpen} onOpenChange={(open) => !busy && setDeleteWarningOpen(open)}>
        <DialogContent className="gap-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[var(--theme-danger)]">
              <AlertTriangle className="size-5 shrink-0" aria-hidden />
              Delete this story entry?
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-1 text-[var(--theme-charcoal-muted)]">
              This message and any attached photos, videos, or voice notes will be removed from this device. This
              cannot be undone.
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
