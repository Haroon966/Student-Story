import { StudentAvatar } from '@/components/students/StudentAvatar'
import { StudentProfileForm } from '@/components/students/StudentProfileForm'
import { StudentProfilePhotoCard } from '@/components/students/StudentProfilePhotoCard'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { exportStudentSliceToFile } from '@/lib/backup'
import { useStudentsStore } from '@/stores/studentsStore'
import { AlertTriangle, Ban, ChevronLeft, Download, Loader2, Star, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

function SectionCard({
  children,
  danger = false,
}: {
  children: React.ReactNode
  danger?: boolean
}) {
  return (
    <div
      className="overflow-hidden rounded-[var(--radius-lg)] border"
      style={{
        borderColor: danger ? 'rgb(192 40 28 / 0.3)' : 'var(--theme-border)',
        borderLeft: danger ? '4px solid var(--theme-danger)' : undefined,
        background: danger ? 'var(--theme-danger-bg)' : 'var(--theme-surface)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {children}
    </div>
  )
}

function SectionHeader({ title, description, danger = false }: { title: string; description?: string; danger?: boolean }) {
  return (
    <div className="px-5 pb-2 pt-5">
      <p
        className="font-semibold"
        style={{
          fontSize: 'var(--text-base)',
          color: danger ? 'var(--theme-danger)' : 'var(--theme-charcoal)',
          lineHeight: 'var(--leading-tight)',
        }}
      >
        {title}
      </p>
      {description ? (
        <p className="mt-1" style={{ fontSize: 'var(--text-sm)', color: 'var(--theme-charcoal-muted)', lineHeight: 'var(--leading-body)' }}>
          {description}
        </p>
      ) : null}
    </div>
  )
}

export function StudentProfilePage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const students       = useStudentsStore((s) => s.students)
  const loadingStudents = useStudentsStore((s) => s.loading)
  const hydrate        = useStudentsStore((s) => s.hydrate)
  const updateStudent  = useStudentsStore((s) => s.updateStudent)
  const removeStudent  = useStudentsStore((s) => s.removeStudent)

  const student = id ? students.find((s) => s.id === id) : undefined

  const [deleteWarningOpen, setDeleteWarningOpen] = useState(false)
  const [deleteBusy, setDeleteBusy]   = useState(false)
  const [exportBusy, setExportBusy]   = useState(false)

  useEffect(() => { void hydrate() }, [hydrate])

  async function toggleFavorite() {
    if (!student) return
    await updateStudent(student.id, { favorite: !student.favorite })
  }

  async function toggleBlocked() {
    if (!student) return
    await updateStudent(student.id, { blocked: !student.blocked })
  }

  async function handleExportStorySlice() {
    if (!id || !student || exportBusy) return
    setExportBusy(true)
    try { await exportStudentSliceToFile(id, student.name) }
    finally { setExportBusy(false) }
  }

  async function confirmDeleteStudent() {
    if (!id || deleteBusy) return
    setDeleteBusy(true)
    try {
      await removeStudent(id)
      setDeleteWarningOpen(false)
      navigate('/')
    } finally { setDeleteBusy(false) }
  }

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
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--theme-charcoal-muted)' }}>This student could not be found.</p>
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

  const chatHref = `/student/${id}`

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ background: 'var(--theme-chat-bg)' }}>

      {/* Header */}
      <header
        className="flex shrink-0 items-center gap-2 px-2 py-2"
        style={{ background: 'var(--theme-app-header-bg)', boxShadow: 'var(--shadow-md)', color: 'var(--theme-app-header-fg)' }}
      >
        <Link
          to={chatHref}
          className="rounded-[var(--radius-full)] p-2 hover:bg-[rgb(255_255_255_/_0.18)]"
          aria-label="Back to story"
        >
          <ChevronLeft className="size-6" aria-hidden />
        </Link>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <StudentAvatar
            student={student}
            tone="inverse"
            className="size-10 shrink-0 text-[13px] ring-2 ring-[rgb(255_255_255_/_0.35)]"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="truncate font-semibold"
                style={{ fontSize: 'var(--text-md)', letterSpacing: 'var(--tracking-tight)', lineHeight: 'var(--leading-tight)' }}
              >
                {student.name}
              </span>
              {student.favorite ? (
                <Star className="size-4 shrink-0 fill-amber-400 text-amber-500" aria-label="Favorite" />
              ) : null}
            </div>
            <div className="truncate opacity-80" style={{ fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-snug)', fontWeight: 400 }}>
              {student.blocked ? 'Blocked · story paused' : 'Profile · offline'}
            </div>
          </div>
        </div>
      </header>

      {/* Scrollable content */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-6">
        <div className="mx-auto flex max-w-lg flex-col gap-4">

          {/* Photo */}
          <StudentProfilePhotoCard student={student} />

          {/* Edit form */}
          <StudentProfileForm student={student} />

          {/* Export */}
          <SectionCard>
            <SectionHeader
              title="Export this student's story"
              description={"Save a JSON file with this profile, diary entries, attachments, and AI messages. Restore it from Download center → \u201cImport one student\u2019s story\u201d."}
            />
            <div className="px-5 pb-5 pt-3">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                disabled={exportBusy}
                onClick={() => void handleExportStorySlice()}
              >
                {exportBusy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Download className="size-4" aria-hidden />}
                Download student backup
              </Button>
            </div>
          </SectionCard>

          {/* Favorites & blocking */}
          <SectionCard>
            <SectionHeader
              title="Favorites & blocking"
              description="Favorites appear at the top of your story list. Blocking pauses new entries."
            />
            <div className="flex flex-col gap-3 px-5 pb-5 pt-3">
              <Button
                type="button"
                variant={student.favorite ? 'default' : 'outline'}
                className="w-full justify-start gap-3 sm:w-auto"
                onClick={() => void toggleFavorite()}
              >
                <Star className={`size-4 ${student.favorite ? 'fill-current' : ''}`} aria-hidden />
                {student.favorite ? 'Remove from favorites' : 'Add to favorites'}
              </Button>
              <Button
                type="button"
                variant={student.blocked ? 'destructive' : 'outline'}
                className="w-full justify-start gap-3 sm:w-auto"
                onClick={() => void toggleBlocked()}
              >
                <Ban className="size-4" aria-hidden />
                {student.blocked ? 'Unblock student' : 'Block student'}
              </Button>
            </div>
          </SectionCard>

          {/* Danger zone */}
          <SectionCard danger>
            <SectionHeader
              title="Danger zone"
              description="Permanently delete this student and every story entry and attachment stored for them on this device."
              danger
            />
            <div className="px-5 pb-5 pt-3">
              <Button
                type="button"
                variant="destructive"
                className="gap-2"
                onClick={() => setDeleteWarningOpen(true)}
              >
                <Trash2 className="size-4" aria-hidden />
                Delete student and story
              </Button>
            </div>
          </SectionCard>

        </div>
      </div>

      {/* Delete dialog */}
      <Dialog open={deleteWarningOpen} onOpenChange={(open) => !deleteBusy && setDeleteWarningOpen(open)}>
        <DialogContent className="gap-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ color: 'var(--theme-danger)' }}>
              <AlertTriangle className="size-5 shrink-0" aria-hidden />
              Delete this student?
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-1" style={{ color: 'var(--theme-charcoal-muted)', fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-body)' }}>
                <p>
                  You are about to permanently remove{' '}
                  <span className="font-semibold" style={{ color: 'var(--theme-charcoal)' }}>{student.name}</span> from this device.
                </p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>The student profile and notes</li>
                  <li>Every story entry for this student</li>
                  <li>All attached photos, videos, and voice notes</li>
                </ul>
                <p className="font-medium" style={{ color: 'var(--theme-charcoal)' }}>
                  This cannot be undone. Export a backup first if you need a copy.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" disabled={deleteBusy} onClick={() => setDeleteWarningOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={deleteBusy} className="gap-2" onClick={() => void confirmDeleteStudent()}>
              <Trash2 className="size-4" aria-hidden />
              {deleteBusy ? 'Deleting…' : 'Delete permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
