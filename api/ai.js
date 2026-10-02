const dailyUsage = new Map()
const MAX_IMAGE_BYTES = 1000000
const DAILY_LIMIT = 30
const ENHANCE_LIMIT = 8

const json = (response, status, body) => response.status(status).json(body)

function dataUrlParts(value) {
  if (typeof value !== 'string') return null
  const match = value.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/)
  if (!match) return null
  const bytes = Buffer.from(match[2], 'base64')
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) return null
  return { mime: match[1], base64: match[2], bytes }
}

async function authenticate(request) {
  const token = request.headers.authorization?.match(/^Bearer (.+)$/)?.[1]
  if (!token || !process.env.FIREBASE_API_KEY) return { error: 401 }
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(process.env.FIREBASE_API_KEY)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: token }) })
  if (!response.ok) return { error: 401 }
  const uid = (await response.json()).users?.[0]?.localId
  if (!uid) return { error: 401 }
  const allowed = (process.env.ALLOWED_UIDS || '').split(',').map((value) => value.trim()).filter(Boolean)
  return allowed.includes(uid) ? { uid } : { error: 403 }
}

function consume(uid, action) {
  // Best-effort only: serverless instances do not share memory and may restart.
  const day = new Date().toISOString().slice(0, 10)
  const key = `${uid}:${day}`
  const current = dailyUsage.get(key) || { total: 0, enhance: 0 }
  if (current.total >= DAILY_LIMIT || (['enhance', 'combine', 'compose'].includes(action) && current.enhance >= ENHANCE_LIMIT)) return false
  current.total += 1
  if (['enhance', 'combine', 'compose'].includes(action)) current.enhance += 1
  dailyUsage.set(key, current)
  return true
}

async function openAI(path, body, multipart = false) {
  if (!process.env.OPENAI_API_KEY) throw new Error('AI_NOT_CONFIGURED')
  const response = await fetch(`https://api.openai.com/v1/${path}`, { method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, ...(multipart ? {} : { 'Content-Type': 'application/json' }) }, body: multipart ? body : JSON.stringify(body) })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error?.code || 'OPENAI_ERROR')
  return result
}

function responseText(result) {
  if (result.output_text) return result.output_text
  return result.output?.flatMap((entry) => entry.content || []).find((entry) => entry.type === 'output_text')?.text || ''
}

