import { EntryCard } from '@/components/diary/EntryCard'
import { NewEntryComposer } from '@/components/diary/NewEntryComposer'
import { StudentAvatar } from '@/components/students/StudentAvatar'
import type { StoryIngestAttachment } from '@/components/diary/NewEntryComposer'
import type { DiaryEntry, DiaryMedia } from '@/db/database'
import { listEntriesForStudent, listMediaForEntry } from '@/lib/diary'
import { dayDividerLabel, dayKey } from '@/lib/formatChatTime'
import { useStudentsStore } from '@/stores/studentsStore'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Sparkles } from 'lucide-react'
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'

type TimelineRow =
  | { kind: 'divider'; label: string }
  | { kind: 'entry'; entry: DiaryEntry }

async function fetchDiaryBundle(studentId: string) {
  const rows = await listEntriesForStudent(studentId)
  const map: Record<string, DiaryMedia[]> = {}
  for (const e of rows) {
    map[e.id] = await listMediaForEntry(e.id)
  }
  return { rows, map }
}

type LocationCameraState = {
  storyCameraCapture?: { ingestId: string; mimeType: string; blob: Blob }
}

export function StudentPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const students = useStudentsStore((s) => s.students)
  const loadingStudents = useStudentsStore((s) => s.loading)
  const hydrate = useStudentsStore((s) => s.hydrate)

  const student = id ? students.find((s) => s.id === id) : undefined

  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [mediaMap, setMediaMap] = useState<Record<string, DiaryMedia[]>>({})
  const [cameraIngest, setCameraIngest] = useState<StoryIngestAttachment | null>(null)
  const scrollEndRef = useRef<HTMLDivElement>(null)

  const onIngestAttachmentConsumed = useCallback(() => setCameraIngest(null), [])

  const reloadEntries = useCallback(async () => {
    if (!id) return
    const { rows, map } = await fetchDiaryBundle(id)
    setEntries(rows)
    setMediaMap(map)
  }, [id])

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    void fetchDiaryBundle(id).then(({ rows, map }) => {
      if (cancelled) return
      setEntries(rows)
      setMediaMap(map)
    })
    return () => {
      cancelled = true
    }
  }, [id])

  const chronological = useMemo(() => [...entries].reverse(), [entries])

  const grouped = useMemo(() => {
    const rows: TimelineRow[] = []
    let lastKey = ''
    for (const entry of chronological) {
      const key = dayKey(entry.createdAt)
      if (key !== lastKey) {
        lastKey = key
        rows.push({ kind: 'divider', label: dayDividerLabel(entry.createdAt) })
      }
      rows.push({ kind: 'entry', entry })
    }
    return rows
  }, [chronological])

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [grouped.length])

  useEffect(() => {
    if (!id) return
    const cap = (location.state as LocationCameraState | null)?.storyCameraCapture
    if (!cap) return
    startTransition(() => {
      setCameraIngest({
        ingestId: cap.ingestId,
        kind: 'image',
        mimeType: cap.mimeType,
        blob: cap.blob,
      })
    })
    navigate(`/student/${id}`, { replace: true, state: {} })
  }, [id, location.state, navigate])

  if (!id) {
    return null
  }

  if (loadingStudents) {
    return (
      <div className="flex flex-1 items-center justify-center py-16 text-sm text-[var(--theme-charcoal-muted)]">
        Loading…
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-[var(--theme-charcoal-muted)]">This student story could not be found.</p>
        <Link
          to="/"
          className="rounded-full bg-[var(--theme-primary-soft)] px-4 py-2 text-sm font-medium text-[var(--theme-primary)]"
        >
          Back to stories
        </Link>
      </div>
    )
  }

  const profileHref = `/student/${id}/profile`
  const aiHref = `/student/${id}/ai`

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--theme-chat-bg)]">
      <header className="sticky top-0 z-30 flex shrink-0 items-center gap-2 bg-[var(--theme-app-header-bg)] px-2 py-2 text-[var(--theme-app-header-fg)] shadow-[var(--shadow)]">
        <Link
          to="/"
          className="rounded-full p-2 text-[var(--theme-app-header-fg)] hover:bg-[rgb(255_255_255_/_0.18)]"
          aria-label="Back to stories"
        >
          <ChevronLeft className="size-7" aria-hidden />
        </Link>

        <Link
          to={profileHref}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-1 outline-none hover:bg-[rgb(255_255_255_/_0.14)] focus-visible:ring-2 focus-visible:ring-[var(--theme-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          aria-label={`Open profile for ${student.name}`}
        >
          <StudentAvatar
            student={student}
            tone="inverse"
            className="size-10 shrink-0 text-[13px] ring-2 ring-[rgb(255_255_255_/_0.35)]"
          />
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[17px] font-semibold">{student.name}</div>
            <div className="truncate text-[13px] opacity-90">
              {student.blocked ? 'Blocked · open profile to unblock' : 'Story · offline'}
            </div>
          </div>
        </Link>

        <Button asChild variant="ghost" size="icon" className="shrink-0 rounded-full text-[var(--theme-app-header-fg)] hover:bg-[rgb(255_255_255_/_0.18)]" aria-label="AI coach">
          <Link to={aiHref}>
            <Sparkles className="size-6" aria-hidden />
          </Link>
        </Button>
      </header>

      {student.blocked ? (
        <div className="shrink-0 border-b border-[var(--theme-border)] bg-[var(--theme-primary-soft)] px-4 py-3 text-center text-[13px] leading-snug text-[var(--theme-charcoal)]">
          New story entries are paused while this student is blocked.{' '}
          <Link to={profileHref} className="font-semibold text-[var(--theme-primary)] underline-offset-2 hover:underline">
            Unblock in profile
          </Link>
        </div>
      ) : null}

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-2 py-3 sm:px-4"
        style={{
          backgroundColor: 'var(--theme-chat-bg)',
          backgroundImage: 'var(--theme-chat-pattern)',
          backgroundSize: '12px 12px',
        }}
      >
        {entries.length === 0 ? (
          <div className="mx-auto mt-10 max-w-md rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-4 text-center text-[13px] leading-relaxed text-[var(--theme-charcoal-muted)] shadow-sm">
            Say hello to your story: capture moments with text, voice, photos, or video — just like sharing updates in a thread.
          </div>
        ) : (
          <div className="mx-auto flex max-w-[880px] flex-col gap-2 pb-2">
            {grouped.map((item, idx) =>
              item.kind === 'divider' ? (
                <div key={`${item.label}-${idx}`} className="flex justify-center py-3">
                  <span className="rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-1 text-[12px] font-medium text-[var(--theme-charcoal-muted)] shadow-sm">
                    {item.label}
                  </span>
                </div>
              ) : (
                <EntryCard
                  key={item.entry.id}
                  entry={item.entry}
                  media={mediaMap[item.entry.id] ?? []}
                  onRemoved={() => void reloadEntries()}
                />
              ),
            )}
          </div>
        )}
        <div ref={scrollEndRef} aria-hidden className="h-1 shrink-0" />
      </div>

      {student.blocked ? null : (
        <NewEntryComposer
          studentId={id}
          onSaved={() => void reloadEntries()}
          ingestAttachment={cameraIngest}
          onIngestAttachmentConsumed={onIngestAttachmentConsumed}
        />
      )}
    </div>
  )
}
