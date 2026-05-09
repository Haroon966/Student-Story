const GROQ_BASE = 'https://api.groq.com/openai/v1'

/** Parses one SSE line from Groq/OpenAI chat streaming; returns text delta or null. */
export function extractGroqDeltaFromSseLine(line: string): string | null {
  const trimmed = line.trim()
  if (!trimmed || trimmed === 'data: [DONE]') return null
  if (!trimmed.startsWith('data:')) return null
  const json = trimmed.slice(5).trim()
  if (json === '[DONE]') return null
  try {
    const parsed = JSON.parse(json) as {
      choices?: Array<{ delta?: { content?: string } }>
    }
    const piece = parsed.choices?.[0]?.delta?.content
    return typeof piece === 'string' && piece.length ? piece : null
  } catch {
    return null
  }
}

export type GroqChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function testGroqConnection(apiKey: string): Promise<void> {
  const res = await fetch(`${GROQ_BASE}/models`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Groq API error: ${res.status}`)
  }
}

/**
 * Stream chat completions from Groq (OpenAI-compatible SSE).
 * Yields incremental text deltas from `choices[0].delta.content`.
 */
export async function* streamChatCompletion(options: {
  apiKey: string
  model: string
  messages: GroqChatMessage[]
  signal?: AbortSignal
}): AsyncGenerator<string, void, unknown> {
  const { apiKey, model, messages, signal } = options
  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      temperature: 0.6,
    }),
    signal,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Groq chat error: ${res.status}`)
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const piece = extractGroqDeltaFromSseLine(line)
      if (piece) yield piece
    }
  }
}
