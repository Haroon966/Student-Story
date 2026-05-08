import { db, type AiMessage, type DiaryEntry, type DiaryMedia, type Student } from '@/db/database'

type SerializedMedia = Omit<DiaryMedia, 'blob'> & { dataBase64: string }

/** JSON-safe student row for backup files (v2+). */
export type ExportedStudent = Omit<Student, 'profilePhoto'> & {
  profilePhoto?: { mimeType: string; dataBase64: string }
}

export type BackupPayload = {
  version: 3
  exportedAt: number
  students: ExportedStudent[]
  diaryEntries: DiaryEntry[]
  diaryMedia: SerializedMedia[]
  aiMessages: AiMessage[]
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

function base64ToBlob(base64: string, mimeType: string): Blob {
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

export async function buildBackupPayload(): Promise<BackupPayload> {
  const [students, diaryEntries, diaryMedia, aiMessages] = await Promise.all([
    db.students.toArray(),
    db.diaryEntries.toArray(),
    db.diaryMedia.toArray(),
    db.aiMessages.toArray(),
  ])

  const studentsExported: ExportedStudent[] = await Promise.all(
    students.map(async (s) => {
      const { profilePhoto, ...rest } = s
      if (!profilePhoto) return { ...rest }
      const dataBase64 = await blobToBase64(profilePhoto)
      return {
        ...rest,
        profilePhoto: { mimeType: profilePhoto.type || 'image/jpeg', dataBase64 },
      }
    }),
  )

  const serialized: SerializedMedia[] = []
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

  return {
    version: 3,
    exportedAt: Date.now(),
    students: studentsExported,
    diaryEntries,
    diaryMedia: serialized,
    aiMessages,
  }
}

export async function exportBackupToFile(): Promise<void> {
  const payload = await buildBackupPayload()
  const text = JSON.stringify(payload)
  const suggestedName = `student-story-backup-${new Date().toISOString().slice(0, 10)}.json`

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

type ParsedBackup = LegacyBackupV1 | LegacyBackupV2 | BackupPayload

export async function importBackupFromFile(file: File): Promise<void> {
  const text = await file.text()
  const parsed = JSON.parse(text) as ParsedBackup
  if (
    (parsed.version !== 1 && parsed.version !== 2 && parsed.version !== 3) ||
    !Array.isArray(parsed.students) ||
    !Array.isArray(parsed.diaryEntries)
  ) {
    throw new Error('Invalid backup file')
  }

  const studentsNorm = await Promise.all(parsed.students.map((s) => deserializeStudentFromBackup(s)))

  const mediaRows: DiaryMedia[] = (parsed.diaryMedia ?? []).map((m) => ({
    id: m.id,
    entryId: m.entryId,
    kind: m.kind,
    mimeType: m.mimeType,
    createdAt: m.createdAt,
    blob: base64ToBlob(m.dataBase64, m.mimeType),
    ...(typeof m.caption === 'string' && m.caption.trim() ? { caption: m.caption.trim() } : {}),
  }))

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
