import { StudentAvatar } from '@/components/students/StudentAvatar'
import { StudentFormDialog } from '@/components/students/StudentFormDialog'
import { Input } from '@/components/ui/input'
import type { Student } from '@/db/database'
import { getLastDiaryPreview } from '@/lib/diary'
import { formatChatListTime } from '@/lib/formatChatTime'
import { useStudentsStore } from '@/stores/studentsStore'
import { MessageCircle, Star } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

function subtitleStudent(student: Student, preview?: { snippet: string; at: number }) {
  if (preview?.snippet) return preview.snippet
  if (student.notes.trim()) {
    const n = student.notes.replace(/\s+/g, ' ').trim()
    return n.length > 72 ? `${n.slice(0, 72)}…` : n
  }
  return 'Tap to open story'
}

export function HomePage() {
  const { students, loading, hydrate } = useStudentsStore()
  const [q, setQ] = useState('')
  const [previews, setPreviews] = useState<Record<string, { snippet: string; at: number }>>({})

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const map: Record<string, { snippet: string; at: number }> = {}
      await Promise.all(
        students.map(async (s) => {
          const p = await getLastDiaryPreview(s.id)
          if (p) map[s.id] = p
        }),
      )
      if (!cancelled) setPreviews(map)
    })()
    return () => {
      cancelled = true
    }
  }, [students])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const list = needle ? students.filter((s) => s.name.toLowerCase().includes(needle)) : [...students]
    list.sort((a, b) => {
      if (a.favorite !== b.favorite) return a.favorite ? -1 : 1
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    })
    return list
  }, [students, q])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-16 text-sm text-[var(--theme-charcoal-muted)]">
        Loading…
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col bg-[var(--theme-background)]">
      <div className="border-b border-[var(--theme-border)] px-3 py-2 sm:px-0">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search students"
          aria-label="Search students"
          className="h-9 rounded-lg border-transparent bg-[var(--theme-surface-muted)] text-[15px] placeholder:text-[var(--theme-charcoal-muted)] focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[var(--theme-ring)]"
        />
      </div>

      {students.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 pb-28 pt-10 text-center">
          <div className="flex size-28 items-center justify-center rounded-full bg-[var(--theme-primary-soft)] text-[var(--theme-primary)]">
            <MessageCircle className="size-14" strokeWidth={1.25} aria-hidden />
          </div>
          <div className="max-w-sm space-y-2">
            <p className="text-[20px] font-semibold text-[var(--theme-charcoal)]">Start logging privately</p>
            <p className="text-[14px] leading-relaxed text-[var(--theme-charcoal-muted)]">
              Add a student like starting a new story. Notes, voice, photos, and video stay on this device only.
            </p>
          </div>
          <StudentFormDialog variant="inline" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
          <p className="text-[15px] text-[var(--theme-charcoal-muted)]">No students match “{q.trim()}”.</p>
        </div>
      ) : (
        <ul className="flex-1 divide-y divide-[var(--theme-border)] overflow-y-auto">
          {filtered.map((s) => {
            const preview = previews[s.id]
            const sub = subtitleStudent(s, preview)
            const timeLabel = preview ? formatChatListTime(preview.at) : ''
            return (
              <li key={s.id}>
                <Link
                  to={`/student/${s.id}`}
                  className={`flex items-center gap-3 px-3 py-[10px] transition-colors hover:bg-[var(--theme-primary-soft)] active:bg-[var(--theme-primary-soft)] sm:px-2 ${s.blocked ? 'opacity-75' : ''}`}
                >
                  <div className="relative size-[52px] shrink-0">
                    <StudentAvatar student={s} className="size-full min-h-[52px] min-w-[52px] text-[15px]" />
                    {s.favorite ? (
                      <Star
                        className="absolute -right-0.5 -top-0.5 size-[18px] fill-amber-400 text-amber-500 drop-shadow-sm"
                        aria-hidden
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1 pb-[2px] pt-[2px]">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-[17px] font-medium text-[var(--theme-charcoal)]">
                        {s.name}
                        {s.blocked ? (
                          <span className="ml-2 text-[11px] font-normal uppercase tracking-wide text-[var(--theme-charcoal-muted)]">
                            Blocked
                          </span>
                        ) : null}
                      </span>
                      {timeLabel ? (
                        <span className="shrink-0 text-[12px] text-[var(--theme-charcoal-muted)]">{timeLabel}</span>
                      ) : null}
                    </div>
                    <p className="mt-[2px] truncate text-[14px] leading-snug text-[var(--theme-charcoal-muted)]">{sub}</p>
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
