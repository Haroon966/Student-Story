import { describe, expect, it } from 'vitest'
import { resolveComposerEntryBody } from '@/lib/diaryComposer'

describe('resolveComposerEntryBody', () => {
  it('uses trimmed main body when non-empty', () => {
    expect(resolveComposerEntryBody('  Hello  ', [])).toBe('Hello')
  })

  it('returns empty when audio has transcribed caption only', () => {
    expect(
      resolveComposerEntryBody('', [{ kind: 'audio', caption: 'Spoken note text' }]),
    ).toBe('')
  })

  it('returns empty for audio-only pending without caption', () => {
    expect(resolveComposerEntryBody('', [{ kind: 'audio', caption: '' }])).toBe('')
  })

  it('returns placeholder when image has no caption and body empty', () => {
    expect(resolveComposerEntryBody('', [{ kind: 'image', caption: '' }])).toBe('(attachment)')
  })

  it('returns empty when image has caption', () => {
    expect(resolveComposerEntryBody('', [{ kind: 'image', caption: 'Lab photo' }])).toBe('')
  })
})
