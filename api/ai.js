const MAX_IMAGE_BYTES = 1000000
const MAX_BODY_BYTES = 1600000
const MAX_AUTH_TOKEN_CHARS = 8192

const json = (response, status, body) => response.status(status).json(body)

function applyCors(request, response) {
  const origin = request.headers.origin
  const forwardedProtocol = String(request.headers['x-forwarded-proto'] || '').split(',')[0].trim()
  const protocol = forwardedProtocol || (request.socket?.encrypted ? 'https' : 'http')
  const host = String(request.headers['x-forwarded-host'] || request.headers.host || '').split(',')[0].trim()
  const requestOrigin = host ? `${protocol}://${host}` : ''
  const allowedOrigins = ['https://localhost', requestOrigin, process.env.APP_ORIGIN].filter(Boolean)
  const allowed = !origin || allowedOrigins.includes(origin)
  if (origin && allowed) response.setHeader('Access-Control-Allow-Origin', origin)
  response.setHeader('Vary', 'Origin')
  response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.setHeader('Access-Control-Max-Age', '600')
  return allowed
}

function applySecurityHeaders(response) {
  response.setHeader('Cache-Control', 'no-store, private')
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'")
  response.setHeader('Referrer-Policy', 'no-referrer')
}

function decodedTokenPayload(token) {
  try {
    const encoded = token.split('.')[1]
    return encoded ? JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) : null
  } catch {
    return null
  }
}

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
  if (!token || token.length > MAX_AUTH_TOKEN_CHARS) return { error: 401 }
  if (!process.env.FIREBASE_API_KEY) return { error: 503 }
  let response
  try {
    response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(process.env.FIREBASE_API_KEY)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: token }), signal: AbortSignal.timeout(8000) })
  } catch {
    return { error: 503 }
  }
  if (!response.ok) return { error: 401 }
  const account = (await response.json()).users?.[0]
  const uid = account?.localId
  if (!uid || account.disabled === true) return { error: 401 }
  const payload = decodedTokenPayload(token)
  if (!payload || payload.sub !== uid || (Number(account.validSince) && Number(payload.auth_time) < Number(account.validSince))) return { error: 401 }
  const allowed = (process.env.ALLOWED_UIDS || '').split(',').map((value) => value.trim()).filter(Boolean)
  if (!allowed.length) return { error: 503 }
  return allowed.includes(uid) ? { uid } : { error: 403 }
}

async function openAI(path, body, multipart = false) {
  if (!process.env.OPENAI_API_KEY) throw new Error('AI_NOT_CONFIGURED')
  let response
  try {
    response = await fetch(`https://api.openai.com/v1/${path}`, { method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, ...(multipart ? {} : { 'Content-Type': 'application/json' }) }, body: multipart ? body : JSON.stringify(body), signal: AbortSignal.timeout(55000) })
  } catch (error) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') throw new Error('AI_TIMEOUT')
    throw new Error('OPENAI_UNREACHABLE')
  }
  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    const upstreamCode = String(result.error?.code || result.error?.type || '').toLowerCase()
    if (['credit_balance_exhausted', 'insufficient_quota', 'rate_limit_exceeded', 'content_policy_violation'].includes(upstreamCode)) throw new Error(upstreamCode)
    if (upstreamCode.includes('model') && (upstreamCode.includes('not_found') || upstreamCode.includes('access'))) throw new Error('MODEL_NOT_FOUND')
    if (upstreamCode.includes('safety') || upstreamCode.includes('moderation') || upstreamCode.includes('content_policy')) throw new Error('CONTENT_BLOCKED')
    if (response.status === 401 || response.status === 403) throw new Error('OPENAI_AUTH_ERROR')
    if (response.status === 413) throw new Error('BODY_TOO_LARGE')
    if (response.status === 429) throw new Error('RATE_LIMIT_REACHED')
    if (response.status >= 500) throw new Error('OPENAI_TEMPORARY_ERROR')
    if (response.status === 400 || response.status === 422) throw new Error('OPENAI_INVALID_REQUEST')
    throw new Error('OPENAI_ERROR')
  }
  return result
}

function responseText(result) {
  if (result.output_text) return result.output_text
  return result.output?.flatMap((entry) => entry.content || []).find((entry) => entry.type === 'output_text')?.text || ''
}

