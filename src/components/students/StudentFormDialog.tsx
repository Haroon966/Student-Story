import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useStudentsStore } from '@/stores/studentsStore'
import { MessageSquarePlus, UserPlus } from 'lucide-react'
import { useState } from 'react'

type Variant = 'default' | 'fab' | 'inline' | 'headless'

type Props = {
  label?: string
  variant?: Variant
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function StudentFormDialog({
  label = 'New student',
  variant = 'default',
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: Props) {
  const addStudent = useStudentsStore((s) => s.addStudent)
  const [internalOpen, setInternalOpen] = useState(false)
  const controlled = openProp !== undefined && onOpenChangeProp !== undefined
  const open    = controlled ? openProp    : internalOpen
  const setOpen = controlled ? onOpenChangeProp : setInternalOpen

  const [name,  setName]  = useState('')
  const [notes, setNotes] = useState('')
  const [busy,  setBusy]  = useState(false)

  async function submit() {
    const trimmed = name.trim()
    if (!trimmed || busy) return
    setBusy(true)
    try {
      await addStudent(trimmed, notes)
      setName(''); setNotes(''); setOpen(false)
    } finally { setBusy(false) }
  }

  const trigger =
    variant === 'fab' ? (
      <button
        type="button"
        className={cn(
          'fixed bottom-5 right-4 z-40 flex size-14 items-center justify-center rounded-[var(--radius-full)] shadow-lg',
          'bg-[var(--theme-primary)] text-[var(--theme-primary-foreground)] hover:bg-[var(--theme-primary-hover)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-ring)] focus-visible:ring-offset-2 active:scale-95',
        )}
        aria-label="New student"
      >
        <MessageSquarePlus className="size-6" aria-hidden />
      </button>
    ) : variant === 'inline' ? (
      <Button type="button" className="gap-2 px-6">
        <UserPlus className="size-4" aria-hidden />
        {label}
      </Button>
    ) : variant === 'default' ? (
      <Button type="button" className="gap-2">
        <UserPlus className="size-4" aria-hidden />
        {label}
      </Button>
    ) : null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {variant !== 'headless' && trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle style={{ fontSize: 'var(--text-lg)', fontWeight: 700, letterSpacing: 'var(--tracking-tight)' }}>
            New student
          </DialogTitle>
          <DialogDescription style={{ fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-body)', color: 'var(--theme-charcoal-muted)' }}>
            This opens a private story for that student. Everything stays on this device.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-1">
          <div className="grid gap-2">
            <Label htmlFor="student-name" style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>Name</Label>
            <input
              id="student-name"
              type="text"
              autoComplete="off"
              placeholder="e.g. Jamie Rivera"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void submit() }}
              className="flex h-10 w-full rounded-[var(--radius-md)] border px-3 outline-none transition-shadow focus:border-[var(--theme-primary)] focus:shadow-[0_0_0_3px_var(--theme-ring)]"
              style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-surface)', fontSize: 'var(--text-base)', color: 'var(--theme-charcoal)' }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="student-notes" style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>Notes <span className="font-normal" style={{ color: 'var(--theme-charcoal-muted)' }}>(optional)</span></Label>
            <Textarea
              id="student-notes"
              placeholder="Class, guardians, learning preferences…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              style={{ fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-body)' }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="button" disabled={!name.trim() || busy} onClick={() => void submit()}>
            Create story
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
