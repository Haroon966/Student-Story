import { EntryCard } from '@/components/diary/EntryCard'
import { NewEntryComposer } from '@/components/diary/NewEntryComposer'
import type { StoryIngestAttachment } from '@/components/diary/NewEntryComposer'
import { StudentAvatar } from '@/components/students/StudentAvatar'
import { Button } from '@/components/ui/button'
import type { DiaryEntry, DiaryMedia } from '@/db/database'
import { entryMatchesDiarySearch, listEntriesForStudent, listMediaForEntry } from '@/lib/diary'
import { dayDividerLabel, dayKey } from '@/lib/formatChatTime'
import { useStudentsStore } from '@/stores/studentsStore'
import { ChevronLeft, Search, Sparkles } from 'lucide-react'
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
  storyCameraCapture?: { ingestId: string; mimeType: string; blob: Blob; kind?: 'image' | 'video' }
}

export function StudentPage() {
  const { id } = useParams<{ id: string }>()
  const location  = useLocation()
  const navigate  = useNavigate()
  const students  = useStudentsStore((s) => s.students)
  const loadingStudents = useStudentsStore((s) => s.loading)
  const hydrate   = useStudentsStore((s) => s.hydrate)

  const student = id ? students.find((s) => s.id === id) : undefined

  const [entries,   setEntries]   = useState<DiaryEntry[]>([])
  const [mediaMap,  setMediaMap]  = useState<Record<string, DiaryMedia[]>>({})
  const [cameraIngest, setCameraIngest] = useState<StoryIngestAttachment | null>(null)
  const [storySearch, setStorySearch]   = useState('')
  const scrollEndRef = useRef<HTMLDivElement>(null)

  const onIngestAttachmentConsumed = useCallback(() => setCameraIngest(null), [])

  const reloadEntries = useCallback(async () => {
    if (!id) return
    const { rows, map } = await fetchDiaryBundle(id)
    setEntries(rows)
    setMediaMap(map)
  }, [id])

  useEffect(() => { void hydrate() }, [hydrate])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    void fetchDiaryBundle(id).then(({ rows, map }) => {
      if (cancelled) return
      setEntries(rows)
      setMediaMap(map)
    })
    return () => { cancelled = true }
  }, [id])

  const chronological = useMemo(() => [...entries].reverse(), [entries])

  const chronologicalFiltered = useMemo(() => {
    const needle = storySearch.trim()
    if (!needle) return chronological
    return chronological.filter((entry) =>
      entryMatchesDiarySearch(entry, mediaMap[entry.id] ?? [], needle),
    )
  }, [chronological, mediaMap, storySearch])

  const grouped = useMemo(() => {
    const rows: TimelineRow[] = []
    let lastKey = ''
    for (const entry of chronologicalFiltered) {
      const key = dayKey(entry.createdAt)
      if (key !== lastKey) {
        lastKey = key
        rows.push({ kind: 'divider', label: dayDividerLabel(entry.createdAt) })
      }
      rows.push({ kind: 'entry', entry })
    }
    return rows
  }, [chronologicalFiltered])

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [grouped.length])

  useEffect(() => {
    if (!id) return
    const cap = (location.state as LocationCameraState | null)?.storyCameraCapture
    if (!cap) return
    startTransition(() => {
      const kind = cap.kind === 'video' ? 'video' : 'image'
      setCameraIngest({ ingestId: cap.ingestId, kind, mimeType: cap.mimeType, blob: cap.blob })
    })
    navigate(`/student/${id}`, { replace: true, state: {} })
  }, [id, location.state, navigate])

  if (!id) return null

  if (loadingStudents) {
    return (
      <div className="flex flex-1 items-center justify-center py-16" style={{ fontSize: 'var(--text-sm)', color: 'var(--theme-charcoal-muted)' }}>
        Loading…
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--theme-charcoal-muted)' }}>This student story could not be found.</p>
        <Link
          to="/"
          className="rounded-[var(--radius-full)] px-4 py-2 font-medium"
          style={{ fontSize: 'var(--text-sm)', background: 'var(--theme-primary-soft)', color: 'var(--theme-primary)' }}
        >
          Back to stories
        </Link>
      </div>
    )
  }

  const profileHref = `/student/${id}/profile`
  const aiHref      = `/student/${id}/ai`

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ background: 'var(--theme-chat-bg)' }}>

      {/* Header */}
      <header
        className="sticky top-0 z-30 flex shrink-0 items-center gap-2 px-2 py-2 text-[var(--theme-app-header-fg)]"
        style={{ background: 'var(--theme-app-header-bg)', boxShadow: 'var(--shadow-md)' }}
      >
        <Link
          to="/"
          className="rounded-[var(--radius-full)] p-2 hover:bg-[rgb(255_255_255_/_0.18)]"
          style={{ color: 'var(--theme-app-header-fg)' }}
          aria-label="Back to stories"
        >
          <ChevronLeft className="size-6" aria-hidden />
        </Link>

        <Link
          to={profileHref}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-[var(--radius-lg)] px-1 py-1 outline-none hover:bg-[rgb(255_255_255_/_0.12)] focus-visible:ring-2 focus-visible:ring-[var(--theme-ring)]"
          aria-label={`Open profile for ${student.name}`}
        >
          <StudentAvatar
            student={student}
            tone="inverse"
            className="size-10 shrink-0 text-[13px] ring-2 ring-[rgb(255_255_255_/_0.35)]"
          />
          <div className="min-w-0">
            <div
              className="truncate font-semibold"
              style={{ fontSize: 'var(--text-md)', letterSpacing: 'var(--tracking-tight)', lineHeight: 'var(--leading-tight)' }}
            >
              {student.name}
            </div>
            <div className="truncate opacity-80" style={{ fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-snug)', fontWeight: 400 }}>
              {student.blocked ? 'Blocked · open profile to unblock' : 'Story · offline'}
            </div>
          </div>
        </Link>

        <Button
          asChild
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-[var(--radius-full)] hover:bg-[rgb(255_255_255_/_0.18)]"
          style={{ color: 'var(--theme-app-header-fg)' }}
          aria-label="AI coach"
        >
          <Link to={aiHref}>
            <Sparkles className="size-5" aria-hidden />
          </Link>
        </Button>
      </header>

      {/* Blocked banner */}
      {student.blocked ? (
        <div
          className="shrink-0 border-b px-4 py-2.5 text-center"
          style={{
            borderColor: 'var(--theme-border)',
            background: 'var(--theme-primary-soft)',
            fontSize: 'var(--text-sm)',
            lineHeight: 'var(--leading-snug)',
            color: 'var(--theme-charcoal)',
          }}
        >
          New story entries are paused while this student is blocked.{' '}
          <Link
            to={profileHref}
            className="font-semibold underline-offset-2 hover:underline"
            style={{ color: 'var(--theme-primary)' }}
          >
            Unblock in profile
          </Link>
        </div>
      ) : null}

      {/* Story search bar */}
      {entries.length > 0 ? (
        <div className="shrink-0 border-b px-3 py-2 sm:px-4" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-chat-bg)' }}>
          <label className="mx-auto flex max-w-[880px] items-center gap-2.5 rounded-[var(--radius-full)] border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3.5 py-2 transition-shadow focus-within:border-[var(--theme-primary)] focus-within:shadow-[0_0_0_3px_var(--theme-ring)]">
            <Search className="size-[14px] shrink-0 text-[var(--theme-charcoal-muted)]" aria-hidden />
            <input
              type="search"
              value={storySearch}
              onChange={(e) => setStorySearch(e.target.value)}
              placeholder="Search notes and captions…"
              aria-label="Search diary entries and captions"
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[var(--theme-charcoal-muted)]"
              style={{ fontSize: 'var(--text-sm)', color: 'var(--theme-charcoal)' }}
            />
          </label>
        </div>
      ) : null}

      {/* Timeline */}
      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-2 py-3 sm:px-4"
        style={{
          backgroundColor: 'var(--theme-chat-bg)',
          backgroundImage: 'var(--theme-chat-pattern)',
          backgroundSize: '14px 14px',
        }}
      >
        {entries.length === 0 ? (
          <div
            className="mx-auto mt-10 max-w-sm rounded-[var(--radius-lg)] border px-5 py-5 text-center"
            style={{
              borderColor: 'var(--theme-border)',
              background: 'var(--theme-surface)',
              fontSize: 'var(--text-sm)',
              color: 'var(--theme-charcoal-muted)',
              lineHeight: 'var(--leading-body)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            Capture moments with text, voice, photos, or video — your story starts here.
          </div>
        ) : chronologicalFiltered.length === 0 ? (
          <div
            className="mx-auto mt-10 max-w-sm rounded-[var(--radius-lg)] border px-5 py-5 text-center"
            style={{
              borderColor: 'var(--theme-border)',
              background: 'var(--theme-surface)',
              fontSize: 'var(--text-sm)',
              color: 'var(--theme-charcoal-muted)',
              lineHeight: 'var(--leading-body)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            No entries match your search. Try different words or clear the search field.
          </div>
        ) : (
          <div className="mx-auto flex max-w-[880px] flex-col gap-2 pb-2">
            {grouped.map((item, idx) =>
              item.kind === 'divider' ? (
                <div key={`${item.label}-${idx}`} className="flex items-center gap-3 py-3">
                  <div className="h-px flex-1" style={{ background: 'var(--theme-border)' }} />
                  <span
                    className="font-medium"
                    style={{
                      fontSize: 'var(--text-xs)',
                      letterSpacing: 'var(--tracking-wider)',
                      textTransform: 'uppercase',
                      color: 'var(--theme-charcoal-muted)',
                    }}
                  >
                    {item.label}
                  </span>
                  <div className="h-px flex-1" style={{ background: 'var(--theme-border)' }} />
                </div>
              ) : (
                <EntryCard
                  key={item.entry.id}
                  entry={item.entry}
                  media={mediaMap[item.entry.id] ?? []}
                  onRemoved={() => void reloadEntries()}
                  onMediaUpdated={() => void reloadEntries()}
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
