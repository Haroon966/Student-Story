import type { DiaryEntry, DiaryMedia } from '@/db/database'
import { listEntriesForStudent, listMediaForEntry } from '@/lib/diary'
import { uuidToShort } from '@/lib/aiShortId'

export async function resolveEntryByShortId(
  studentId: string,
  shortId: string,
): Promise<DiaryEntry | null> {
  const norm = shortId.toLowerCase()
  const entries = await listEntriesForStudent(studentId)
  for (const e of entries) {
    if (uuidToShort(e.id) === norm) return e
  }
  return null
}

export async function resolveMediaByShortId(
  studentId: string,
  shortId: string,
): Promise<DiaryMedia | null> {
  const norm = shortId.toLowerCase()
  const entries = await listEntriesForStudent(studentId)
  for (const e of entries) {
    const media = await listMediaForEntry(e.id)
    for (const m of media) {
      if (uuidToShort(m.id) === norm) return m
    }
  }
  return null
}
