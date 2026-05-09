import { db, type AiMessage, type DiaryEntry, type DiaryMedia, type Student } from '@/db/database'

type SerializedMedia = Omit<DiaryMedia, 'blob'> & { dataBase64: string }

/** JSON-safe student row for backup files (v2+). */
export type ExportedStudent = Omit<Student, 'profilePhoto'> & {
  profilePhoto?: { mimeType: string; dataBase64: string }
}

export type BackupKind = 'full' | 'student'

export type BackupPayload = {
  version: 3
  /** Omit or `'full'` for device-wide backups; `'student'` for single-student slices. */
  backupKind?: BackupKind
  exportedAt: number
  students: ExportedStudent[]
  diaryEntries: DiaryEntry[]
  diaryMedia: SerializedMedia[]
  aiMessages: AiMessage[]
}

export type BuildBackupOptions = {
  /** When false, diary attachments and profile photos are omitted (smaller JSON). Default true. */
  includeMedia?: boolean
}

type LegacyBackupV1 = {
  version: 1
  exportedAt: number
  students: Array<Record<string, unknown>>
  diaryEntries: DiaryEntry[]
  diaryMedia: SerializedMedia[]
}

type LegacyBackupV2 = {
  version: 2
  exportedAt: number
  students: Array<Record<string, unknown>>
  diaryEntries: DiaryEntry[]
  diaryMedia: SerializedMedia[]
}

export type ParsedBackup = LegacyBackupV1 | LegacyBackupV2 | BackupPayload

export type BackupImportSummary = {
  backupKind: BackupKind
  studentCount: number
  entryCount: number
  mediaCount: number
  aiCount: number
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const r = reader.result
      if (typeof r !== 'string') {
        reject(new Error('Unexpected FileReader result'))
        return
      }
      const comma = r.indexOf(',')
      resolve(comma >= 0 ? r.slice(comma + 1) : r)
    }
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'))
    reader.readAsDataURL(blob)
  })
}

export function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mimeType })
}

async function deserializeStudentFromBackup(raw: Record<string, unknown>): Promise<Student> {
  const base: Student = {
    id: String(raw.id ?? ''),
    name: typeof raw.name === 'string' ? raw.name : '',
    notes: typeof raw.notes === 'string' ? raw.notes : '',
    favorite: Boolean(raw.favorite),
    blocked: Boolean(raw.blocked),
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : Date.now(),
  }
  const pp = raw.profilePhoto
  if (pp && typeof pp === 'object' && pp !== null && 'dataBase64' in pp) {
    const photo = pp as { dataBase64?: unknown; mimeType?: unknown }
    if (typeof photo.dataBase64 === 'string') {
      const mime = typeof photo.mimeType === 'string' ? photo.mimeType : 'image/jpeg'
      base.profilePhoto = base64ToBlob(photo.dataBase64, mime)
    }
  }
  return base
}

/** Validates backup JSON shape (does not touch IndexedDB). */
export function parseBackupJson(text: string): ParsedBackup {
  let parsed: unknown
  try {
    parsed = JSON.parse(text) as unknown
  } catch {
    throw new Error('Invalid backup file')
  }
  if (!parsed || typeof parsed !== 'object') throw new Error('Invalid backup file')
  const p = parsed as { version?: unknown; students?: unknown; diaryEntries?: unknown }
  if (
    (p.version !== 1 && p.version !== 2 && p.version !== 3) ||
    !Array.isArray(p.students) ||
    !Array.isArray(p.diaryEntries)
  ) {
    throw new Error('Invalid backup file')
  }
  return parsed as ParsedBackup
}

export function getBackupImportSummary(parsed: ParsedBackup): BackupImportSummary {
  const studentCount = parsed.students?.length ?? 0
  const entryCount = parsed.diaryEntries?.length ?? 0
  const mediaCount = parsed.diaryMedia?.length ?? 0
  const aiCount =
    parsed.version === 3 && Array.isArray(parsed.aiMessages) ? parsed.aiMessages.length : 0
  const backupKind: BackupKind =
    parsed.version === 3 && parsed.backupKind === 'student' ? 'student' : 'full'
  return { backupKind, studentCount, entryCount, mediaCount, aiCount }
}

