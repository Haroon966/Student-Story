import { describe, expect, it } from 'vitest'
import type { DiaryEntry, DiaryMedia } from '@/db/database'
import { entryMatchesDiarySearch } from '@/lib/diary'

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
