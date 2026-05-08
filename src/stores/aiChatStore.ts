import { db, type AiMessage } from '@/db/database'
import { buildStudentBrief } from '@/lib/aiContext'
import { streamChatCompletion, type GroqChatMessage } from '@/lib/groq'
import { newId } from '@/lib/id'
import { create } from 'zustand'

type AiChatState = {
  activeStudentId: string | null
  messages: AiMessage[]
  streaming: boolean
  error: string | null
  abortController: AbortController | null

  loadForStudent: (studentId: string) => Promise<void>
  send: (params: {
    studentId: string
    text: string
    apiKey: string
    model: string
    extraSystem: string
  }) => Promise<void>
  stop: () => void
  clearConversation: (studentId: string) => Promise<void>
}

export const useAiChatStore = create<AiChatState>((set, get) => ({
  activeStudentId: null,
  messages: [],
  streaming: false,
  error: null,
  abortController: null,

  loadForStudent: async (studentId) => {
    const rows = await db.aiMessages.where('studentId').equals(studentId).sortBy('createdAt')
    set({ activeStudentId: studentId, messages: rows, error: null })
  },

  send: async ({ studentId, text, apiKey, model, extraSystem }) => {
    const trimmed = text.trim()
    if (!trimmed || !apiKey) return

    const userMsg: AiMessage = {
      id: newId(),
      studentId,
      role: 'user',
      content: trimmed,
      createdAt: Date.now(),
    }
    await db.aiMessages.put(userMsg)

    const assistantId = newId()
    const assistantMsg: AiMessage = {
      id: assistantId,
      studentId,
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
    }

    const controller = new AbortController()
    set((s) => ({
      messages: [...s.messages, userMsg, assistantMsg],
      streaming: true,
      error: null,
      abortController: controller,
    }))

    try {
      const brief = await buildStudentBrief(studentId, extraSystem)

      const prior = get().messages.filter((m) => m.id !== assistantId)
      const history: GroqChatMessage[] = prior.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const apiMessages: GroqChatMessage[] = [{ role: 'system', content: brief.systemContent }, ...history]

      let full = ''
      for await (const delta of streamChatCompletion({
        apiKey,
        model,
        messages: apiMessages,
        signal: controller.signal,
      })) {
        full += delta
        set((s) => ({
          messages: s.messages.map((m) => (m.id === assistantId ? { ...m, content: full } : m)),
        }))
      }

      const finalMsg: AiMessage = {
        id: assistantId,
        studentId,
        role: 'assistant',
        content: full,
        createdAt: assistantMsg.createdAt,
      }
      await db.aiMessages.put(finalMsg)
      set((s) => ({
        messages: s.messages.map((m) => (m.id === assistantId ? finalMsg : m)),
        streaming: false,
        abortController: null,
      }))
    } catch (e) {
      const isAbort = e instanceof DOMException && e.name === 'AbortError'
      const partial = get().messages.find((m) => m.id === assistantId)?.content ?? ''
      if (partial && studentId) {
        const finalMsg: AiMessage = {
          id: assistantId,
          studentId,
          role: 'assistant',
          content: partial,
          createdAt: assistantMsg.createdAt,
        }
        await db.aiMessages.put(finalMsg)
        set((s) => ({
          error: isAbort ? null : e instanceof Error ? e.message : 'Request failed',
          streaming: false,
          abortController: null,
          messages: s.messages.map((m) => (m.id === assistantId ? finalMsg : m)),
        }))
      } else {
        const message = e instanceof Error ? e.message : 'Request failed'
        set((s) => ({
          error: isAbort ? null : message,
          streaming: false,
          abortController: null,
          messages: s.messages.filter((m) => m.id !== assistantId),
        }))
      }
    }
  },

  stop: () => {
    const c = get().abortController
    c?.abort()
    set({ streaming: false, abortController: null })
  },

  clearConversation: async (studentId) => {
    await db.aiMessages.where('studentId').equals(studentId).delete()
    if (get().activeStudentId === studentId) {
      set({ messages: [], error: null })
    }
  },
}))
