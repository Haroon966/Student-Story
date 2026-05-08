import { Reference } from '@/components/ai/Reference'
import { parseAssistantContent } from '@/lib/aiTokens'
import { useMemo } from 'react'

export function AssistantMessageBody({ studentId, content }: { studentId: string; content: string }) {
  const segments = useMemo(() => parseAssistantContent(content), [content])

  return (
    <div className="text-[14.2px] leading-relaxed text-[var(--theme-charcoal)]">
      {segments.map((seg, i) => {
        if (seg.type === 'text') {
          return (
            <span key={i} className="whitespace-pre-wrap">
              {seg.value}
            </span>
          )
        }
        return <Reference key={i} studentId={studentId} segment={seg} />
      })}
    </div>
  )
}
