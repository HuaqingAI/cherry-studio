const CHAT_LOG_PREVIEW_LIMIT = 240

export function buildLogPreview(text: string | undefined) {
  const normalized = (text || '').replace(/\s+/g, ' ').trim()
  return {
    preview:
      normalized.length > CHAT_LOG_PREVIEW_LIMIT ? `${normalized.slice(0, CHAT_LOG_PREVIEW_LIMIT)}...` : normalized,
    length: normalized.length,
    truncated: normalized.length > CHAT_LOG_PREVIEW_LIMIT
  }
}
