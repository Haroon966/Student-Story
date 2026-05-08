import { db, type Student } from '@/db/database'
import { newId } from '@/lib/id'
import { create } from 'zustand'

function sortStudents(rows: Student[]): Student[] {
  return [...rows].sort((a, b) => {
    if (a.favorite !== b.favorite) return a.favorite ? -1 : 1
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  })
}

type StudentsState = {
  students: Student[]
  loading: boolean
  hydrate: () => Promise<void>
  addStudent: (name: string, notes?: string) => Promise<Student>
  updateStudent: (
    id: string,
    patch: Partial<Pick<Student, 'name' | 'notes' | 'favorite' | 'blocked'>> & {
      profilePhoto?: Blob | null
    },
  ) => Promise<void>
  removeStudent: (id: string) => Promise<void>
}

export const useStudentsStore = create<StudentsState>((set, get) => ({
  students: [],
  loading: true,

  hydrate: async () => {
    const rows = await db.students.toArray()
    set({ students: sortStudents(rows), loading: false })
  },

  addStudent: async (name, notes = '') => {
    const now = Date.now()
    const student: Student = {
      id: newId(),
      name: name.trim(),
      notes: notes.trim(),
      favorite: false,
      blocked: false,
      createdAt: now,
      updatedAt: now,
    }
    await db.students.put(student)
    await get().hydrate()
    return student
  },

  updateStudent: async (id, patch) => {
    const row = await db.students.get(id)
    if (!row) return
    const next: Student = {
      ...row,
      name: patch.name !== undefined ? patch.name.trim() : row.name,
      notes: patch.notes !== undefined ? patch.notes.trim() : row.notes,
      favorite: patch.favorite !== undefined ? patch.favorite : row.favorite,
      blocked: patch.blocked !== undefined ? patch.blocked : row.blocked,
      updatedAt: Date.now(),
    }
    if ('profilePhoto' in patch) {
      if (patch.profilePhoto === null || patch.profilePhoto === undefined) {
        delete next.profilePhoto
      } else {
        next.profilePhoto = patch.profilePhoto
      }
    }
    await db.students.put(next)
    await get().hydrate()
  },

  removeStudent: async (id) => {
    await db.transaction('rw', db.students, db.diaryEntries, db.diaryMedia, db.aiMessages, async () => {
      const entries = await db.diaryEntries.where('studentId').equals(id).toArray()
      for (const e of entries) {
        await db.diaryMedia.where('entryId').equals(e.id).delete()
      }
      await db.diaryEntries.where('studentId').equals(id).delete()
      await db.aiMessages.where('studentId').equals(id).delete()
      await db.students.delete(id)
    })
    await get().hydrate()
  },
}))
