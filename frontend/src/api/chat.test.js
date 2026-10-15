import { afterEach, describe, expect, it, vi } from 'vitest'
import { requestChat } from './chat.js'

describe('requestChat', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('returns assistant reply from the server', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ reply: '你好', conversationId: 'conversation-1' }),
      }),
    )

    const result = await requestChat({ message: '你好' })

    expect(result.reply).toBe('你好')
    expect(result.conversationId).toBe('conversation-1')
  })

  it('throws a readable error for MODEL_NOT_CONFIGURED', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'MODEL_NOT_CONFIGURED',
            message: 'Configure the DeepSeek adapter before handling chat requests.',
          },
        }),
      }),
    )

    await expect(requestChat({ message: '你好' })).rejects.toThrow('模型服务尚未配置')
  })
})
