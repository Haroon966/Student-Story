import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db/database'
import {
  base64ToBlob,
  getBackupImportSummary,
  importBackupPayload,
  parseBackupJson,
} from '@/lib/backup'

describe('parseBackupJson', () => {
  it('accepts v3 payload', () => {
    const text = JSON.stringify({
      version: 3,
      exportedAt: 1,
      students: [],
      diaryEntries: [],
      diaryMedia: [],
      aiMessages: [],
    })
    expect(parseBackupJson(text).version).toBe(3)
  })

  it('throws on invalid JSON', () => {
    expect(() => parseBackupJson('not json')).toThrow('Invalid backup file')
  })

  it('throws on wrong version', () => {
    expect(() =>
      parseBackupJson(
        JSON.stringify({ version: 9, students: [], diaryEntries: [] }),
      ),
    ).toThrow('Invalid backup file')
  })
})

describe('getBackupImportSummary', () => {
  it('detects student slice backups', () => {
    const parsed = parseBackupJson(
      JSON.stringify({
        version: 3,
        backupKind: 'student',
        exportedAt: 1,
        students: [{ id: 'a', name: 'A', notes: '', favorite: false, blocked: false, createdAt: 1, updatedAt: 1 }],
        diaryEntries: [{ id: 'e', studentId: 'a', body: 'hi', createdAt: 1, updatedAt: 1 }],
        diaryMedia: [],
        aiMessages: [{ id: 'm', studentId: 'a', role: 'user', content: '?', createdAt: 1 }],
      }),
    )
    const s = getBackupImportSummary(parsed)
    expect(s.backupKind).toBe('student')
    expect(s.studentCount).toBe(1)
    expect(s.entryCount).toBe(1)
    expect(s.aiCount).toBe(1)
  })

  it('treats v3 without backupKind as full', () => {
    const parsed = parseBackupJson(
      JSON.stringify({
        version: 3,
        exportedAt: 1,
        students: [],
        diaryEntries: [],
        diaryMedia: [],
      }),
    )
    expect(getBackupImportSummary(parsed).backupKind).toBe('full')
  })
})

describe('base64ToBlob', () => {
  it('round-trips binary payload', () => {
    const bytes = new Uint8Array([0, 255, 10])
    const b64 = btoa(String.fromCodePoint(...bytes))
    const blob = base64ToBlob(b64, 'application/octet-stream')
    expect(blob.size).toBe(3)
  })
})

describe('importBackupPayload', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('replaces IndexedDB with backup rows', async () => {
    await db.students.put({
      id: 'old',
      name: 'Old',
      notes: '',
      favorite: false,
      blocked: false,
      createdAt: 1,
      updatedAt: 1,
    })

    const parsed = parseBackupJson(
      JSON.stringify({
        version: 3,
        exportedAt: 2,
        students: [
          {
            id: 'new',
            name: 'New',
            notes: '',
            favorite: false,
            blocked: false,
            createdAt: 2,
            updatedAt: 2,
          },
        ],
        diaryEntries: [],
        diaryMedia: [],
        aiMessages: [],
      }),
    )

    await importBackupPayload(parsed)
    const rows = await db.students.toArray()
    expect(rows).toHaveLength(1)
    expect(rows[0]?.id).toBe('new')
  })
})