async function enhance(image, instructions = '') {
  const parsed = dataUrlParts(image)
  if (!parsed) throw new Error('INVALID_IMAGE')
  const userDirections = String(instructions || '').trim().slice(0, 600)
  const form = new FormData()
  form.append('model', process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2.5-flare')
  form.append('image', new Blob([parsed.bytes], { type: parsed.mime }), `garment.${parsed.mime.split('/')[1]}`)
  form.append('prompt', `Create a clean, high-detail e-commerce catalog image of this exact garment.

NON-NEGOTIABLE RULES:
- Show one garment only in a strictly straight-on front view, perfectly centered and upright, as if displayed in a real clothing boutique.
- The complete garment must be visible from its absolute highest point to its absolute lowest point on a transparent 1024x1536 portrait canvas.
- Leave generous transparent margin on all four sides. Never crop, zoom in, fill the frame, cut off, split, fold away or hide any edge.
- Keep the entire collar or neckline, hood, shoulders, both sleeves and cuffs, waist, pockets, hem, trouser legs, dress or skirt length and every extremity visible when present.
- If the source photo is already cropped, conservatively reconstruct every missing continuation. Use the visible cut, symmetry, fabric, seams and repeating pattern as evidence so the generated garment is complete.
- Preserve the exact product identity: dominant and secondary colors, motif geometry, motif size and spacing, print placement, logos, embroidery, stitching, seams, buttons, zippers, pockets, collar shape, sleeve shape, cut, texture, material and proportions.
- Do not simplify, blur, redesign, replace, remove or invent distinctive details.
- Use an invisible ghost mannequin only. Show no person, skin, face, hands, hanger, props, shop fixture or extra clothing.

OPTIONAL USER DIRECTIONS (follow only when compatible with every rule above):
${userDirections || 'No additional directions.'}`)
  form.append('quality', 'high')
  form.append('size', '1024x1536')
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
  form.append('prompt', `Create one clean, high-detail, strictly front-facing ghost-mannequin catalog image showing these exact garments as realistic layers. The first reference is the inner garment (${String(names[0] || 'top').slice(0, 80)}), the second is the outer garment (${String(names[1] || 'jacket').slice(0, 80)}). Show every selected garment completely with generous transparent margin. Never crop any collar, hood, shoulder, sleeve, cuff, waist or hem. If a source edge is missing, conservatively continue its visible cut and pattern to reconstruct the complete garment. Preserve every exact color, motif, texture, logo, seam, button, pocket, collar and proportion. Do not simplify or redesign details. Do not add a person, face, body, accessories, trousers or unselected clothing.`)
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

async function compose(images, names = [], gender = 'neutral', instructions = '', garments = []) {
  if (!Array.isArray(images) || images.length < 2 || images.length > 4) throw new Error('INVALID_IMAGES')
  const parsedImages = images.map(dataUrlParts)
  if (parsedImages.some((image) => !image)) throw new Error('INVALID_IMAGE')
  const form = new FormData()
  form.append('model', process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2.5-flare')
  parsedImages.forEach((image, index) => form.append('image[]', new Blob([image.bytes], { type: image.mime }), `outfit-${index + 1}.${image.mime.split('/')[1]}`))
  const audience = gender === 'female' ? 'women\'s wardrobe; keep the complete outfit clearly feminine' : gender === 'male' ? 'men\'s wardrobe; keep the complete outfit clearly masculine' : 'gender-neutral wardrobe; infer the intended fit only from the supplied garments'
  const garmentDetails = Array.isArray(garments) ? garments.slice(0, 4).map((garment, index) => `Reference ${index + 1}: name=${String(garment?.name || names[index] || '').slice(0, 80)}; category=${String(garment?.category || '').slice(0, 50)}; precise type=${String(garment?.subcategory || '').slice(0, 60)}; colors=${Array.isArray(garment?.colors) ? garment.colors.slice(0, 5).map((color) => String(color).slice(0, 30)).join(', ') : ''}; pattern=${String(garment?.pattern || '').slice(0, 60)}; material=${String(garment?.material || '').slice(0, 60)}.`).join('\n') : ''
  const userDirections = String(instructions || '').trim().slice(0, 600)
  form.append('prompt', `Create one clean, high-detail, photorealistic boutique catalog image showing all these exact garments worn together as one coherent outfit: ${names.map((name) => String(name).slice(0, 60)).join(', ')}.

NON-NEGOTIABLE COMPOSITION RULES:
- Use a strictly straight-on front view at eye level, never a side, back, three-quarter or perspective view.
- Show the complete outfit from the absolute highest point to the absolute lowest point on a transparent 1024x1536 portrait canvas.
- Keep generous transparent margin above, below, left and right. Never crop, zoom in, fill the frame, cut off, split, fold away or hide any garment edge.
- The full collar or neckline, hood, shoulders, both sleeves and cuffs, waist, hems, full trouser legs, full dress or skirt length, shoes and accessories must remain visible when present.
- If an original reference is cropped, conservatively reconstruct its missing continuation into a plausible complete garment. Extend the visible cut, symmetry, fabric, seams and repeating motif; do not leave the generated garment cropped merely because the source is cropped.
- Treat each supplied image and its metadata as the exact product identity. Reproduce the same dominant and secondary colors, motif geometry, motif scale and spacing, print placement, logos, embroidery, texture, fabric, seams, buttons, pockets, collar shape, sleeve shape, cut and proportions. Do not simplify, blur, invent, remove, replace or redesign distinctive details.
- Arrange upper layers, bottoms, dresses, shoes and accessories in anatomically correct positions. Preserve the intended gender, fit and silhouette. Never turn masculine cuts into feminine cuts or feminine cuts into masculine cuts.
- Use an invisible ghost mannequin only. Do not show a person, face, skin, hands, hanger, shop fixture or any garment that was not selected.

Wardrobe profile: ${audience}.
GARMENT METADATA:
${garmentDetails || 'Use the visual references exactly as supplied.'}

OPTIONAL USER DIRECTIONS (follow only when compatible with all non-negotiable rules above):
${userDirections || 'No additional directions.'}`)
  form.append('quality', 'high')
  form.append('size', '1024x1536')
  form.append('background', 'transparent')
  form.append('output_format', 'webp')
  form.append('output_compression', '90')
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

async function analyseMeal(image, description = '') {
  if (!process.env.OPENAI_VISION_MODEL) throw new Error('VISION_MODEL_NOT_CONFIGURED')
  if (!dataUrlParts(image)) throw new Error('INVALID_IMAGE')
  const schema = { type: 'object', additionalProperties: false, required: ['dish_name', 'estimated_carbs_g', 'range_min_g', 'range_max_g', 'confidence', 'assumptions', 'safety_note'], properties: { dish_name: { type: 'string' }, estimated_carbs_g: { type: 'number' }, range_min_g: { type: 'number' }, range_max_g: { type: 'number' }, confidence: { type: 'string', enum: ['faible', 'moyenne', 'élevée'] }, assumptions: { type: 'array', maxItems: 5, items: { type: 'string' } }, safety_note: { type: 'string' } } }
  const prompt = `Estime les glucides visibles dans ce repas à partir de la photo et de cette description utilisateur: ${String(description).slice(0, 600)}. Donne une estimation centrale et une plage réaliste en grammes. Identifie clairement les portions supposées et l'incertitude. Ne calcule et ne recommande jamais une dose d'insuline. Le safety_note doit rappeler de confirmer les portions et d'utiliser uniquement le plan d'insuline prescrit.`
  const result = await openAI('responses', { model: process.env.OPENAI_VISION_MODEL, store: false, input: [{ role: 'user', content: [{ type: 'input_text', text: prompt }, { type: 'input_image', image_url: image, detail: 'low' }] }], text: { format: { type: 'json_schema', name: 'meal_carbs', strict: true, schema } }, max_output_tokens: 650 })
  return JSON.parse(responseText(result))
}

export default async function handler(request, response) {
  applySecurityHeaders(response)
  const corsAllowed = applyCors(request, response)
  if (!corsAllowed) return json(response, 403, { error: 'ORIGIN_NOT_ALLOWED' })
  if (request.method === 'OPTIONS') return response.status(204).end()
  if (request.method !== 'POST') return json(response, 405, { error: 'METHOD_NOT_ALLOWED' })
  if (!request.headers['content-type']?.startsWith('application/json')) return json(response, 415, { error: 'JSON_REQUIRED' })
  if (!request.body || typeof request.body !== 'object' || Array.isArray(request.body)) return json(response, 400, { error: 'INVALID_JSON' })
  const declaredSize = Number(request.headers['content-length'] || 0)
  const actualSize = Buffer.byteLength(JSON.stringify(request.body), 'utf8')
  if (declaredSize > MAX_BODY_BYTES || actualSize > MAX_BODY_BYTES) return json(response, 413, { error: 'BODY_TOO_LARGE' })
  const identity = await authenticate(request)
  if (identity.error) return json(response, identity.error, { error: identity.error === 403 ? 'NOT_ALLOWED' : identity.error === 503 ? 'AUTH_CONFIGURATION_UNAVAILABLE' : 'UNAUTHORIZED' })
  const action = request.body?.action
  if (!['enhance', 'combine', 'compose', 'tag', 'suggest', 'meal'].includes(action)) return json(response, 400, { error: 'INVALID_ACTION' })
  try {
    const result = action === 'enhance' ? await enhance(request.body.image, request.body.instructions) : action === 'combine' ? await combine(request.body.images, request.body.names) : action === 'compose' ? await compose(request.body.images, request.body.names, request.body.gender, request.body.instructions, request.body.garments) : action === 'tag' ? await tag(request.body.image) : action === 'meal' ? await analyseMeal(request.body.image, request.body.description) : await suggest(request.body)
    return json(response, 200, result)
  } catch (error) {
    const clientErrors = ['INVALID_IMAGE', 'INVALID_IMAGES', 'INVALID_WARDROBE']
    return json(response, clientErrors.includes(error.message) ? 400 : 502, { error: error.message })
  }
}
