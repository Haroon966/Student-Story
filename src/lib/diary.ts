import { db, type DiaryEntry, type DiaryMedia, type MediaKind } from '@/db/database'
import { mergeTranscriptIntoBody } from '@/lib/speech/mergeTranscriptIntoBody'
import { newId } from '@/lib/id'

export type NewMediaInput = {
  kind: MediaKind
  mimeType: string
  blob: Blob
  caption?: string
}

export async function createDiaryEntry(
  studentId: string,
  body: string,
  media: NewMediaInput[],
): Promise<DiaryEntry> {
  const now = Date.now()
  const trimmedBody = body.trim()
  const entry: DiaryEntry = {
    id: newId(),
    studentId,
    body: trimmedBody,
    createdAt: now,
    updatedAt: now,
  }

  const rows: DiaryMedia[] = media.map((m) => ({
    id: newId(),
    entryId: entry.id,
    kind: m.kind,
    mimeType: m.mimeType,
    blob: m.blob,
    ...(m.caption?.trim() ? { caption: m.caption.trim() } : {}),
    createdAt: now,
  }))

  await db.transaction('rw', db.diaryEntries, db.diaryMedia, async () => {
    await db.diaryEntries.put(entry)
    if (rows.length) await db.diaryMedia.bulkPut(rows)
  })

  return entry
}

export async function deleteDiaryEntry(entryId: string): Promise<void> {
  await db.transaction('rw', db.diaryEntries, db.diaryMedia, async () => {
    await db.diaryMedia.where('entryId').equals(entryId).delete()
    await db.diaryEntries.delete(entryId)
  })
}

export async function listEntriesForStudent(studentId: string): Promise<DiaryEntry[]> {
  const rows = await db.diaryEntries.where('studentId').equals(studentId).toArray()
  rows.sort((a, b) => b.createdAt - a.createdAt)
  return rows
}

export async function listMediaForEntry(entryId: string): Promise<DiaryMedia[]> {
  return db.diaryMedia.where('entryId').equals(entryId).sortBy('createdAt')
}

/** Merge transcribed text into a saved audio attachment’s caption and bump the parent entry timestamp. */
export async function appendTranscriptToDiaryMediaCaption(mediaId: string, transcript: string): Promise<void> {
  const row = await db.diaryMedia.get(mediaId)
  if (!row) throw new Error('Attachment not found.')
  const merged = mergeTranscriptIntoBody(row.caption ?? '', transcript).trim()
  if (!merged) return

  const now = Date.now()
  await db.transaction('rw', db.diaryMedia, db.diaryEntries, async () => {
    await db.diaryMedia.put({ ...row, caption: merged })
    const entry = await db.diaryEntries.get(row.entryId)
    if (entry) await db.diaryEntries.update(row.entryId, { updatedAt: now })
  })
}

/** Case-insensitive match on entry body or any attachment caption (empty needle matches all). */
export function entryMatchesDiarySearch(entry: DiaryEntry, media: DiaryMedia[], needle: string): boolean {
  const n = needle.trim().toLowerCase()
  if (!n) return true
  if (entry.body.toLowerCase().includes(n)) return true
  return media.some((m) => (m.caption ?? '').toLowerCase().includes(n))
}

/** Latest saved line + time for student list previews (newest first). */
export async function getLastDiaryPreview(
  studentId: string,
): Promise<{ snippet: string; at: number } | null> {
  const rows = await db.diaryEntries.where('studentId').equals(studentId).sortBy('createdAt')
  const last = rows.at(-1)
  if (!last) return null
  const raw = last.body.replace(/\s+/g, ' ').trim()
  if (raw.length) {
    const snippet = raw.length > 72 ? `${raw.slice(0, 72).trimEnd()}…` : raw
    return { snippet, at: last.createdAt }
  }
  const media = await listMediaForEntry(last.id)
  const cap = media.map((m) => m.caption?.trim()).filter(Boolean)[0]
  if (cap) {
    const snippet = cap.length > 72 ? `${cap.slice(0, 72).trimEnd()}…` : cap
    return { snippet, at: last.createdAt }
  }
  const onlyAudio = media.length > 0 && media.every((m) => m.kind === 'audio')
  if (onlyAudio) {
    return { snippet: 'Voice note', at: last.createdAt }
  }
  const snippet = '(attachment)'
  return { snippet, at: last.createdAt }
}
