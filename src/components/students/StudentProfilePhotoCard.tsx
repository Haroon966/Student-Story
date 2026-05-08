import { WebcamCaptureDialog } from '@/components/diary/WebcamCaptureDialog'
import { StudentAvatar } from '@/components/students/StudentAvatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Student } from '@/db/database'
import { useStudentsStore } from '@/stores/studentsStore'
import { Camera, Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'

type Props = {
  student: Student
}

export function StudentProfilePhotoCard({ student }: Props) {
  const updateStudent = useStudentsStore((s) => s.updateStudent)
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)

  async function setPhotoBlob(blob: Blob) {
    if (!blob.size || busy) return
    setBusy(true)
    try {
      await updateStudent(student.id, { profilePhoto: blob })
    } finally {
      setBusy(false)
    }
  }

  async function onFileChange(files: FileList | null) {
    const file = files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    await setPhotoBlob(file)
  }

  async function removePhoto() {
    if (busy) return
    setBusy(true)
    try {
      await updateStudent(student.id, { profilePhoto: null })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Card className="border-[var(--theme-border-strong)] bg-[var(--theme-surface-subtle)]">
        <CardHeader>
          <CardTitle className="text-base">Profile picture</CardTitle>
          <CardDescription>Add a photo for this student. It stays on your device with the rest of the profile.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <StudentAvatar student={student} className="size-24 shrink-0 text-lg ring-2 ring-[var(--theme-border)]" />

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={busy}
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="size-4" aria-hidden />
                Choose image
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={busy}
                onClick={() => setCameraOpen(true)}
              >
                <Camera className="size-4" aria-hidden />
                Take photo
              </Button>
              {student.profilePhoto ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 text-[var(--theme-danger)] hover:bg-[var(--theme-danger-bg)]"
                  disabled={busy}
                  onClick={() => void removePhoto()}
                >
                  <Trash2 className="size-4" aria-hidden />
                  Remove
                </Button>
              ) : null}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                void onFileChange(e.target.files)
                e.target.value = ''
              }}
            />
            <p className="text-xs text-[var(--theme-charcoal-muted)]">JPEG, PNG, WebP, or other images from your gallery.</p>
          </div>
        </CardContent>
      </Card>

      <WebcamCaptureDialog
        open={cameraOpen}
        onOpenChange={setCameraOpen}
        onCapture={(blob) => void setPhotoBlob(blob)}
      />
    </>
  )
}
