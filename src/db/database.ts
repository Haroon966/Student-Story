import Dexie, { type Table } from 'dexie'

export interface Student {
  id: string
  name: string
  notes: string
  favorite: boolean
  blocked: boolean
  /** Optional profile picture stored locally (IndexedDB). */
  profilePhoto?: Blob
  createdAt: number
  updatedAt: number
}

export interface DiaryEntry {
  id: string
  studentId: string
  body: string
  createdAt: number
  updatedAt: number
}

export type MediaKind = 'image' | 'video' | 'audio'

export interface DiaryMedia {
  id: string
  entryId: string
  kind: MediaKind
  mimeType: string
  blob: Blob
  /** Optional caption shown under image/video (and stored with the attachment). */
  caption?: string
  createdAt: number
}

/** Single-row app settings (id always 'app'). API key never exported in backups. */
export interface AppSettings {
  id: 'app'
  groqApiKey: string
  groqModel: string
  systemPromptExtra: string
  updatedAt: number
}

export type AiMessageRole = 'user' | 'assistant'

export interface AiMessage {
  id: string
  studentId: string
  role: AiMessageRole
  content: string
  createdAt: number
}

/** Local IndexedDB layer for Student Story. */
export class StudentStoryDB extends Dexie {
  students!: Table<Student, string>
  diaryEntries!: Table<DiaryEntry, string>
  diaryMedia!: Table<DiaryMedia, string>
  appSettings!: Table<AppSettings, string>
  aiMessages!: Table<AiMessage, string>

  constructor() {
    // IndexedDB name unchanged so upgrades preserve local data.
    super('student-diary')

    this.version(1).stores({
      students: 'id, name, createdAt, updatedAt',
      diaryEntries: 'id, studentId, createdAt, updatedAt',
      diaryMedia: 'id, entryId, kind, createdAt',
    })

    this.version(2)
      .stores({
        students: 'id, name, createdAt, updatedAt, favorite, blocked',
        diaryEntries: 'id, studentId, createdAt, updatedAt',
        diaryMedia: 'id, entryId, kind, createdAt',
      })
      .upgrade(async (tx) => {
        await tx
          .table('students')
          .toCollection()
          .modify((row: Record<string, unknown>) => {
            if (row.favorite === undefined) row.favorite = false
            if (row.blocked === undefined) row.blocked = false
          })
      })

    this.version(3).stores({
      students: 'id, name, createdAt, updatedAt, favorite, blocked',
      diaryEntries: 'id, studentId, createdAt, updatedAt',
      diaryMedia: 'id, entryId, kind, createdAt',
      appSettings: 'id, updatedAt',
      aiMessages: 'id, studentId, createdAt, role',
    })
  }
}

export const db = new StudentStoryDB()
