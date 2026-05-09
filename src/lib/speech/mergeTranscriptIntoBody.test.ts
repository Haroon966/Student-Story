import { describe, expect, it } from 'vitest'
import { mergeTranscriptIntoBody } from '@/lib/speech/mergeTranscriptIntoBody'

describe('mergeTranscriptIntoBody', () => {
  it('appends transcript on a new line when body already has text', () => {
    expect(mergeTranscriptIntoBody('Hello', 'World')).toBe('Hello\nWorld')
  })

  it('uses transcript alone when body is empty', () => {
    expect(mergeTranscriptIntoBody('', '  Hi there  ')).toBe('Hi there')
  })

  it('ignores empty transcript', () => {
    expect(mergeTranscriptIntoBody('Hello', '   ')).toBe('Hello')
  })

  it('trims trailing space on previous body before newline', () => {
    expect(mergeTranscriptIntoBody('Hello  \n', 'Next')).toBe('Hello\nNext')
  })
})
