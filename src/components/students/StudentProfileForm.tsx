import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Student } from '@/db/database'
import { useStudentsStore } from '@/stores/studentsStore'
import { Pencil, Save, X } from 'lucide-react'
import { useState } from 'react'

type Props = {
  student: Student
  onSaved?: () => void
}

export function StudentProfileForm({ student, onSaved }: Props) {
  const updateStudent = useStudentsStore((s) => s.updateStudent)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(student.name)
  const [notes, setNotes] = useState(student.notes)
  const [busy, setBusy] = useState(false)

  function resetFields() {
    setName(student.name)
    setNotes(student.notes)
  }

  function startEdit() {
    resetFields()
    setEditing(true)
  }

  function cancelEdit() {
    resetFields()
    setEditing(false)
  }

  async function saveProfile() {
    if (busy || !name.trim()) return
    setBusy(true)
    try {
      await updateStudent(student.id, { name, notes })
      setEditing(false)
      onSaved?.()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="border-[var(--theme-border-strong)] bg-[var(--theme-surface-subtle)]">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-base">Profile details</CardTitle>
          <CardDescription>Name and notes for your reference only.</CardDescription>
        </div>
        {!editing ? (
          <Button type="button" variant="outline" size="sm" className="shrink-0 gap-2" onClick={startEdit}>
            <Pencil className="size-4" aria-hidden />
            Edit
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!editing ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-[var(--theme-charcoal-muted)]">Display name</p>
              <p className="mt-1 text-[15px] font-medium text-[var(--theme-charcoal)]">{student.name}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--theme-charcoal-muted)]">Notes</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--theme-charcoal)]">
                {student.notes.trim() ? student.notes : '—'}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Display name</Label>
              <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea id="edit-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" className="gap-2" disabled={busy} onClick={cancelEdit}>
                <X className="size-4" aria-hidden />
                Cancel
              </Button>
              <Button type="button" className="gap-2" disabled={busy || !name.trim()} onClick={() => void saveProfile()}>
                <Save className="size-4" aria-hidden />
                Save changes
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
