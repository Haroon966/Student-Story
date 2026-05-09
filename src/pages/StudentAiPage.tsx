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
import { AlertTriangle, ChevronLeft, KeyRound, MoreVertical, SendHorizontal, Sparkles, Square } from 'lucide-react'
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
  const students        = useStudentsStore((s) => s.students)
  const loadingStudents = useStudentsStore((s) => s.loading)
  const hydrateStudents = useStudentsStore((s) => s.hydrate)

  const settings        = useSettingsStore((s) => s.settings)
  const loadingSettings = useSettingsStore((s) => s.loading)
  const hydrateSettings = useSettingsStore((s) => s.hydrate)

  const messages         = useAiChatStore((s) => s.messages)
  const streaming        = useAiChatStore((s) => s.streaming)
  const error            = useAiChatStore((s) => s.error)
  const loadForStudent   = useAiChatStore((s) => s.loadForStudent)
  const send             = useAiChatStore((s) => s.send)
  const stop             = useAiChatStore((s) => s.stop)
  const clearConversation = useAiChatStore((s) => s.clearConversation)

  const [input,      setInput]      = useState('')
  const [clearOpen,  setClearOpen]  = useState(false)
  const [clearBusy,  setClearBusy]  = useState(false)
  const scrollEndRef = useRef<HTMLDivElement>(null)

  const student  = id ? students.find((s) => s.id === id) : undefined
  const hasKey   = Boolean(settings?.groqApiKey?.trim())
  const model    = settings?.groqModel?.trim() || 'llama-3.3-70b-versatile'
  const extra    = settings?.systemPromptExtra ?? ''

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
    await send({ studentId: id, text: t, apiKey: settings!.groqApiKey.trim(), model, extraSystem: extra })
  }

  async function confirmClear() {
    if (!id || clearBusy) return
    setClearBusy(true)
    try {
      await clearConversation(id)
      setClearOpen(false)
    } finally { setClearBusy(false) }
  }

  if (!id) return null

  if (loadingStudents) {
    return (
      <div className="flex flex-1 items-center justify-center py-16" style={{ fontSize: 'var(--text-sm)', color: 'var(--theme-charcoal-muted)' }}>
        Loading…
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--theme-charcoal-muted)' }}>Student not found.</p>
        <Link to="/" style={{ color: 'var(--theme-primary)', fontSize: 'var(--text-sm)' }} className="underline">
          Back to stories
        </Link>
      </div>
    )
  }

  const storyHref = `/student/${id}`

  return (
    <div className="flex min-h-0 flex-1 flex-col" style={{ background: 'var(--theme-chat-bg)' }}>

      {/* Header */}
      <header
        className="flex shrink-0 items-center gap-2 px-2 py-2"
        style={{ background: 'var(--theme-app-header-bg)', boxShadow: 'var(--shadow-md)', color: 'var(--theme-app-header-fg)' }}
      >
        <Link
          to={storyHref}
          className="rounded-[var(--radius-full)] p-2 hover:bg-[rgb(255_255_255_/_0.18)]"
          aria-label="Back to diary"
        >
          <ChevronLeft className="size-6" aria-hidden />
        </Link>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <StudentAvatar
            student={student}
            tone="inverse"
            className="size-10 shrink-0 text-[13px] ring-2 ring-[rgb(255_255_255_/_0.35)]"
          />
          <div className="min-w-0">
            <div
              className="truncate font-semibold"
              style={{ fontSize: 'var(--text-md)', letterSpacing: 'var(--tracking-tight)', lineHeight: 'var(--leading-tight)' }}
            >
              {student.name}
            </div>
            <div className="truncate opacity-80" style={{ fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-snug)', fontWeight: 400 }}>
              AI coach · read-only
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded-[var(--radius-full)] p-2 hover:bg-[rgb(255_255_255_/_0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-ring)]"
              style={{ color: 'var(--theme-app-header-fg)' }}
              aria-label="Menu"
            >
              <MoreVertical className="size-5" aria-hidden />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem inset onSelect={() => setClearOpen(true)}>
              Clear conversation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Chat area */}
      <div
        className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5"
        style={{
          backgroundColor: 'var(--theme-chat-bg)',
          backgroundImage: 'var(--theme-chat-pattern)',
          backgroundSize: '14px 14px',
        }}
      >
        {/* No API key banner */}
        {!hasKey && !loadingSettings ? (
          <div
            className="mx-auto mb-4 max-w-md overflow-hidden rounded-[var(--radius-lg)] border"
            style={{
              borderColor: 'var(--theme-border)',
              borderLeft: '4px solid var(--theme-primary)',
              background: 'var(--theme-surface)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <span
                  className="flex size-8 items-center justify-center rounded-[var(--radius-sm)]"
                  style={{ background: 'var(--theme-primary-soft)', color: 'var(--theme-primary)' }}
                >
                  <KeyRound className="size-4" aria-hidden />
                </span>
                <p className="font-semibold" style={{ fontSize: 'var(--text-base)', color: 'var(--theme-charcoal)' }}>
                  Add a Groq API key
                </p>
              </div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--theme-charcoal-muted)', lineHeight: 'var(--leading-body)' }}>
                The AI coach needs a key from your Groq account. It's stored only on this device and never included in backups.
              </p>
              <Button asChild className="mt-4 w-full">
                <Link to="/settings">Open settings</Link>
              </Button>
            </div>
          </div>
        ) : null}

        {/* Error */}
        {error ? (
          <div
            className="mx-auto mb-4 max-w-lg rounded-[var(--radius-md)] border px-4 py-3"
            style={{ borderColor: 'var(--theme-danger)', background: 'var(--theme-danger-bg)', fontSize: 'var(--text-sm)', color: 'var(--theme-danger)' }}
          >
            {error}
          </div>
        ) : null}

        {/* Suggestion chips */}
        {hasKey && messages.length === 0 && !streaming ? (
          <div className="mx-auto mt-4 max-w-lg space-y-3">
            <p className="text-center" style={{ fontSize: 'var(--text-sm)', color: 'var(--theme-charcoal-muted)' }}>
              Ask anything about this student&apos;s story. I only read your saved data — I can&apos;t change it.
            </p>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="flex items-start gap-2.5 rounded-[var(--radius-md)] border px-4 py-3 text-left transition-all hover:shadow-sm"
                  style={{
                    borderColor: 'var(--theme-border)',
                    background: 'var(--theme-surface)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--theme-charcoal)',
                    lineHeight: 'var(--leading-snug)',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.borderColor = 'var(--theme-primary)'
                    el.style.background  = 'var(--theme-primary-soft)'
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.borderColor = 'var(--theme-border)'
                    el.style.background  = 'var(--theme-surface)'
                  }}
                  onClick={() => void handleSend(s)}
                >
                  <Sparkles className="mt-0.5 size-3.5 shrink-0" style={{ color: 'var(--theme-primary)' }} aria-hidden />
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

      {/* Composer */}
      <div
        className="shrink-0 border-t px-3 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 sm:px-4"
        style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-composer-bg)' }}
      >
        <div className="mx-auto flex max-w-[720px] items-end gap-2.5">
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
            className="flex-1 resize-none border transition-shadow focus-visible:ring-2 focus-visible:ring-[var(--theme-ring)] disabled:opacity-60"
            style={{
              minHeight: '48px',
              maxHeight: '128px',
              borderRadius: 'var(--radius-lg)',
              borderColor: 'var(--theme-border)',
              background: 'var(--theme-surface-muted)',
              fontSize: 'var(--text-base)',
              color: 'var(--theme-charcoal)',
              padding: '12px 14px',
            }}
          />
          {streaming ? (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="mb-[1px] size-12 shrink-0 rounded-[var(--radius-full)]"
              onClick={stop}
              aria-label="Stop generating"
            >
              <Square className="size-4" aria-hidden />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon"
              className="mb-[1px] size-12 shrink-0 rounded-[var(--radius-full)]"
              disabled={!hasKey || !input.trim()}
              aria-label="Send"
              style={{ boxShadow: hasKey && input.trim() ? '0 4px 14px rgb(21 91 91 / 0.32)' : undefined }}
              onClick={() => void handleSend()}
            >
              <SendHorizontal className="size-5" aria-hidden />
            </Button>
          )}
        </div>
      </div>

      {/* Clear dialog */}
      <Dialog open={clearOpen} onOpenChange={(o) => !clearBusy && setClearOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ color: 'var(--theme-danger)' }}>
              <AlertTriangle className="size-5 shrink-0" aria-hidden />
              Clear AI conversation?
            </DialogTitle>
            <DialogDescription style={{ fontSize: 'var(--text-sm)', color: 'var(--theme-charcoal-muted)', lineHeight: 'var(--leading-body)' }}>
              This removes all messages in this AI thread for {student.name}. Your saved story entries are not affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={clearBusy} onClick={() => setClearOpen(false)}>Cancel</Button>
            <Button type="button" variant="destructive" disabled={clearBusy} onClick={() => void confirmClear()}>
              {clearBusy ? 'Clearing…' : 'Clear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
