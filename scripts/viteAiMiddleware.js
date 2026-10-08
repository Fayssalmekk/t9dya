import aiHandler from '../api/ai.js'

const MAX_BODY_BYTES = 1600000
const serverKeys = [
  'OPENAI_API_KEY',
  'OPENAI_IMAGE_MODEL',
  'OPENAI_VISION_MODEL',
  'OPENAI_TEXT_MODEL',
  'OPENAI_ENHANCE_QUALITY',
  'OPENAI_COMBINE_QUALITY',
  'OPENAI_COMPOSE_QUALITY',
  'OPENAI_ENHANCE_SIZE',
  'OPENAI_COMBINE_SIZE',
  'OPENAI_COMPOSE_SIZE',
  'OPENAI_ENHANCE_COMPRESSION',
  'OPENAI_COMBINE_COMPRESSION',
  'OPENAI_COMPOSE_COMPRESSION',
  'OPENAI_TAG_DETAIL',
  'OPENAI_MEAL_DETAIL',
  'OPENAI_VISION_REASONING_EFFORT',
  'OPENAI_TEXT_REASONING_EFFORT',
  'OPENAI_CAR_MAX_OUTPUT_TOKENS',
  'OPENAI_CAR_RESEARCH_MAX_OUTPUT_TOKENS',
  'OPENAI_CAR_HORIZON_KM',
  'OPENAI_CAR_WEB_MODEL',
  'OPENAI_CAR_REASONING_EFFORT',
  'OPENAI_TAG_MAX_OUTPUT_TOKENS',
  'OPENAI_MEAL_MAX_OUTPUT_TOKENS',
  'OPENAI_SUGGEST_MAX_OUTPUT_TOKENS',
  'OPENAI_SUGGEST_MAX_ITEMS',
  'OPENAI_SUGGEST_MAX_BYTES',
  'OPENAI_TAG_CACHE_TTL_SECONDS',
  'ALLOWED_UIDS',
  'FIREBASE_API_KEY',
  'APP_ORIGIN'
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
    setHeader(name, value) {
      response.setHeader(name, value)
      return adapter
    },
    status(statusCode) {
      response.statusCode = statusCode
      return adapter
    },
    end(body) {
      if (!response.writableEnded) response.end(body)
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