export async function buildBackupPayload(options?: BuildBackupOptions): Promise<BackupPayload> {
  const includeMedia = options?.includeMedia !== false
  const [students, diaryEntries, diaryMedia, aiMessages] = await Promise.all([
    db.students.toArray(),
    db.diaryEntries.toArray(),
    db.diaryMedia.toArray(),
    db.aiMessages.toArray(),
  ])

  const studentsExported: ExportedStudent[] = await Promise.all(
    students.map(async (s) => {
      const { profilePhoto, ...rest } = s
      if (!includeMedia || !profilePhoto) return { ...rest }
      const dataBase64 = await blobToBase64(profilePhoto)
      return {
        ...rest,
        profilePhoto: { mimeType: profilePhoto.type || 'image/jpeg', dataBase64 },
      }
    }),
  )

  const serialized: SerializedMedia[] = []
  if (includeMedia) {
    for (const row of diaryMedia) {
      const dataBase64 = await blobToBase64(row.blob)
      serialized.push({
        id: row.id,
        entryId: row.entryId,
        kind: row.kind,
        mimeType: row.mimeType,
        createdAt: row.createdAt,
        dataBase64,
        ...(row.caption?.trim() ? { caption: row.caption.trim() } : {}),
      })
    }
  }

  return {
    version: 3,
    backupKind: 'full',
    exportedAt: Date.now(),
    students: studentsExported,
    diaryEntries,
    diaryMedia: serialized,
    aiMessages,
  }
}

/** Builds a v3 backup payload for one student (story entries, media, AI chat for that id only). */
export async function buildStudentSlicePayload(studentId: string): Promise<BackupPayload> {
  const [studentRow, diaryEntries, diaryMedia, aiMessages] = await Promise.all([
    db.students.get(studentId),
    db.diaryEntries.where('studentId').equals(studentId).toArray(),
    db.diaryMedia.toArray(),
    db.aiMessages.where('studentId').equals(studentId).toArray(),
  ])

  if (!studentRow) throw new Error('Student not found')

  const entryIds = new Set(diaryEntries.map((e) => e.id))
  const mediaForStudent = diaryMedia.filter((m) => entryIds.has(m.entryId))

  const { profilePhoto, ...rest } = studentRow
  let exportedStudent: ExportedStudent = { ...rest }
  if (profilePhoto) {
    const dataBase64 = await blobToBase64(profilePhoto)
    exportedStudent = {
      ...exportedStudent,
      profilePhoto: { mimeType: profilePhoto.type || 'image/jpeg', dataBase64 },
    }
  }

  const serialized: SerializedMedia[] = []
  for (const row of mediaForStudent) {
    const dataBase64 = await blobToBase64(row.blob)
    serialized.push({
      id: row.id,
      entryId: row.entryId,
      kind: row.kind,
      mimeType: row.mimeType,
      createdAt: row.createdAt,
      dataBase64,
      ...(row.caption?.trim() ? { caption: row.caption.trim() } : {}),
    })
  }

  diaryEntries.sort((a, b) => a.createdAt - b.createdAt)

  return {
    version: 3,
    backupKind: 'student',
    exportedAt: Date.now(),
    students: [exportedStudent],
    diaryEntries,
    diaryMedia: serialized,
    aiMessages,
  }
}

