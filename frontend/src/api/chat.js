const defaultApiBaseUrl = 'http://localhost:8787'
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl).replace(/\/$/, '')

/**
 * 把服务端错误转换为页面可以直接展示的 Error。
 * @param {Response} response
 * @param {Record<string, unknown>} body
 * @returns {Error}
 */
function createResponseError(response, body) {
  const error = body?.error ?? {}
  const code = typeof error.code === 'string' ? error.code : 'REQUEST_FAILED'

  if (code === 'MODEL_NOT_CONFIGURED') {
    return new Error('模型服务尚未配置')
  }

  if (typeof error.message === 'string' && error.message) {
    return new Error(error.message)
  }

  return new Error(`请求失败（HTTP ${response.status}）`)
}

/**
 * 读取响应体并容忍非 JSON 错误响应。
 * @param {Response} response
 * @returns {Promise<Record<string, unknown>>}
 */
async function readResponseBody(response) {
  const contentType = response.headers.get('content-type') || ''

  if (!contentType.includes('application/json')) {
    return {}
  }

  return response.json()
}

/**
 * 向 Node 中间件发送聊天消息。
 * @param {{ message: string, conversationId?: string }} payload
 * @returns {Promise<{ reply: string, conversationId?: string, runId?: string }>}
 */
export async function requestChat(payload) {
  let response

  try {
    response = await fetch(`${apiBaseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error(error)
    throw new Error('无法连接 AI 中间件，请确认 Node 服务已启动')
  }

  const body = await readResponseBody(response)

  if (!response.ok) {
    throw createResponseError(response, body)
  }

  if (typeof body.reply !== 'string' || !body.reply.trim()) {
    throw new Error('AI 服务返回了无效回复')
  }

  return {
    reply: body.reply,
    conversationId: typeof body.conversationId === 'string' ? body.conversationId : undefined,
    runId: typeof body.runId === 'string' ? body.runId : undefined,
  }
}
