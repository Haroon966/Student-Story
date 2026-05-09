import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder'
import type { NewMediaInput } from '@/lib/diary'
import { createDiaryEntry } from '@/lib/diary'
import { resolveComposerEntryBody } from '@/lib/diaryComposer'
import { toast } from '@/hooks/use-toast'
import { mergeTranscriptIntoBody } from '@/lib/speech/mergeTranscriptIntoBody'
import { transcribeAudioBlob } from '@/lib/speech/transcribe'
import type { MediaKind } from '@/db/database'
import { useBlobUrl } from '@/hooks/useBlobUrl'
import { newId } from '@/lib/id'
import { cn } from '@/lib/utils'
import { Camera, FileVideo, ImagePlus, Mic, Paperclip, SendHorizontal, Square, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export type StoryIngestAttachment = NewMediaInput & { ingestId: string }

type PendingAttachment = {
  localId: string
  kind: MediaKind
  mimeType: string
  blob: Blob
  caption: string
}

type Props = {
  studentId: string
  onSaved: () => void
  ingestAttachment?: StoryIngestAttachment | null
  onIngestAttachmentConsumed?: () => void
}

function PendingMediaRow({
  item,
  onCaptionChange,
  onRemove,
}: {
  item: PendingAttachment
  onCaptionChange: (localId: string, caption: string) => void
  onRemove: (localId: string) => void
}) {
  const url = useBlobUrl(item.blob)
  const showCaptionField = item.kind === 'image' || item.kind === 'video'
  const isAudio = item.kind === 'audio'

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-[var(--theme-border)] shadow-sm',
        isAudio ? 'bg-transparent' : 'bg-[var(--theme-surface)]',
      )}
    >
      <div
        className={cn(
          'relative',
          isAudio ? 'min-h-0 py-2 pl-2 pr-12' : 'min-h-[120px] bg-[var(--theme-surface-muted)]',
        )}
      >
        {!url && !isAudio ? (
          <div className="h-40 w-full animate-pulse bg-[var(--theme-border)]/40 sm:h-48" aria-hidden />
        ) : null}
        {item.kind === 'image' && url ? (
          <img src={url} alt="" className="max-h-48 w-full object-cover sm:max-h-56" />
        ) : null}
        {item.kind === 'video' && url ? (
          <video src={url} controls muted playsInline className="max-h-52 w-full bg-black object-contain sm:max-h-60" />
        ) : null}
        {item.kind === 'audio' && url ? (
          <div className="story-audio-bar">
            <audio src={url} controls preload="metadata" />
          </div>
        ) : null}

        <button
          type="button"
          className="absolute right-2 top-2 z-[1] inline-flex size-8 items-center justify-center rounded-full bg-[rgb(0_0_0_/_0.52)] text-white shadow-md backdrop-blur-[2px] transition-colors hover:bg-[rgb(0_0_0_/_0.68)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-ring)]"
          aria-label="Remove attachment"
          onClick={() => onRemove(item.localId)}
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      {item.kind === 'audio' && item.caption.trim() ? (
        <div className="px-2 pb-2 pt-0 pr-12">
          <p className="break-words text-[13px] italic leading-snug text-[var(--theme-charcoal-muted)]">
            {item.caption.trim()}
          </p>
        </div>
      ) : null}

      {showCaptionField ? (
        <div className="border-t border-[var(--theme-border)] p-2">
          <Input
            value={item.caption}
            onChange={(e) => onCaptionChange(item.localId, e.target.value)}
            placeholder="Add a caption…"
            aria-label="Attachment caption"
            className="h-9 border-transparent bg-[var(--theme-surface-muted)] text-[14px] placeholder:text-[var(--theme-charcoal-muted)] focus-visible:border-[var(--theme-primary)]"
          />
        </div>
      ) : null}
    </div>
  )
}