async function writeJsonBackupFile(payload: BackupPayload, suggestedName: string): Promise<void> {
  const text = JSON.stringify(payload)
  if ('showSaveFilePicker' in window && typeof window.showSaveFilePicker === 'function') {
    const handle = await window.showSaveFilePicker({
      suggestedName,
      types: [{ description: 'JSON backup', accept: { 'application/json': ['.json'] } }],
    })
    const writable = await handle.createWritable()
    await writable.write(text)
    await writable.close()
    return
  }

  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = suggestedName
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportBackupToFile(options?: BuildBackupOptions): Promise<void> {
  const payload = await buildBackupPayload(options)
  const date = new Date().toISOString().slice(0, 10)
  const suffix = options?.includeMedia === false ? 'text-only' : 'full'
  await writeJsonBackupFile(payload, `student-story-backup-${suffix}-${date}.json`)
}

export async function exportStudentSliceToFile(studentId: string, studentSlug: string): Promise<void> {
  const payload = await buildStudentSlicePayload(studentId)
  const safe = studentSlug.replace(/[^\w-]+/g, '-').slice(0, 48) || 'student'
  const date = new Date().toISOString().slice(0, 10)
  await writeJsonBackupFile(payload, `student-story-${safe}-${date}.json`)
}

async function wipeStudentCascade(studentId: string): Promise<void> {
  const entries = await db.diaryEntries.where('studentId').equals(studentId).toArray()
  for (const e of entries) {
    await db.diaryMedia.where('entryId').equals(e.id).delete()
  }
  await db.diaryEntries.where('studentId').equals(studentId).delete()
  await db.aiMessages.where('studentId').equals(studentId).delete()
  await db.students.delete(studentId)
}

function mediaRowsFromParsed(parsed: ParsedBackup): DiaryMedia[] {
  return (parsed.diaryMedia ?? []).map((m) => ({
    id: m.id,
    entryId: m.entryId,
    kind: m.kind,
    mimeType: m.mimeType,
    createdAt: m.createdAt,
    blob: base64ToBlob(m.dataBase64, m.mimeType),
    ...(typeof m.caption === 'string' && m.caption.trim() ? { caption: m.caption.trim() } : {}),
  }))
}

/** Replace all app data with backup contents. */
export async function importBackupPayload(parsed: ParsedBackup): Promise<void> {
  const studentsNorm = await Promise.all(parsed.students.map((s) => deserializeStudentFromBackup(s)))
  const mediaRows = mediaRowsFromParsed(parsed)
  const aiRows: AiMessage[] =
    parsed.version === 3 && Array.isArray(parsed.aiMessages) ? parsed.aiMessages : []

  await db.transaction('rw', db.students, db.diaryEntries, db.diaryMedia, db.aiMessages, async () => {
    await db.diaryMedia.clear()
    await db.diaryEntries.clear()
    await db.students.clear()
    await db.aiMessages.clear()

    await db.students.bulkPut(studentsNorm)
    await db.diaryEntries.bulkPut(parsed.diaryEntries ?? [])
    if (mediaRows.length) await db.diaryMedia.bulkPut(mediaRows)
    if (aiRows.length) await db.aiMessages.bulkPut(aiRows)
  })
}

/** Merge student slice: replaces listed students (and their stories) then inserts file data. */
export async function importStudentSlicePayload(parsed: ParsedBackup): Promise<void> {
  if (parsed.version !== 3) throw new Error('Student import requires backup version 3')
  if (parsed.backupKind !== 'student') throw new Error('Not a single-student backup file')

  const studentsNorm = await Promise.all(parsed.students.map((s) => deserializeStudentFromBackup(s)))
  if (!studentsNorm.length) throw new Error('Backup contains no student')

  const mediaRows = mediaRowsFromParsed(parsed)
  const aiRows = Array.isArray(parsed.aiMessages) ? parsed.aiMessages : []

  await db.transaction('rw', db.students, db.diaryEntries, db.diaryMedia, db.aiMessages, async () => {
    for (const s of studentsNorm) {
      await wipeStudentCascade(s.id)
    }
    await db.students.bulkPut(studentsNorm)
    await db.diaryEntries.bulkPut(parsed.diaryEntries ?? [])
    if (mediaRows.length) await db.diaryMedia.bulkPut(mediaRows)
    if (aiRows.length) await db.aiMessages.bulkPut(aiRows)
  })
}

export async function importBackupFromFile(file: File): Promise<void> {
  const text = await file.text()
  const parsed = parseBackupJson(text)
  await importBackupPayload(parsed)
}

export async function importStudentSliceFromFile(file: File): Promise<void> {
  const text = await file.text()
  const parsed = parseBackupJson(text)
  await importStudentSlicePayload(parsed)
}
