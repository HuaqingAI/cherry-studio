import { describe, expect, it } from 'vitest'

import { buildLogPreview } from '../chatLogPreview'

describe('buildLogPreview', () => {
  it('normalizes whitespace and marks short text as not truncated', () => {
    expect(buildLogPreview('hello\n\nworld')).toEqual({
      preview: 'hello world',
      length: 11,
      truncated: false
    })
  })

  it('truncates long text before it can be logged', () => {
    const text = 'a'.repeat(260)

    const preview = buildLogPreview(text)

    expect(preview.length).toBe(260)
    expect(preview.truncated).toBe(true)
    expect(preview.preview).toHaveLength(243)
    expect(preview.preview).toBe(`${'a'.repeat(240)}...`)
    expect(preview.preview).not.toBe(text)
  })
})
