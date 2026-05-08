import { StudentAvatar } from '@/components/students/StudentAvatar'
import { Button } from '@/components/ui/button'
import { useStudentsStore } from '@/stores/studentsStore'
import { Camera, ChevronLeft } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Webcam from 'react-webcam'

export function StudentCameraPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const students = useStudentsStore((s) => s.students)
  const loadingStudents = useStudentsStore((s) => s.loading)
  const student = id ? students.find((s) => s.id === id) : undefined

  const webcamRef = useRef<Webcam>(null)
  const [ready, setReady] = useState(false)

  const capture = useCallback(() => {
    const shot = webcamRef.current?.getScreenshot()
    if (!shot || !id) return
    fetch(shot)
      .then((r) => r.blob())
      .then((blob) => {
        const mimeType = blob.type || 'image/jpeg'
        navigate(`/student/${id}`, {
          replace: true,
          state: {
            storyCameraCapture: {
              ingestId: crypto.randomUUID(),
              mimeType,
              blob,
            },
          },
        })
      })
      .catch(() => {})
  }, [id, navigate])

  if (!id) {
    return null
  }

  if (loadingStudents) {
    return (
      <div className="flex flex-1 items-center justify-center bg-black py-16 text-sm text-white/70">
        Loading…
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white/90">
        <p className="text-sm text-white/70">This student story could not be found.</p>
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

  if (student.blocked) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-[var(--theme-chat-bg)] px-6 text-center">
        <p className="text-sm text-[var(--theme-charcoal-muted)]">Camera is unavailable while this student is blocked.</p>
        <Link
          to={chatHref}
          className="rounded-full bg-[var(--theme-primary-soft)] px-4 py-2 text-sm font-medium text-[var(--theme-primary)]"
        >
          Back to story
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-black">
      <header className="flex shrink-0 items-center gap-2 bg-[var(--theme-app-header-bg)] px-2 py-2 text-[var(--theme-app-header-fg)] shadow-[var(--shadow)]">
        <Link
          to={chatHref}
          className="rounded-full p-2 text-[var(--theme-app-header-fg)] hover:bg-[rgb(255_255_255_/_0.18)]"
          aria-label="Close camera"
        >
          <ChevronLeft className="size-7" aria-hidden />
        </Link>

        <div className="flex min-w-0 flex-1 items-center gap-3 py-0.5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[rgb(255_255_255_/_0.22)]">
            <Camera className="size-[22px]" aria-hidden />
          </span>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[17px] font-semibold">Take photo</div>
            <div className="truncate text-[13px] opacity-90">{student.name}</div>
          </div>
        </div>

        <StudentAvatar
          student={student}
          tone="inverse"
          className="size-10 shrink-0 text-[13px] ring-2 ring-[rgb(255_255_255_/_0.35)]"
        />
      </header>

      <div className="relative min-h-0 flex-1 bg-neutral-950">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: 'user' }}
          onUserMedia={() => setReady(true)}
          onUserMediaError={() => setReady(false)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      <div className="shrink-0 border-t border-[rgb(255_255_255_/_0.12)] bg-[rgb(0_0_0_/_0.72)] px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+16px)] backdrop-blur-md">
        <p className="mb-3 text-center text-[13px] leading-snug text-white/75">
          Grant camera access if prompted. Photos stay on this device until you send your story entry.
        </p>
        <Button
          type="button"
          className="h-12 w-full rounded-full bg-[var(--theme-primary)] text-[var(--theme-primary-foreground)] hover:bg-[var(--theme-primary-hover)]"
          disabled={!ready}
          onClick={capture}
        >
          Capture photo
        </Button>
      </div>
    </div>
  )
}
