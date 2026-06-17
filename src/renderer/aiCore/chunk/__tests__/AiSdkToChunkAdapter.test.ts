import { type Chunk, ChunkType } from '@renderer/types/chunk'
import type { TextStreamPart, ToolSet } from 'ai'
import { describe, expect, it, vi } from 'vitest'

import AiSdkToChunkAdapter from '../AiSdkToChunkAdapter'

vi.mock('@renderer/services/LoggerService', () => ({
  loggerService: {
    withContext: () => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      silly: vi.fn()
    })
  }
}))

const streamFromParts = (parts: TextStreamPart<ToolSet>[]) =>
  new ReadableStream<TextStreamPart<ToolSet>>({
    start(controller) {
      for (const part of parts) {
        controller.enqueue(part)
      }
      controller.close()
    }
  })

describe('AiSdkToChunkAdapter', () => {
  it('emits completion chunks when the stream closes without a finish part', async () => {
    const chunks: Chunk[] = []
    const adapter = new AiSdkToChunkAdapter((chunk) => chunks.push(chunk), [], true)

    const text = await adapter.processStream({
      fullStream: streamFromParts([
        { type: 'text-start', id: 'text-1' },
        { type: 'text-delta', id: 'text-1', text: 'hello' },
        { type: 'text-end', id: 'text-1' }
      ] as TextStreamPart<ToolSet>[]),
      text: Promise.resolve('hello')
    })

    expect(text).toBe('hello')
    expect(chunks.map((chunk) => chunk.type)).toEqual([
      ChunkType.TEXT_START,
      ChunkType.TEXT_DELTA,
      ChunkType.TEXT_COMPLETE,
      ChunkType.BLOCK_COMPLETE,
      ChunkType.LLM_RESPONSE_COMPLETE
    ])

    const blockComplete = chunks.find((chunk) => chunk.type === ChunkType.BLOCK_COMPLETE)
    expect(blockComplete?.response?.text).toBe('hello')
  })

  it('does not turn an abort stream into a successful completion', async () => {
    const chunks: Chunk[] = []
    const adapter = new AiSdkToChunkAdapter((chunk) => chunks.push(chunk), [], true)

    await adapter.processStream({
      fullStream: streamFromParts([
        { type: 'text-start', id: 'text-1' },
        { type: 'text-delta', id: 'text-1', text: 'partial' },
        { type: 'abort' }
      ] as TextStreamPart<ToolSet>[]),
      text: Promise.resolve('partial')
    })

    expect(chunks.some((chunk) => chunk.type === ChunkType.ERROR)).toBe(true)
    expect(chunks.some((chunk) => chunk.type === ChunkType.BLOCK_COMPLETE)).toBe(false)
  })

  it('finalizes reasoning-only streams when they close without a finish part', async () => {
    const chunks: Chunk[] = []
    const adapter = new AiSdkToChunkAdapter((chunk) => chunks.push(chunk), [], true)

    await adapter.processStream({
      fullStream: streamFromParts([
        { type: 'reasoning-start', id: 'reasoning-1' },
        { type: 'reasoning-delta', id: 'reasoning-1', text: 'thinking' }
      ] as TextStreamPart<ToolSet>[]),
      text: Promise.resolve('')
    })

    const blockComplete = chunks.find((chunk) => chunk.type === ChunkType.BLOCK_COMPLETE)
    expect(chunks.some((chunk) => chunk.type === ChunkType.THINKING_COMPLETE)).toBe(true)
    expect(blockComplete?.response?.reasoning_content).toBe('thinking')
  })
})
