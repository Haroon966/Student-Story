import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  exportBackupToFile,
  getBackupImportSummary,
  importBackupPayload,
  importStudentSlicePayload,
  parseBackupJson,
  type ParsedBackup,
} from '@/lib/backup'
import { useStudentsStore } from '@/stores/studentsStore'
import { AlertTriangle, Download, Loader2, RefreshCw, Upload, User } from 'lucide-react'
import { useRef, useState } from 'react'

function BackupCard({
  icon,
  iconBg,
  title,
  description,
  children,
}: {
  icon: React.ReactNode
  iconBg?: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-[var(--radius-lg)] border"
      style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-surface)', boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="flex items-start gap-3.5 px-5 pt-5">
        <span
          className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)]"
          style={{ background: iconBg ?? 'var(--theme-primary-soft)', color: 'var(--theme-primary)' }}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold" style={{ fontSize: 'var(--text-base)', color: 'var(--theme-charcoal)', lineHeight: 'var(--leading-tight)' }}>{title}</p>
          <p className="mt-0.5" style={{ fontSize: 'var(--text-sm)', color: 'var(--theme-charcoal-muted)', lineHeight: 'var(--leading-body)' }}>{description}</p>
        </div>
      </div>
      <div className="px-5 pb-5 pt-4">{children}</div>
    </div>
  )
}

