import { StudentAvatar } from '@/components/students/StudentAvatar'
import { StudentFormDialog } from '@/components/students/StudentFormDialog'
import type { Student } from '@/db/database'
import { LOGO_PNG } from '@/lib/brand'
import { getLastDiaryPreview } from '@/lib/diary'
import { formatChatListTime } from '@/lib/formatChatTime'
import { useStudentsStore } from '@/stores/studentsStore'
import { Search, Star } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

function subtitleStudent(student: Student, preview?: { snippet: string; at: number }) {
  if (preview?.snippet) return preview.snippet
  if (student.notes.trim()) {
    const n = student.notes.replace(/\s+/g, ' ').trim()
    return n.length > 80 ? `${n.slice(0, 80)}…` : n
  }
  return 'Tap to open story'
}

export function HomePage() {
  const { students, loading, hydrate } = useStudentsStore()
  const [q, setQ] = useState('')
  const [previews, setPreviews] = useState<Record<string, { snippet: string; at: number }>>({})
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => { void hydrate() }, [hydrate])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const map: Record<string, { snippet: string; at: number }> = {}
      await Promise.all(students.map(async (s) => {
        const p = await getLastDiaryPreview(s.id)
        if (p) map[s.id] = p
      }))
      if (!cancelled) setPreviews(map)
    })()
    return () => { cancelled = true }
  }, [students])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const list = needle
      ? students.filter((s) => s.name.toLowerCase().includes(needle))
      : [...students]
    list.sort((a, b) => {
      if (a.favorite !== b.favorite) return a.favorite ? -1 : 1
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    })
    return list
  }, [students, q])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-16" style={{ fontSize: 'var(--text-sm)', color: 'var(--theme-charcoal-muted)' }}>
        Loading…
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col bg-[var(--theme-background)]">
      {/* Search bar */}
      <div className="px-3 py-2.5 sm:px-4">
        <label className="flex items-center gap-2.5 rounded-[var(--radius-full)] border border-[var(--theme-border)] bg-[var(--theme-surface-muted)] px-3.5 py-2 transition-shadow focus-within:border-[var(--theme-primary)] focus-within:bg-[var(--theme-surface)] focus-within:shadow-[0_0_0_3px_var(--theme-ring)]">
          <Search className="size-[15px] shrink-0 text-[var(--theme-charcoal-muted)]" aria-hidden />
          <input
            ref={searchRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search students…"
            aria-label="Search students"
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[var(--theme-charcoal-muted)]"
            style={{ fontSize: 'var(--text-base)', color: 'var(--theme-charcoal)' }}
          />
        </label>
      </div>

      {students.length === 0 ? (
        /* Empty state */
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-28 pt-10 text-center">
          <div className="flex max-w-[200px] items-center justify-center px-2">
            <img
              src={LOGO_PNG}
              alt=""
              width={160}
              height={160}
              decoding="async"
              className="h-auto max-h-32 w-full object-contain"
            />
          </div>
          <div className="max-w-xs space-y-2">
            <p style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--theme-charcoal)', letterSpacing: 'var(--tracking-tight)', lineHeight: 'var(--leading-tight)' }}>
              Start a new story
            </p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--theme-charcoal-muted)', lineHeight: 'var(--leading-body)' }}>
              Add a student to begin. Notes, voice, photos and video all stay privately on this device.
            </p>
          </div>
          <StudentFormDialog variant="inline" label="Add your first student" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--theme-charcoal-muted)' }}>
            No students match &ldquo;{q.trim()}&rdquo;
          </p>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto px-2 py-1 sm:px-3">
          {filtered.map((s) => {
            const preview  = previews[s.id]
            const sub      = subtitleStudent(s, preview)
            const timeLabel = preview ? formatChatListTime(preview.at) : ''

            return (
              <li key={s.id}>
                <Link
                  to={`/student/${s.id}`}
                  className="group flex items-center gap-3.5 rounded-[var(--radius-md)] px-3 py-3 transition-colors hover:bg-[var(--theme-primary-soft)] active:bg-[var(--theme-primary-soft)]"
                  style={{ opacity: s.blocked ? 0.72 : 1 }}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <StudentAvatar
                      student={s}
                      className="size-[52px] text-[14px] ring-1 ring-[var(--theme-primary)] ring-opacity-20"
                    />
                    {s.favorite ? (
                      <Star
                        className="absolute -right-0.5 -top-0.5 size-[17px] fill-amber-400 text-amber-500 drop-shadow-sm"
                        aria-hidden
                      />
                    ) : null}
                  </div>

                  {/* Text */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate" style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--theme-charcoal)' }}>
                        {s.name}
                      </span>
                      {timeLabel ? (
                        <span className="shrink-0" style={{ fontSize: 'var(--text-xs)', color: 'var(--theme-charcoal-muted)' }}>
                          {timeLabel}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-0.5 flex items-center gap-2">
                      <p className="flex-1 truncate" style={{ fontSize: 'var(--text-sm)', color: 'var(--theme-charcoal-muted)', lineHeight: 'var(--leading-snug)' }}>
                        {sub}
                      </p>
                      {s.blocked ? (
                        <span
                          className="shrink-0 rounded-[var(--radius-full)] px-2 py-0.5"
                          style={{
                            fontSize: 'var(--text-2xs)',
                            fontWeight: 500,
                            letterSpacing: 'var(--tracking-wider)',
                            textTransform: 'uppercase',
                            background: 'var(--theme-surface-muted)',
                            color: 'var(--theme-charcoal-muted)',
                          }}
                        >
                          Blocked
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