async function enhance(image) {
  const parsed = dataUrlParts(image)
  if (!parsed) throw new Error('INVALID_IMAGE')
  const form = new FormData()
  form.append('model', process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2.5-flare')
  form.append('image', new Blob([parsed.bytes], { type: parsed.mime }), `garment.${parsed.mime.split('/')[1]}`)
  form.append('prompt', 'Isolate this garment and render it as a clean, professional e-commerce product photo on a transparent background, as if worn by an invisible mannequin (ghost mannequin). Preserve exact color, pattern, texture, knit or fabric details and proportions. Do not add or change anything.')
  form.append('quality', 'medium')
  form.append('size', '1024x1024')
  form.append('background', 'transparent')
  form.append('output_format', 'webp')
  form.append('output_compression', '80')
  const result = await openAI('images/edits', form, true)
  const base64 = result.data?.[0]?.b64_json
  if (!base64) throw new Error('EMPTY_AI_IMAGE')
  return { image: `data:image/webp;base64,${base64}` }
}

async function combine(images, names = []) {
  if (!Array.isArray(images) || images.length < 2 || images.length > 3) throw new Error('INVALID_IMAGES')
  const parsedImages = images.map(dataUrlParts)
  if (parsedImages.some((image) => !image)) throw new Error('INVALID_IMAGE')
  const form = new FormData()
  form.append('model', process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2.5-flare')
  parsedImages.forEach((image, index) => form.append('image[]', new Blob([image.bytes], { type: image.mime }), `layer-${index + 1}.${image.mime.split('/')[1]}`))
  form.append('prompt', `Create one clean ghost-mannequin product image showing these exact garments worn together as realistic layers. The first reference is the inner garment (${String(names[0] || 'top').slice(0, 80)}), the second is the outer garment (${String(names[1] || 'jacket').slice(0, 80)}). Keep every color, pattern, texture, logo and cut faithful to the references. Show only the combined upper-body clothing, centered, front-facing, on a transparent background. Do not add a person, body, accessories, trousers or new design details.`)
  form.append('quality', 'medium')
  form.append('size', '1024x1024')
  form.append('background', 'transparent')
  form.append('output_format', 'webp')
  form.append('output_compression', '80')
  const result = await openAI('images/edits', form, true)
  const base64 = result.data?.[0]?.b64_json
  if (!base64) throw new Error('EMPTY_AI_IMAGE')
  return { image: `data:image/webp;base64,${base64}` }
}

async function compose(images, names = [], gender = 'neutral') {
  if (!Array.isArray(images) || images.length < 2 || images.length > 4) throw new Error('INVALID_IMAGES')
  const parsedImages = images.map(dataUrlParts)
  if (parsedImages.some((image) => !image)) throw new Error('INVALID_IMAGE')
  const form = new FormData()
  form.append('model', process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2.5-flare')
  parsedImages.forEach((image, index) => form.append('image[]', new Blob([image.bytes], { type: image.mime }), `outfit-${index + 1}.${image.mime.split('/')[1]}`))
  const audience = gender === 'female' ? 'women\'s wardrobe; keep the complete outfit clearly feminine' : gender === 'male' ? 'men\'s wardrobe; keep the complete outfit clearly masculine' : 'gender-neutral wardrobe; infer the intended fit only from the supplied garments'
  form.append('prompt', `Create one clean, realistic ghost-mannequin fashion product image showing all these exact garments worn together as one coherent outfit: ${names.map((name) => String(name).slice(0, 60)).join(', ')}. Wardrobe profile: ${audience}. Preserve the intended gender, fit and silhouette of the supplied clothes. Never convert masculine garments into feminine cuts or feminine garments into masculine cuts. Preserve the exact color, fabric, pattern, cut, logos and details of every reference. Arrange upper layers, bottoms, dresses, shoes and accessories in their anatomically correct positions. Show the complete outfit centered and front-facing on a transparent background. Do not add a person, face, body, or any garment not present in the references.`)
  form.append('quality', 'medium')
  form.append('size', '1024x1536')
  form.append('background', 'transparent')
  form.append('output_format', 'webp')
  form.append('output_compression', '80')
  const result = await openAI('images/edits', form, true)
  const base64 = result.data?.[0]?.b64_json
  if (!base64) throw new Error('EMPTY_AI_IMAGE')
  return { image: `data:image/webp;base64,${base64}` }
}

async function tag(image) {
  if (!process.env.OPENAI_VISION_MODEL) throw new Error('VISION_MODEL_NOT_CONFIGURED')
  if (!dataUrlParts(image)) throw new Error('INVALID_IMAGE')
  const schema = { type: 'object', additionalProperties: false, required: ['category', 'subcategory', 'colors', 'pattern', 'material', 'season', 'style', 'name_suggestion'], properties: { category: { type: 'string' }, subcategory: { type: 'string' }, colors: { type: 'array', maxItems: 4, items: { type: 'string' } }, pattern: { type: 'string' }, material: { type: 'string' }, season: { type: 'array', items: { type: 'string' } }, style: { type: 'array', items: { type: 'string' } }, name_suggestion: { type: 'string' } } }
  const result = await openAI('responses', { model: process.env.OPENAI_VISION_MODEL, store: false, input: [{ role: 'user', content: [{ type: 'input_text', text: 'Analyse uniquement le vêtement visible sur cette image préparée. Réponds en français avec des tags courts et factuels. Dans colors, place obligatoirement la couleur dominante en premier, puis les couleurs secondaires réellement visibles. Utilise des noms simples comme Noir, Blanc, Rouge, Rose, Bleu marine ou Beige. Retourne Multicolore si plus de trois couleurs importantes sont visibles.' }, { type: 'input_image', image_url: image, detail: 'low' }] }], text: { format: { type: 'json_schema', name: 'garment_tags', strict: true, schema } }, max_output_tokens: 450 })
  return { tags: JSON.parse(responseText(result)) }
}

async function suggest(body) {
  if (!process.env.OPENAI_TEXT_MODEL) throw new Error('TEXT_MODEL_NOT_CONFIGURED')
  if (!Array.isArray(body.wardrobe) || body.wardrobe.length > 1000) throw new Error('INVALID_WARDROBE')
  const schema = { type: 'object', additionalProperties: false, required: ['combinations'], properties: { combinations: { type: 'array', minItems: 3, maxItems: 3, items: { type: 'object', additionalProperties: false, required: ['name', 'itemIds', 'reason'], properties: { name: { type: 'string' }, itemIds: { type: 'array', items: { type: 'string' } }, reason: { type: 'string' } } } } } }
  const prompt = `Compose exactement 3 tenues avec uniquement les IDs disponibles. Occasion: ${String(body.occasion).slice(0, 40)}. Saison: ${String(body.season).slice(0, 40)}. Météo: ${String(body.weather).slice(0, 40)}. Exclure les vêtements non propres. Dressing: ${JSON.stringify(body.wardrobe).slice(0, 80000)}`
  const result = await openAI('responses', { model: process.env.OPENAI_TEXT_MODEL, store: false, input: prompt, text: { format: { type: 'json_schema', name: 'outfit_suggestions', strict: true, schema } }, max_output_tokens: 900 })
  return JSON.parse(responseText(result))
}

export default async function handler(request, response) {
  if (request.method !== 'POST') return json(response, 405, { error: 'METHOD_NOT_ALLOWED' })
  if (!request.headers['content-type']?.startsWith('application/json')) return json(response, 415, { error: 'JSON_REQUIRED' })
  if (Number(request.headers['content-length'] || 0) > 1600000) return json(response, 413, { error: 'BODY_TOO_LARGE' })
  const identity = await authenticate(request)
  if (identity.error) return json(response, identity.error, { error: identity.error === 403 ? 'NOT_ALLOWED' : 'UNAUTHORIZED' })
  const action = request.body?.action
  if (!['enhance', 'combine', 'compose', 'tag', 'suggest'].includes(action)) return json(response, 400, { error: 'INVALID_ACTION' })
  if (!consume(identity.uid, action)) return json(response, 429, { error: 'DAILY_LIMIT_REACHED' })
  try {
    const result = action === 'enhance' ? await enhance(request.body.image) : action === 'combine' ? await combine(request.body.images, request.body.names) : action === 'compose' ? await compose(request.body.images, request.body.names, request.body.gender) : action === 'tag' ? await tag(request.body.image) : await suggest(request.body)
    return json(response, 200, result)
  } catch (error) {
    const clientErrors = ['INVALID_IMAGE', 'INVALID_IMAGES', 'INVALID_WARDROBE']
    return json(response, clientErrors.includes(error.message) ? 400 : 502, { error: error.message })
  }
}
