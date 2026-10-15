import http from 'node:http'

const port = Number.parseInt(process.env.PORT ?? '8787', 10)
const maxBodyBytes = 1024 * 1024

/**
 * 为接口响应写入允许跨域访问的响应头。
 * @param {import('node:http').ServerResponse} response
 * @returns {void}
 */
function setCorsHeaders(response) {
  response.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN ?? '*')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
}

/**
 * 以 JSON 格式返回接口响应。
 * @param {import('node:http').ServerResponse} response
 * @param {number} statusCode
 * @param {Record<string, unknown>} payload
 * @returns {void}
 */
function sendJson(response, statusCode, payload) {
  setCorsHeaders(response)
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' })
  response.end(JSON.stringify(payload))
}

/**
 * 读取并解析 JSON 请求体。
 * @param {import('node:http').IncomingMessage} request
 * @returns {Promise<Record<string, unknown>>}
 * @throws {Error} 请求体超限或 JSON 格式非法时抛出错误。
 */
async function readJson(request) {
  const chunks = []
  let size = 0

  for await (const chunk of request) {
    size += chunk.length

    if (size > maxBodyBytes) {
      throw new Error('REQUEST_TOO_LARGE')
    }

    chunks.push(chunk)
  }

  if (chunks.length === 0) {
    return {}
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new Error('INVALID_JSON')
  }
}

/**
 * 处理中间件收到的 HTTP 请求。
 * @param {import('node:http').IncomingMessage} request
 * @param {import('node:http').ServerResponse} response
 * @returns {Promise<void>}
 */
async function handleRequest(request, response) {
  if (request.method === 'OPTIONS') {
    setCorsHeaders(response)
    response.writeHead(204)
    response.end()
    return
  }

  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)

  if (request.method === 'GET' && url.pathname === '/health') {
    sendJson(response, 200, {
      status: 'ok',
      service: 'frontend-to-architect-server',
    })
    return
  }

  if (request.method === 'POST' && url.pathname === '/api/chat') {
    try {
      const body = await readJson(request)
      const message = typeof body.message === 'string' ? body.message.trim() : ''

      if (!message) {
        sendJson(response, 400, {
          error: {
            code: 'MESSAGE_REQUIRED',
            message: 'message must be a non-empty string',
          },
        })
        return
      }

      sendJson(response, 503, {
        error: {
          code: 'MODEL_NOT_CONFIGURED',
          message: 'Configure the DeepSeek adapter before handling chat requests.',
        },
      })
    } catch (error) {
      const code = error instanceof Error ? error.message : 'REQUEST_FAILED'
      const statusCode = code === 'REQUEST_TOO_LARGE' ? 413 : 400

      sendJson(response, statusCode, {
        error: {
          code,
          message: code === 'INVALID_JSON' ? 'request body must be valid JSON' : 'request failed',
        },
      })
    }
    return
  }

  sendJson(response, 404, {
    error: {
      code: 'NOT_FOUND',
      message: 'route not found',
    },
  })
}

const server = http.createServer(handleRequest)

server.listen(port, () => {
  console.log(`AI chat middleware listening on http://localhost:${port}`)
})

/**
 * 接收退出信号后关闭 HTTP 服务。
 * @param {NodeJS.Signals} signal
 * @returns {void}
 */
function shutdown(signal) {
  console.log(`${signal} received, shutting down`)
  server.close((error) => {
    if (error) {
      console.error(error)
      process.exitCode = 1
    }
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
