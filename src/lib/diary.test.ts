import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db/database'
import type { DiaryEntry, DiaryMedia } from '@/db/database'
import { appendTranscriptToDiaryMediaCaption, entryMatchesDiarySearch } from '@/lib/diary'

const entry = (body: string): DiaryEntry => ({
  id: 'e1',
  studentId: 's1',
  body,
  createdAt: 1,
  updatedAt: 1,
})

const imageWithCaption = (caption: string): DiaryMedia => ({
  id: 'm1',
  entryId: 'e1',
  kind: 'image',
  mimeType: 'image/png',
  blob: new Blob(),
  caption,
  createdAt: 1,
})

describe('appendTranscriptToDiaryMediaCaption', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('writes transcript as caption on audio row', async () => {
    await db.diaryEntries.put({
      id: 'e1',
      studentId: 's1',
      body: '',
      createdAt: 100,
      updatedAt: 100,
    })
    await db.diaryMedia.put({
      id: 'm1',
      entryId: 'e1',
      kind: 'audio',
      mimeType: 'audio/webm',
      blob: new Blob([new Uint8Array([1, 2, 3])]),
      createdAt: 100,
    })
    await appendTranscriptToDiaryMediaCaption('m1', 'Meeting recap.')
    const m = await db.diaryMedia.get('m1')
    expect(m?.caption).toBe('Meeting recap.')
    const e = await db.diaryEntries.get('e1')
    expect(e?.updatedAt).toBeGreaterThanOrEqual(100)
  })

  it('appends second transcript with newline', async () => {
    await db.diaryEntries.put({
      id: 'e1',
      studentId: 's1',
      body: '',
      createdAt: 1,
      updatedAt: 1,
    })
    await db.diaryMedia.put({
      id: 'm1',
      entryId: 'e1',
      kind: 'audio',
      mimeType: 'audio/webm',
      blob: new Blob(),
      caption: 'First line',
      createdAt: 1,
    })
    await appendTranscriptToDiaryMediaCaption('m1', 'Second line')
    const m = await db.diaryMedia.get('m1')
    expect(m?.caption).toBe('First line\nSecond line')
  })
})

describe('entryMatchesDiarySearch', () => {
  it('matches empty needle for everything', () => {
    expect(entryMatchesDiarySearch(entry('hi'), [], '')).toBe(true)
    expect(entryMatchesDiarySearch(entry(''), [], '  ')).toBe(true)
  })

  it('matches body case-insensitively', () => {
    expect(entryMatchesDiarySearch(entry('Meeting with Guardian'), [], 'guardian')).toBe(true)
    expect(entryMatchesDiarySearch(entry('abc'), [], 'xyz')).toBe(false)
  })

  it('matches media captions', () => {
    expect(entryMatchesDiarySearch(entry(''), [imageWithCaption('Science fair poster')], 'science')).toBe(true)
    expect(entryMatchesDiarySearch(entry(''), [imageWithCaption('Other')], 'science')).toBe(false)
  })
})
