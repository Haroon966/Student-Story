import { db } from '@/db/database'
import { listEntriesForStudent, listMediaForEntry } from '@/lib/diary'
import { uuidToShort } from '@/lib/aiShortId'

const MAX_ENTRIES = 60

export type BriefAttachment = {
  shortId: string
  id: string
  kind: string
  mimeType: string
}

export type BriefEntry = {
  shortId: string
  id: string
  at: string
  body: string
  attachments: BriefAttachment[]
}

export type StudentBriefPayload = {
  student: {
    id: string
    name: string
    notes: string
    favorite: boolean
    blocked: boolean
    hasProfilePhoto: boolean
  }
  entries: BriefEntry[]
}

export type AiBriefResult = {
  /** Combined system text: rules + JSON data */
  systemContent: string
}

const BASE_SYSTEM = `You are an AI coach for a teacher using Student Story: a private, fully offline app for notes and moments per student.
You ONLY have the JSON student snapshot provided below. You must NOT invent entries, dates, or attachments that are not in the data.
You cannot edit or delete anything — give read-only suggestions, summaries, and teaching ideas.

When you refer to a specific saved entry, insert exactly: [[entry:SHORTID]] where SHORTID is the entry's shortId from the JSON.
When you refer to a specific attachment (photo, video, or voice), insert exactly: [[media:SHORTID]] where SHORTID is the attachment's shortId from the JSON.
Use these tokens so the app can show the teacher the real item from their device. You may use multiple tokens in one reply.

Be concise, practical, and respectful of student privacy. If data is sparse, say so and suggest what the teacher might log next.`

export async function buildStudentBrief(
  studentId: string,
  extraSystemInstructions: string,
): Promise<AiBriefResult> {
  const student = await db.students.get(studentId)
  if (!student) {
    throw new Error('Student not found')
  }

  const allEntries = await listEntriesForStudent(studentId)
  const chronological = [...allEntries].reverse().slice(-MAX_ENTRIES)

  const briefEntries: BriefEntry[] = []

  for (const e of chronological) {
    const es = uuidToShort(e.id)

    const mediaRows = await listMediaForEntry(e.id)
    const attachments: BriefAttachment[] = []
    for (const m of mediaRows) {
      const ms = uuidToShort(m.id)
      attachments.push({
        shortId: ms,
        id: m.id,
        kind: m.kind,
        mimeType: m.mimeType,
      })
    }

    briefEntries.push({
      shortId: es,
      id: e.id,
      at: new Date(e.createdAt).toISOString(),
      body: e.body,
      attachments,
    })
  }

  const payload: StudentBriefPayload = {
    student: {
      id: student.id,
      name: student.name,
      notes: student.notes,
      favorite: student.favorite,
      blocked: student.blocked,
      hasProfilePhoto: Boolean(student.profilePhoto),
    },
    entries: briefEntries,
  }

  const extra = extraSystemInstructions.trim()
  const systemParts = [BASE_SYSTEM]
  if (extra) systemParts.push('Additional instructions from the teacher:\n' + extra)
  systemParts.push('\n--- STUDENT DATA (JSON) ---\n' + JSON.stringify(payload, null, 2))

  return {
    systemContent: systemParts.join('\n\n'),
  }
}
