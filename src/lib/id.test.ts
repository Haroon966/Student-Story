import { describe, expect, it } from 'vitest'
import { newId } from '@/lib/id'

describe('newId', () => {
  it('returns RFC4122-style UUID strings', () => {
    const id = newId()
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
  })

  it('returns unique values', () => {
    const a = new Set<string>()
    for (let i = 0; i < 50; i++) a.add(newId())
    expect(a.size).toBe(50)
  })
})
