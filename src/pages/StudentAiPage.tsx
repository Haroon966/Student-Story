import { MessageBubble } from '@/components/ai/MessageBubble'
import { StudentAvatar } from '@/components/students/StudentAvatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { useAiChatStore } from '@/stores/aiChatStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useStudentsStore } from '@/stores/studentsStore'
import { AlertTriangle, ChevronLeft, MoreVertical, SendHorizontal, Square } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

const SUGGESTIONS = [
  'Summarise the last few weeks for this student.',
  "What patterns do you see in this student's story?",
  'Suggest concrete next steps I could try in class.',
  'What notable moments should I revisit?',
]

export function StudentAiPage() {
  const { id } = useParams<{ id: string }>()
  const students = useStudentsStore((s) => s.students)
  const loadingStudents = useStudentsStore((s) => s.loading)
  const hydrateStudents = useStudentsStore((s) => s.hydrate)

  const settings = useSettingsStore((s) => s.settings)
  const loadingSettings = useSettingsStore((s) => s.loading)
  const hydrateSettings = useSettingsStore((s) => s.hydrate)

  const messages = useAiChatStore((s) => s.messages)
  const streaming = useAiChatStore((s) => s.streaming)
  const error = useAiChatStore((s) => s.error)
  const loadForStudent = useAiChatStore((s) => s.loadForStudent)
  const send = useAiChatStore((s) => s.send)
  const stop = useAiChatStore((s) => s.stop)
  const clearConversation = useAiChatStore((s) => s.clearConversation)

  const [input, setInput] = useState('')
  const [clearOpen, setClearOpen] = useState(false)
  const [clearBusy, setClearBusy] = useState(false)
  const scrollEndRef = useRef<HTMLDivElement>(null)

  const student = id ? students.find((s) => s.id === id) : undefined
  const hasKey = Boolean(settings?.groqApiKey?.trim())
  const model = settings?.groqModel?.trim() || 'llama-3.3-70b-versatile'
  const extra = settings?.systemPromptExtra ?? ''

  useEffect(() => {
    void hydrateStudents()
    void hydrateSettings()
  }, [hydrateStudents, hydrateSettings])

  useEffect(() => {
    if (!id) return
    void loadForStudent(id)
  }, [id, loadForStudent])

  const lastMessageLen = messages.at(-1)?.content.length ?? 0
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, streaming, lastMessageLen])

  async function handleSend(text?: string) {
    const t = (text ?? input).trim()
    if (!t || !id || !hasKey || streaming) return
    setInput('')
    await send({
      studentId: id,
      text: t,
      apiKey: settings!.groqApiKey.trim(),
      model,
      extraSystem: extra,
    })
  }

  async function confirmClear() {
    if (!id || clearBusy) return
    setClearBusy(true)
    try {
      await clearConversation(id)
      setClearOpen(false)
    } finally {
      setClearBusy(false)
    }
  }

  if (!id) return null

  if (loadingStudents) {
    return (
      <div className="flex flex-1 items-center justify-center py-16 text-sm text-[var(--theme-charcoal-muted)]">
        Loading…
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-[var(--theme-charcoal-muted)]">Student not found.</p>
        <Link to="/" className="text-[var(--theme-primary)] underline">
          Back to stories
        </Link>
      </div>
    )
  }

  const storyHref = `/student/${id}`

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--theme-chat-bg)]">
      <header className="flex shrink-0 items-center gap-2 bg-[var(--theme-app-header-bg)] px-2 py-2 text-[var(--theme-app-header-fg)] shadow-[var(--shadow)]">
        <Link
          to={storyHref}
          className="rounded-full p-2 text-[var(--theme-app-header-fg)] hover:bg-[rgb(255_255_255_/_0.18)]"
          aria-label="Back to diary"
        >
          <ChevronLeft className="size-7" aria-hidden />
        </Link>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <StudentAvatar
            student={student}
            tone="inverse"
            className="size-10 shrink-0 text-[13px] ring-2 ring-[rgb(255_255_255_/_0.35)]"
          />
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[17px] font-semibold">{student.name}</div>
            <div className="truncate text-[13px] opacity-90">AI coach · read-only</div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded-full p-2 text-[var(--theme-app-header-fg)] hover:bg-[rgb(255_255_255_/_0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-ring)]"
              aria-label="Menu"
            >
              <MoreVertical className="size-6" aria-hidden />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem inset onSelect={() => setClearOpen(true)}>
              Clear conversation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div
        className="min-h-0 flex-1 overflow-y-auto px-2 py-3 sm:px-4"
        style={{
          backgroundColor: 'var(--theme-chat-bg)',
          backgroundImage: 'var(--theme-chat-pattern)',
          backgroundSize: '12px 12px',
        }}
      >
        {!hasKey && !loadingSettings ? (
          <div className="mx-auto mt-6 max-w-md rounded-xl border-2 border-[var(--theme-primary)] bg-[var(--theme-surface)] p-4 shadow-md">
            <p className="text-sm font-medium text-[var(--theme-charcoal)]">Add a Groq API key</p>
            <p className="mt-2 text-sm text-[var(--theme-charcoal-muted)]">
              The AI coach needs a key from your Groq account. It is stored only on this device and is not included in
              backups.
            </p>
            <Button asChild className="mt-4 w-full">
              <Link to="/settings">Open settings</Link>
            </Button>
          </div>
        ) : null}

        {error ? (
          <div className="mx-auto mb-4 max-w-lg rounded-lg border border-[var(--theme-danger)] bg-[var(--theme-danger-bg)] px-3 py-2 text-sm text-[var(--theme-danger)]">
            {error}
          </div>
        ) : null}

        {hasKey && messages.length === 0 && !streaming ? (
          <div className="mx-auto mt-6 max-w-lg space-y-3">
            <p className="text-center text-sm text-[var(--theme-charcoal-muted)]">
              Ask anything about this student&apos;s story. I only read your saved data — I can&apos;t change it.
            </p>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-2 text-left text-sm text-[var(--theme-charcoal)] transition-colors hover:border-[var(--theme-primary)] hover:bg-[var(--theme-primary-soft)]"
                  onClick={() => void handleSend(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mx-auto flex max-w-[720px] flex-col gap-3 pb-4">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} studentId={id} />
          ))}
          <div ref={scrollEndRef} className="h-1 shrink-0" aria-hidden />
        </div>
      </div>

      <div className="shrink-0 border-t border-[var(--theme-border)] bg-[var(--theme-composer-bg)] px-2 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 sm:px-3">
        <div className="mx-auto flex max-w-[720px] items-end gap-2">
          <Textarea
            placeholder={hasKey ? 'Ask the AI coach…' : 'Add an API key in Settings first'}
            rows={1}
            disabled={!hasKey || streaming}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void handleSend()
              }
            }}
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-muted)] px-3 py-2 text-[15px] text-[var(--theme-charcoal)] placeholder:text-[var(--theme-charcoal-muted)] focus-visible:ring-2 focus-visible:ring-[var(--theme-ring)] disabled:opacity-60"
          />
          {streaming ? (
            <Button type="button" variant="secondary" size="icon" className="mb-[2px] size-11 shrink-0 rounded-full" onClick={stop}>
              <Square className="size-4" aria-hidden />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon"
              className="mb-[2px] size-11 shrink-0 rounded-full"
              disabled={!hasKey || !input.trim()}
              aria-label="Send"
              onClick={() => void handleSend()}
            >
              <SendHorizontal className="size-5" aria-hidden />
            </Button>
          )}
        </div>
      </div>

      <Dialog open={clearOpen} onOpenChange={(o) => !clearBusy && setClearOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[var(--theme-danger)]">
              <AlertTriangle className="size-5 shrink-0" aria-hidden />
              Clear AI conversation?
            </DialogTitle>
            <DialogDescription>
              This removes all messages in this AI thread for {student.name}. Your saved story entries are not affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={clearBusy} onClick={() => setClearOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={clearBusy} onClick={() => void confirmClear()}>
              {clearBusy ? 'Clearing…' : 'Clear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
