import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { exportBackupToFile, importBackupFromFile } from '@/lib/backup'
import { useStudentsStore } from '@/stores/studentsStore'
import { Download, Loader2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'

export function DownloadCenterPage() {
  const hydrate = useStudentsStore((s) => s.hydrate)
  const fileRef = useRef<HTMLInputElement>(null)
  const [banner, setBanner] = useState<string | null>(null)
  const [exportBusy, setExportBusy] = useState(false)
  const [importBusy, setImportBusy] = useState(false)

  async function onExport() {
    setExportBusy(true)
    setBanner(null)
    try {
      await exportBackupToFile()
      setBanner('Backup file saved.')
      window.setTimeout(() => setBanner(null), 4000)
    } catch {
      setBanner('Could not save backup.')
      window.setTimeout(() => setBanner(null), 5000)
    } finally {
      setExportBusy(false)
    }
  }

  async function onPickImport(file: File | undefined) {
    if (!file) return
    setImportBusy(true)
    setBanner(null)
    try {
      await importBackupFromFile(file)
      await hydrate()
      setBanner('Backup imported successfully.')
      window.setTimeout(() => setBanner(null), 4000)
    } catch {
      setBanner('Could not import backup (invalid or corrupted file).')
      window.setTimeout(() => setBanner(null), 5000)
    } finally {
      setImportBusy(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 pb-2">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--theme-charcoal)]">Download center</h1>
        <p className="mt-1 text-sm text-[var(--theme-charcoal-muted)]">
          Export a JSON backup of students, diary entries, media metadata, and AI chat history — or restore from a
          previous backup. Everything stays under your control on this device until you export it.
        </p>
      </div>

      {banner ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            banner.includes('Could not')
              ? 'border-[var(--theme-danger)] bg-[var(--theme-danger-bg)] text-[var(--theme-danger)]'
              : 'border-[var(--theme-primary)] bg-[var(--theme-primary-soft)] text-[var(--theme-charcoal)]'
          }`}
        >
          {banner}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Download className="size-5 text-[var(--theme-primary)]" aria-hidden />
              Export backup
            </CardTitle>
            <CardDescription>
              Download a single JSON file you can store on another drive or cloud folder you trust.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              className="w-full gap-2 sm:w-auto"
              disabled={exportBusy}
              onClick={() => void onExport()}
            >
              {exportBusy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Download className="size-4" aria-hidden />}
              Save backup file
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="size-5 text-[var(--theme-primary)]" aria-hidden />
              Import backup
            </CardTitle>
            <CardDescription>
              Replace current app data with the contents of a backup file. This clears existing data first — use with
              care.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              disabled={importBusy}
              onChange={(e) => {
                void onPickImport(e.target.files?.[0])
                e.target.value = ''
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 sm:w-auto"
              disabled={importBusy}
              onClick={() => fileRef.current?.click()}
            >
              {importBusy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />}
              Choose backup file
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
