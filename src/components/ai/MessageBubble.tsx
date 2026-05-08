import { AssistantMessageBody } from '@/components/ai/AssistantMessageBody'
import type { AiMessage } from '@/db/database'
import { Sparkles } from 'lucide-react'

type Props = {
  message: AiMessage
  studentId: string
}

export function MessageBubble({ message, studentId }: Props) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[min(92%,560px)] rounded-lg rounded-tr-none border border-[var(--theme-border)] bg-[var(--theme-bubble-out)] px-3 py-2 text-[14.2px] leading-snug text-[var(--theme-charcoal)] shadow-sm">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start gap-2">
      <div
        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--theme-border)] bg-[var(--theme-primary-soft)] text-[var(--theme-primary)]"
        aria-hidden
      >
        <Sparkles className="size-4" />
      </div>
      <div className="max-w-[min(92%,560px)] rounded-lg rounded-tl-none border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 py-2 shadow-sm">
        {message.content ? (
          <AssistantMessageBody studentId={studentId} content={message.content} />
        ) : (
          <span className="inline-flex items-center gap-2 text-sm text-[var(--theme-charcoal-muted)]">
            <span className="size-2 animate-pulse rounded-full bg-[var(--theme-primary)]" />
            Thinking…
          </span>
        )}
      </div>
    </div>
  )
}
