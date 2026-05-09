import { describe, expect, it } from 'vitest'
import { extractGroqDeltaFromSseLine } from '@/lib/groq'

describe('extractGroqDeltaFromSseLine', () => {
  it('returns null for empty or heartbeat lines', () => {
    expect(extractGroqDeltaFromSseLine('')).toBeNull()
    expect(extractGroqDeltaFromSseLine('data: [DONE]')).toBeNull()
    expect(extractGroqDeltaFromSseLine(': ping')).toBeNull()
  })

  it('extracts delta content from SSE data JSON', () => {
    const line =
      'data: ' +
      JSON.stringify({
        choices: [{ delta: { content: 'hello' } }],
      })
    expect(extractGroqDeltaFromSseLine(line)).toBe('hello')
  })

  it('returns null for malformed JSON payload', () => {
    expect(extractGroqDeltaFromSseLine('data: {broken')).toBeNull()
  })
})
