import aiHandler from '../api/ai.js'

const MAX_BODY_BYTES = 1600000
const serverKeys = [
  'OPENAI_API_KEY',
  'OPENAI_IMAGE_MODEL',
  'OPENAI_VISION_MODEL',
  'OPENAI_TEXT_MODEL',
  'ALLOWED_UIDS',
  'FIREBASE_API_KEY'
]

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0

    request.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new Error('BODY_TOO_LARGE'))
        return
      }
      chunks.push(chunk)
    })

    request.on('end', () => {
      if (size > MAX_BODY_BYTES) return
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'))
      } catch {
        reject(new Error('INVALID_JSON'))
      }
    })

    request.on('error', reject)
  })
}

function responseAdapter(response) {
  const adapter = {
    status(statusCode) {
      response.statusCode = statusCode
      return adapter
    },
    json(body) {
      if (response.writableEnded) return adapter
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.end(JSON.stringify(body))
      return adapter
    }
  }
  return adapter
}

export function viteAiMiddleware(env) {
  return {
    name: 't9dya-local-ai-api',
    apply: 'serve',
    configureServer(server) {
      serverKeys.forEach((key) => {
        if (env[key]) process.env[key] = env[key]
      })

      server.middlewares.use('/api/ai', async (request, response) => {
        const adapter = responseAdapter(response)
        try {
          request.body = request.method === 'POST' ? await readJsonBody(request) : {}
          await aiHandler(request, adapter)
        } catch (error) {
          const status = error.message === 'BODY_TOO_LARGE' ? 413 : 400
          adapter.status(status).json({ error: error.message })
        }
      })
    }
  }
}
