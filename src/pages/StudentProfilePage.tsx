import { StudentAvatar } from '@/components/students/StudentAvatar'
import { StudentProfileForm } from '@/components/students/StudentProfileForm'
import { StudentProfilePhotoCard } from '@/components/students/StudentProfilePhotoCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useStudentsStore } from '@/stores/studentsStore'
import { AlertTriangle, Ban, ChevronLeft, Star, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

export function StudentProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const students = useStudentsStore((s) => s.students)
  const loadingStudents = useStudentsStore((s) => s.loading)
  const hydrate = useStudentsStore((s) => s.hydrate)
  const updateStudent = useStudentsStore((s) => s.updateStudent)
  const removeStudent = useStudentsStore((s) => s.removeStudent)

  const student = id ? students.find((s) => s.id === id) : undefined

  const [deleteWarningOpen, setDeleteWarningOpen] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  async function toggleFavorite() {
    if (!student) return
    await updateStudent(student.id, { favorite: !student.favorite })
  }

  async function toggleBlocked() {
    if (!student) return
    await updateStudent(student.id, { blocked: !student.blocked })
  }

  async function confirmDeleteStudent() {
    if (!id || deleteBusy) return
    setDeleteBusy(true)
    try {
      await removeStudent(id)
      setDeleteWarningOpen(false)
      navigate('/')
    } finally {
      setDeleteBusy(false)
    }
  }

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
        <p className="text-sm text-[var(--theme-charcoal-muted)]">This student could not be found.</p>
        <Link
          to="/"
          className="rounded-full bg-[var(--theme-primary-soft)] px-4 py-2 text-sm font-medium text-[var(--theme-primary)]"
        >
          Back to stories
        </Link>
      </div>
    )
  }

  const chatHref = `/student/${id}`

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--theme-chat-bg)]">
      <header className="flex shrink-0 items-center gap-2 bg-[var(--theme-app-header-bg)] px-2 py-2 text-[var(--theme-app-header-fg)] shadow-[var(--shadow)]">
        <Link
          to={chatHref}
          className="rounded-full p-2 text-[var(--theme-app-header-fg)] hover:bg-[rgb(255_255_255_/_0.18)]"
          aria-label="Back to story"
        >
          <ChevronLeft className="size-7" aria-hidden />
        </Link>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <StudentAvatar
            student={student}
            tone="inverse"
            className="size-10 shrink-0 text-[13px] ring-2 ring-[rgb(255_255_255_/_0.35)]"
          />
          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-2">
              <span className="truncate text-[17px] font-semibold">{student.name}</span>
              {student.favorite ? (
                <Star className="size-4 shrink-0 fill-amber-400 text-amber-500" aria-label="Favorite" />
              ) : null}
            </div>
            <div className="truncate text-[13px] opacity-90">
              {student.blocked ? 'Blocked · story paused' : 'Profile · offline'}
            </div>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-6">
        <div className="mx-auto flex max-w-lg flex-col gap-4">
          <StudentProfilePhotoCard student={student} />

          <StudentProfileForm student={student} />

          <Card className="border-[var(--theme-border-strong)] bg-[var(--theme-surface-subtle)]">
            <CardHeader>
              <CardTitle className="text-base">Favorites & blocking</CardTitle>
              <CardDescription>Favorites appear at the top of your story list. Blocking pauses new entries.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
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
            </CardContent>
          </Card>

          <Card className="border-[var(--theme-danger)]/35 bg-[var(--theme-danger-bg)]">
            <CardHeader>
              <CardTitle className="text-base text-[var(--theme-danger)]">Danger zone</CardTitle>
              <CardDescription className="text-[var(--theme-charcoal-muted)]">
                Permanently delete this student and every story entry and attachment stored for them on this device.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                variant="destructive"
                className="gap-2"
                onClick={() => setDeleteWarningOpen(true)}
              >
                <Trash2 className="size-4" aria-hidden />
                Delete student and story
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={deleteWarningOpen} onOpenChange={(open) => !deleteBusy && setDeleteWarningOpen(open)}>
        <DialogContent className="gap-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[var(--theme-danger)]">
              <AlertTriangle className="size-5 shrink-0" aria-hidden />
              Delete this student?
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-1 text-[var(--theme-charcoal-muted)]">
                <p>
                  You are about to permanently remove{' '}
                  <span className="font-semibold text-[var(--theme-charcoal)]">{student.name}</span> from this device.
                </p>
                <p className="text-sm text-[var(--theme-charcoal)]">This will delete:</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--theme-charcoal-muted)]">
                  <li>The student profile and notes</li>
                  <li>Every story entry for this student</li>
                  <li>All attached photos, videos, and voice notes</li>
                </ul>
                <p className="text-sm font-medium text-[var(--theme-charcoal)]">
                  This cannot be undone. Export a backup first if you need a copy.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={deleteBusy}
              onClick={() => setDeleteWarningOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteBusy}
              className="gap-2"
              onClick={() => void confirmDeleteStudent()}
            >
              <Trash2 className="size-4" aria-hidden />
              {deleteBusy ? 'Deleting…' : 'Delete permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