export function NewEntryComposer({
  studentId,
  onSaved,
  ingestAttachment,
  onIngestAttachmentConsumed,
}: Props) {
  const navigate = useNavigate()
  const [body, setBody] = useState('')
  const [pending, setPending] = useState<PendingAttachment[]>([])
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const consumedIngestIds = useRef(new Set<string>())
  const voice = useVoiceRecorder()
  const [voiceSession, setVoiceSession] = useState(0)
  const [voiceBusy, setVoiceBusy] = useState(false)
  const [transcribingNote, setTranscribingNote] = useState(false)
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null)
  const transcriptionSessionRef = useRef(0)
  const transcriptionInFlightRef = useRef(0)

  useEffect(() => {
    return () => {
      transcriptionSessionRef.current += 1
    }
  }, [])

  useEffect(() => {
    if (!ingestAttachment) return
    if (consumedIngestIds.current.has(ingestAttachment.ingestId)) return
    consumedIngestIds.current.add(ingestAttachment.ingestId)
    setPending((p) => [
      ...p,
      {
        localId: newId(),
        kind: ingestAttachment.kind,
        mimeType: ingestAttachment.mimeType,
        blob: ingestAttachment.blob,
        caption: ingestAttachment.caption?.trim() ?? '',
      },
    ])
    onIngestAttachmentConsumed?.()
  }, [ingestAttachment, onIngestAttachmentConsumed])

  function addPending(input: NewMediaInput): string {
    const localId = newId()
    setPending((p) => [
      ...p,
      {
        localId,
        kind: input.kind,
        mimeType: input.mimeType,
        blob: input.blob,
        caption: input.caption?.trim() ?? '',
      },
    ])
    return localId
  }

  function updateCaption(localId: string, caption: string) {
    setPending((p) => p.map((x) => (x.localId === localId ? { ...x, caption } : x)))
  }

  function removePending(localId: string) {
    setPending((p) => p.filter((x) => x.localId !== localId))
  }

  async function submit() {
    const entryBody = resolveComposerEntryBody(body, pending)
    if ((!entryBody && pending.length === 0) || busy) return
    setBusy(true)
    try {
      await createDiaryEntry(
        studentId,
        entryBody,
        pending.map(({ kind, mimeType, blob, caption }) => ({
          kind,
          mimeType,
          blob,
          caption: caption.trim() || undefined,
        })),
      )
      setBody('')
      setPending([])
      onSaved()
      toast({
        title: 'Saved',
        description: 'Your story entry was saved on this device.',
      })
    } catch {
      toast({
        variant: 'destructive',
        title: "Couldn't save",
        description: 'Something went wrong saving this entry. Try again.',
      })
    } finally {
      setBusy(false)
    }
  }

  async function transcribeVoiceNote(blob: Blob, audioLocalId: string) {
    const session = transcriptionSessionRef.current
    transcriptionInFlightRef.current += 1
    setTranscribingNote(true)
    setTranscriptionError(null)
    try {
      const text = await transcribeAudioBlob(blob)
      if (session !== transcriptionSessionRef.current) return
      setPending((p) =>
        p.some((x) => x.localId === audioLocalId)
          ? p.map((x) =>
              x.localId === audioLocalId
                ? { ...x, caption: mergeTranscriptIntoBody(x.caption, text).trim() }
                : x,
            )
          : p,
      )
      const trimmed = text.trim()
      if (trimmed) {
        toast({
          title: 'Transcription added',
          description: 'Text was saved to your voice note description.',
        })
      } else {
        toast({
          title: 'No speech detected',
          description: 'Try speaking closer to the mic or record again.',
        })
      }
    } catch (e) {
      if (session !== transcriptionSessionRef.current) return
      const msg = e instanceof Error ? e.message : 'Transcription failed.'
      setTranscriptionError(msg)
      toast({
        variant: 'destructive',
        title: 'Transcription failed',
        description: msg,
      })
    } finally {
      transcriptionInFlightRef.current -= 1
      if (transcriptionInFlightRef.current <= 0) {
        transcriptionInFlightRef.current = 0
        if (session === transcriptionSessionRef.current) setTranscribingNote(false)
      }
    }
  }

  async function toggleVoice() {
    if (voice.state.status === 'recording') {
      const blob = await voice.stop()
      if (blob) {
        const audioLocalId = addPending({
          kind: 'audio',
          mimeType: blob.type || 'audio/webm',
          blob,
        })
        void transcribeVoiceNote(blob, audioLocalId)
      }
      return
    }
    if (voice.state.status === 'error') voice.resetError()
    setTranscriptionError(null)
    setVoiceBusy(true)
    try {
      const started = await voice.start()
      if (started) setVoiceSession((s) => s + 1)
    } finally {
      setVoiceBusy(false)
    }
  }

  function onFiles(files: FileList | null) {
    if (!files?.length) return
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        addPending({ kind: 'image', mimeType: file.type, blob: file })
      } else if (file.type.startsWith('video/')) {
        addPending({ kind: 'video', mimeType: file.type, blob: file })
      }
    }
  }

  const recording = voice.state.status === 'recording'
  const canSend = Boolean(body.trim() || pending.length)

  return (
    <div className="sticky bottom-0 z-20 shrink-0 border-t border-[var(--theme-border)] bg-[var(--theme-composer-bg)] px-2 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 sm:px-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => {
          onFiles(e.target.files)
          e.target.value = ''
        }}
      />

      <div className="mx-auto flex max-w-[880px] flex-col gap-2">
        {voice.state.status === 'error' ? (
          <p className="text-[12px] text-[var(--theme-danger)]">{voice.state.message}</p>
        ) : null}

        {transcribingNote ? (
          <p className="text-[12px] text-[var(--theme-charcoal-muted)]" role="status" aria-live="polite">
            Transcribing voice note…
          </p>
        ) : null}

        {transcriptionError ? (
          <p className="text-[12px] text-[var(--theme-danger)]">{transcriptionError}</p>
        ) : null}

        {recording ? (
          <div
            className="relative overflow-hidden rounded-xl border border-[var(--theme-primary)]/35 bg-[var(--theme-primary-soft)] shadow-[var(--shadow-xs)]"
            role="status"
            aria-live="polite"
            aria-label="Recording voice note"
          >
            <div
              className="pointer-events-none absolute inset-y-0 -left-[45%] w-[45%] bg-gradient-to-r from-transparent via-[var(--theme-primary)]/22 to-transparent story-voice-recording__sweep"
              aria-hidden
            />
            <div
              key={voiceSession}
              className="story-voice-recording__slide-in relative flex items-center gap-3 px-3 py-3"
            >
              <div className="flex h-12 min-w-0 flex-1 items-end justify-center gap-1 px-1">
                {voice.waveLevels.map((level, i) => (
                  <span
                    key={i}
                    className="w-[3px] shrink-0 rounded-full bg-[var(--theme-primary)] transition-[height] duration-75"
                    style={{ height: `${Math.max(4, 5 + level * 40)}px` }}
                  />
                ))}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="relative flex h-2 w-2" aria-hidden>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--theme-danger)] opacity-40" />
                  <span className="relative inline-flex size-2 rounded-full bg-[var(--theme-danger)]" />
                </span>
                <span className="text-[12px] font-semibold tracking-wide text-[var(--theme-charcoal)]">
                  Recording
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {pending.length ? (
          <div className="flex max-h-[min(42vh,280px)] flex-col gap-3 overflow-y-auto overscroll-y-contain pr-0.5">
            {pending.map((item) => (
              <PendingMediaRow
                key={item.localId}
                item={item}
                onCaptionChange={updateCaption}
                onRemove={removePending}
              />
            ))}
          </div>
        ) : null}

        <div className="flex items-end gap-2">
          <div className="flex min-h-[46px] min-w-0 flex-1 items-end gap-0.5 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] px-1.5 py-1 shadow-[0_2px_8px_rgb(54_69_79_/_0.08)]">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-[var(--theme-charcoal-muted)] transition-colors hover:bg-[var(--theme-primary-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-ring)]"
                  aria-label="Attach photos or videos"
                >
                  <Paperclip className="size-[22px] rotate-[-35deg]" aria-hidden />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="w-52">
                <DropdownMenuItem
                  className="gap-2"
                  onSelect={() => {
                    window.setTimeout(() => fileRef.current?.click(), 0)
                  }}
                >
                  <ImagePlus className="size-4" aria-hidden />
                  Photos & videos
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 text-[var(--theme-charcoal-muted)]" disabled>
                  <FileVideo className="size-4" aria-hidden />
                  Stored offline only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Textarea
              placeholder="Message"
              rows={1}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void submit()
                }
              }}
              className="max-h-36 min-h-[40px] flex-1 resize-none rounded-none border-0 bg-transparent px-1 py-2.5 text-[15px] leading-snug text-[var(--theme-charcoal)] placeholder:text-[var(--theme-charcoal-muted)] focus-visible:ring-0 focus-visible:ring-offset-0"
            />

            <button
              type="button"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-[var(--theme-charcoal-muted)] transition-colors hover:bg-[var(--theme-primary-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-ring)]"
              aria-label="Open camera"
              onClick={() => navigate(`/student/${studentId}/camera`)}
            >
              <Camera className="size-[22px]" aria-hidden />
            </button>
          </div>

          <div className="shrink-0 pb-0.5">
            {canSend && !recording ? (
              <Button
                type="button"
                size="icon"
                className="size-12 rounded-full bg-[var(--theme-primary)] text-[var(--theme-primary-foreground)] shadow-[0_2px_8px_rgb(21_91_91_/_0.35)] hover:bg-[var(--theme-primary-hover)]"
                aria-label="Send"
                disabled={busy}
                onClick={() => void submit()}
              >
                <SendHorizontal className="size-5" aria-hidden />
              </Button>
            ) : (
              <button
                type="button"
                disabled={voiceBusy}
                aria-busy={voiceBusy || undefined}
                className={cn(
                  'inline-flex size-12 items-center justify-center rounded-full shadow-[0_2px_8px_rgb(21_91_91_/_0.35)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60',
                  recording
                    ? 'bg-[var(--theme-danger)] text-white hover:bg-[var(--theme-danger-hover)]'
                    : 'bg-[var(--theme-primary)] text-[var(--theme-primary-foreground)] hover:bg-[var(--theme-primary-hover)]',
                )}
                aria-label={recording ? 'Stop recording' : 'Record voice note'}
                onClick={() => void toggleVoice()}
              >
                {recording ? <Square className="size-5" aria-hidden /> : <Mic className="size-6" aria-hidden />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