export function DownloadCenterPage() {
  const hydrate = useStudentsStore((s) => s.hydrate)
  const fileRef = useRef<HTMLInputElement>(null)
  const studentFileRef = useRef<HTMLInputElement>(null)
  const [banner, setBanner] = useState<string | null>(null)
  const [exportBusy, setExportBusy] = useState(false)
  const [fullConfirmBusy, setFullConfirmBusy] = useState(false)
  const [studentConfirmBusy, setStudentConfirmBusy] = useState(false)

  const [fullDialogOpen, setFullDialogOpen] = useState(false)
  const [pendingFull, setPendingFull] = useState<ParsedBackup | null>(null)
  const [fullReplaceUnderstood, setFullReplaceUnderstood] = useState(false)

  const [studentDialogOpen, setStudentDialogOpen] = useState(false)
  const [pendingStudent, setPendingStudent] = useState<ParsedBackup | null>(null)
  const [studentReplaceUnderstood, setStudentReplaceUnderstood] = useState(false)

  const isError = (msg: string) => msg.includes('Could not') || msg.includes('failed') || msg.includes('invalid')

  function showBanner(message: string, error: boolean) {
    setBanner(message)
    window.setTimeout(() => setBanner(null), error ? 6000 : 4500)
  }

  async function onExport(includeMedia: boolean) {
    setExportBusy(true); setBanner(null)
    try {
      await exportBackupToFile({ includeMedia })
      showBanner(includeMedia ? 'Full backup file saved.' : 'Text-only backup saved (no attachments or profile pictures).', false)
    } catch { showBanner('Could not save backup.', true) }
    finally { setExportBusy(false) }
  }

  function onPickFullImportFile(file: File | undefined) {
    if (!file) return
    void (async () => {
      setBanner(null)
      try {
        const parsed = parseBackupJson(await file.text())
        const summary = getBackupImportSummary(parsed)
        if (summary.backupKind === 'student') { showBanner("That file is a single-student backup. Use \u201cImport one student\u2019s story\u201d below.", true); return }
        setPendingFull(parsed); setFullReplaceUnderstood(false); setFullDialogOpen(true)
      } catch { showBanner('Could not read backup (invalid or corrupted file).', true) }
    })()
  }

  async function confirmFullImport() {
    if (!pendingFull || !fullReplaceUnderstood || fullConfirmBusy) return
    setFullConfirmBusy(true); setBanner(null)
    try {
      await importBackupPayload(pendingFull); await hydrate()
      setFullDialogOpen(false); setPendingFull(null)
      showBanner('Backup imported. All previous data on this device was replaced.', false)
    } catch { showBanner('Import failed.', true) }
    finally { setFullConfirmBusy(false) }
  }

  function onPickStudentImportFile(file: File | undefined) {
    if (!file) return
    void (async () => {
      setBanner(null)
      try {
        const parsed = parseBackupJson(await file.text())
        const summary = getBackupImportSummary(parsed)
        if (summary.backupKind !== 'student') { showBanner('That file is a full-device backup. Use "Replace everything on this device" above.', true); return }
        setPendingStudent(parsed); setStudentReplaceUnderstood(false); setStudentDialogOpen(true)
      } catch { showBanner('Could not read backup (invalid or corrupted file).', true) }
    })()
  }

  async function confirmStudentImport() {
    if (!pendingStudent || !studentReplaceUnderstood || studentConfirmBusy) return
    setStudentConfirmBusy(true); setBanner(null)
    try {
      await importStudentSlicePayload(pendingStudent); await hydrate()
      setStudentDialogOpen(false); setPendingStudent(null)
      showBanner('Student story imported. Matching profiles on this device were replaced.', false)
    } catch { showBanner('Import failed.', true) }
    finally { setStudentConfirmBusy(false) }
  }

  const fullSummary    = pendingFull    ? getBackupImportSummary(pendingFull)    : null
  const studentSummary = pendingStudent ? getBackupImportSummary(pendingStudent) : null

  return (
    <div className="flex flex-1 flex-col gap-5 px-3 pb-8 pt-4 sm:px-4">

      {/* Heading */}
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--theme-charcoal)', letterSpacing: 'var(--tracking-tight)', lineHeight: 'var(--leading-tight)' }}>
          Backup &amp; restore
        </h1>
        <p className="mt-1" style={{ fontSize: 'var(--text-sm)', color: 'var(--theme-charcoal-muted)', lineHeight: 'var(--leading-body)' }}>
          Export full or per-student JSON backups, or restore from a file. Data stays on this device until you export it.
        </p>
      </div>

      {/* Banner */}
      {banner ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-[var(--radius-md)] border px-4 py-3"
          style={{
            fontSize: 'var(--text-sm)',
            borderColor: isError(banner) ? 'var(--theme-danger)' : 'var(--theme-primary)',
            background: isError(banner) ? 'var(--theme-danger-bg)' : 'var(--theme-primary-soft)',
            color: isError(banner) ? 'var(--theme-danger)' : 'var(--theme-charcoal)',
          }}
        >
          {banner}
        </div>
      ) : null}

      {/* Export card */}
      <BackupCard
        icon={<Download className="size-4" />}
        title="Export backup"
        description="Full backup includes diary attachments and profile pictures. Text-only is smaller and omits binary data."
      >
        <div className="flex flex-wrap gap-2">
          <Button type="button" className="gap-2" disabled={exportBusy} onClick={() => void onExport(true)}>
            {exportBusy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Download className="size-4" aria-hidden />}
            Save full backup
          </Button>
          <Button type="button" variant="outline" className="gap-2" disabled={exportBusy} onClick={() => void onExport(false)}>
            {exportBusy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Download className="size-4" aria-hidden />}
            Save text-only
          </Button>
        </div>
      </BackupCard>

      {/* Full device restore card */}
      <BackupCard
        icon={<RefreshCw className="size-4" />}
        title="Replace everything on this device"
        description="Restore a full-device backup. You must confirm — this deletes current stories on this device first."
      >
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" disabled={fullConfirmBusy} onChange={(e) => { onPickFullImportFile(e.target.files?.[0]); e.target.value = '' }} />
        <Button type="button" variant="outline" className="gap-2" disabled={fullConfirmBusy} onClick={() => fileRef.current?.click()}>
          {fullConfirmBusy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />}
          Choose full backup file
        </Button>
      </BackupCard>

      {/* Single-student import card */}
      <BackupCard
        icon={<User className="size-4" />}
        title="Import one student's story"
        description="Use a single-student file exported from a student profile. Other students on this device are untouched."
      >
        <input ref={studentFileRef} type="file" accept="application/json,.json" className="hidden" disabled={studentConfirmBusy} onChange={(e) => { onPickStudentImportFile(e.target.files?.[0]); e.target.value = '' }} />
        <Button type="button" variant="outline" className="gap-2" disabled={studentConfirmBusy} onClick={() => studentFileRef.current?.click()}>
          {studentConfirmBusy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />}
          Choose student backup file
        </Button>
      </BackupCard>

      {/* Full replace confirm dialog */}
      <Dialog open={fullDialogOpen} onOpenChange={(open) => { if (!open && !fullConfirmBusy) { setFullDialogOpen(false); setPendingFull(null) } }}>
        <DialogContent className="gap-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 shrink-0" style={{ color: 'var(--theme-danger)' }} aria-hidden />
              Replace all data on this device?
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-1" style={{ fontSize: 'var(--text-sm)', color: 'var(--theme-charcoal-muted)', lineHeight: 'var(--leading-body)' }}>
                <p>Importing will permanently erase every student, story entry, attachment, and AI conversation currently stored, then replace them with the backup file.</p>
                {fullSummary ? (
                  <p style={{ color: 'var(--theme-charcoal)' }}>
                    This file contains{' '}
                    <strong>{fullSummary.studentCount} student{fullSummary.studentCount === 1 ? '' : 's'}</strong>,{' '}
                    {fullSummary.entryCount} diary {fullSummary.entryCount === 1 ? 'entry' : 'entries'},{' '}
                    {fullSummary.mediaCount} media attachment{fullSummary.mediaCount === 1 ? '' : 's'}, and{' '}
                    {fullSummary.aiCount} AI message{fullSummary.aiCount === 1 ? '' : 's'}.
                  </p>
                ) : null}
                <p className="font-medium" style={{ color: 'var(--theme-charcoal)' }}>Export a backup first if you need to keep what you have today.</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div
            className="flex items-start gap-3 rounded-[var(--radius-md)] border p-3"
            style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-surface-muted)', borderLeft: '3px solid var(--theme-primary)' }}
          >
            <input id="full-replace-understood" type="checkbox" className="mt-1 size-4 shrink-0 accent-[var(--theme-primary)]" checked={fullReplaceUnderstood} onChange={(e) => setFullReplaceUnderstood(e.target.checked)} />
            <Label htmlFor="full-replace-understood" className="cursor-pointer font-normal leading-snug" style={{ fontSize: 'var(--text-sm)', color: 'var(--theme-charcoal)' }}>
              I understand this will erase current app data and cannot be undone except by importing another backup.
            </Label>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" disabled={fullConfirmBusy} onClick={() => void onExport(true)}>
              <Download className="size-4" aria-hidden /> Export first
            </Button>
            <Button type="button" variant="outline" disabled={fullConfirmBusy} onClick={() => setFullDialogOpen(false)}>Cancel</Button>
            <Button type="button" variant="destructive" disabled={!fullReplaceUnderstood || fullConfirmBusy} className="gap-2" onClick={() => void confirmFullImport()}>
              {fullConfirmBusy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Replace with backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student replace confirm dialog */}
      <Dialog open={studentDialogOpen} onOpenChange={(open) => { if (!open && !studentConfirmBusy) { setStudentDialogOpen(false); setPendingStudent(null) } }}>
        <DialogContent className="gap-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 shrink-0" style={{ color: 'var(--theme-danger)' }} aria-hidden />
              Replace this student's data?
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-1" style={{ fontSize: 'var(--text-sm)', color: 'var(--theme-charcoal-muted)', lineHeight: 'var(--leading-body)' }}>
                <p>Students in this file will be removed from this device along with their stories, then re-inserted from the backup. Other students are not affected.</p>
                {studentSummary ? (
                  <p style={{ color: 'var(--theme-charcoal)' }}>
                    <strong>{studentSummary.studentCount} student{studentSummary.studentCount === 1 ? '' : 's'}</strong>,{' '}
                    {studentSummary.entryCount} diary {studentSummary.entryCount === 1 ? 'entry' : 'entries'},{' '}
                    {studentSummary.mediaCount} media, {studentSummary.aiCount} AI message{studentSummary.aiCount === 1 ? '' : 's'}.
                  </p>
                ) : null}
              </div>
            </DialogDescription>
          </DialogHeader>
          <div
            className="flex items-start gap-3 rounded-[var(--radius-md)] border p-3"
            style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-surface-muted)', borderLeft: '3px solid var(--theme-primary)' }}
          >
            <input id="student-replace-understood" type="checkbox" className="mt-1 size-4 shrink-0 accent-[var(--theme-primary)]" checked={studentReplaceUnderstood} onChange={(e) => setStudentReplaceUnderstood(e.target.checked)} />
            <Label htmlFor="student-replace-understood" className="cursor-pointer font-normal leading-snug" style={{ fontSize: 'var(--text-sm)', color: 'var(--theme-charcoal)' }}>
              I understand matching student profiles on this device will be overwritten by this file.
            </Label>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" disabled={studentConfirmBusy} onClick={() => setStudentDialogOpen(false)}>Cancel</Button>
            <Button type="button" disabled={!studentReplaceUnderstood || studentConfirmBusy} className="gap-2" style={{ background: 'var(--theme-primary)', color: '#fff' }} onClick={() => void confirmStudentImport()}>
              {studentConfirmBusy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Import student story
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
