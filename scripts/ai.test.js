import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import handler from '../api/ai.js'

// Offline tests: every fetch is replaced. No Firebase/OpenAI calls or charges.
const IMAGE = 'data:image/png;base64,aGVsbG8='
const OTHER_IMAGE = 'data:image/png;base64,d29ybGQ='
const TAGS = { category: 'Hauts', subcategory: 'T-shirt', colors: ['Noir'], pattern: 'Uni', material: 'Coton', season: ['Été'], style: ['Casual'], name_suggestion: 'T-shirt noir' }
const MEAL = { dish_name: 'Repas', estimated_carbs_g: 30, estimated_protein_g: 18, range_min_g: 20, range_max_g: 40, confidence: 'moyenne', assumptions: ['Portion estimée'], safety_note: 'Confirmez les portions et suivez votre plan prescrit.' }
const completed = (value) => ({ status: 'completed', output_text: JSON.stringify(value) })
const upstream = (value, status = 200) => ({ ok: status < 400, status, json: async () => value })
const suggestions = (id) => ({ combinations: Array.from({ length: 3 }, (_, index) => ({ name: `Tenue ${index + 1}`, itemIds: [id], reason: 'Assorti' })) })

test.beforeEach((t) => {
  const keys = Object.keys(process.env).filter((key) => key.startsWith('OPENAI_') || ['ALLOWED_UIDS', 'FIREBASE_API_KEY', 'APP_ORIGIN'].includes(key))
  const saved = Object.fromEntries(keys.map((key) => [key, process.env[key]]))
  keys.forEach((key) => delete process.env[key])
  Object.assign(process.env, { OPENAI_API_KEY: `test-only-${t.name}`, FIREBASE_API_KEY: 'test-only', ALLOWED_UIDS: 'one,two', OPENAI_VISION_MODEL: 'gpt-5.4-nano', OPENAI_TEXT_MODEL: 'gpt-5.4-nano' })
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => { throw new Error('Unexpected fetch: install mock first') }
  t.after(() => {
    Object.keys(process.env).filter((key) => key.startsWith('OPENAI_') || ['ALLOWED_UIDS', 'FIREBASE_API_KEY', 'APP_ORIGIN'].includes(key)).forEach((key) => delete process.env[key])
    Object.assign(process.env, saved)
    globalThis.fetch = originalFetch
  })
})

function mockApi(onOpenAI = () => upstream(completed(TAGS))) {
  const calls = []
  const auth = []
  globalThis.fetch = async (url, options) => {
    if (url.startsWith('https://identitytoolkit.googleapis.com/v1/accounts:lookup?')) {
      const token = JSON.parse(options.body).idToken
      auth.push(token)
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'))
      return upstream({ users: [{ localId: payload.sub, validSince: '1' }] })
    }
    assert.match(url, /^https:\/\/api\.openai\.com\/v1\/(responses|images\/edits)$/)
    const body = options.body instanceof FormData ? options.body : JSON.parse(options.body)
    calls.push({ url, body })
    return onOpenAI(body, calls.length)
  }
  return { calls, auth }
}

async function call(body, uid = 'one', overrides = {}) {
  const token = `test.${Buffer.from(JSON.stringify({ sub: uid, auth_time: 100 })).toString('base64url')}.test`
  const request = { method: 'POST', body, ...overrides, headers: { host: 'localhost:5173', 'content-type': 'application/json', authorization: `Bearer ${token}`, ...overrides.headers } }
  const response = {
    headers: {}, statusCode: 0, body: undefined,
    setHeader(key, value) { this.headers[key] = value; return this },
    status(value) { this.statusCode = value; return this },
    json(value) { this.body = value; return this },
    end() { return this },
  }
  await handler(request, response)
  return response
}

test('schemas and enums are exactly the pre-optimization declarations', async () => {
  const source = (await readFile(new URL('../api/ai.js', import.meta.url), 'utf8')).replaceAll('\r\n', '\n')
  const contract = JSON.parse(await readFile(new URL('./fixtures/ai-contract.json', import.meta.url), 'utf8'))
  for (const declaration of contract.declarations) assert.ok(source.includes(declaration), 'An existing schema/enum/limit declaration changed')
})

test('authentication, CORS, HTTP guards and body limits run before OpenAI/cache', async () => {
  const api = mockApi()
  const body = { action: 'tag', image: IMAGE }
  assert.equal((await call(body)).statusCode, 200) // Warm cache must not bypass auth.
  assert.deepEqual((await call(body, 'one', { headers: { authorization: '' } })).body, { error: 'UNAUTHORIZED' })
  assert.deepEqual((await call(body, 'outsider')).body, { error: 'NOT_ALLOWED' })
  assert.equal((await call(body, 'one', { headers: { origin: 'https://evil.example' } })).statusCode, 403)
  assert.equal((await call(body, 'one', { method: 'GET' })).statusCode, 405)
  assert.equal((await call(body, 'one', { method: 'OPTIONS' })).statusCode, 204)
  assert.equal((await call(body, 'one', { headers: { 'content-type': 'text/plain' } })).statusCode, 415)
  assert.equal((await call({ ...body, extra: 'x'.repeat(1600000) })).statusCode, 413)
  assert.equal((await call({ ...body, image: `data:image/png;base64,${Buffer.alloc(1000001).toString('base64')}` })).statusCode, 400)
  const response = await call(body)
  assert.equal(response.headers['Cache-Control'], 'no-store, private')
  assert.equal(response.headers['X-Content-Type-Options'], 'nosniff')
  assert.equal(response.headers['Content-Security-Policy'], "default-src 'none'; frame-ancestors 'none'")
  assert.equal(response.headers['Referrer-Policy'], 'no-referrer')
  assert.equal(api.calls.length, 1)
})

test('tag deduplicates identical concurrent requests; UID, bytes, model, key and detail isolate cache', async () => {
  const api = mockApi()
  const body = { action: 'tag', image: IMAGE }
  const responses = await Promise.all([call(body), call(body)])
  assert.deepEqual(responses.map((response) => response.body), [{ tags: TAGS }, { tags: TAGS }])
  assert.equal(api.calls.length, 1)
  assert.equal(api.auth.length, 2)
  await call(body)
  assert.equal(api.calls.length, 1)
  await call(body, 'two')
  await call({ ...body, image: OTHER_IMAGE })
  process.env.OPENAI_TAG_DETAIL = 'high'
  await call(body)
  process.env.OPENAI_VISION_MODEL = 'gpt-5.4-nano-2026-03-17'
  await call(body)
  process.env.OPENAI_API_KEY = 'test-only-rotated'
  await call(body)
  assert.equal(api.calls.length, 6)
  assert.equal(api.calls[0].body.input[0].content[1].detail, 'low')
  assert.deepEqual(api.calls[0].body.reasoning, { effort: 'none' })
  process.env.OPENAI_TAG_CACHE_TTL_SECONDS = '0'
  await call(body)
  await call(body)
  assert.equal(api.calls.length, 8)
})

test('failed analyses are not cached and upstream error codes stay intact', async () => {
  const api = mockApi((_, attempt) => attempt === 1 ? upstream({ error: { code: 'credit_balance_exhausted' } }, 429) : upstream(completed(TAGS)))
  assert.deepEqual((await call({ action: 'tag', image: IMAGE })).body, { error: 'credit_balance_exhausted' })
  assert.deepEqual((await call({ action: 'tag', image: IMAGE })).body, { tags: TAGS })
  assert.equal(api.calls.length, 2)
})

test('tag cache expires, stays bounded, and includes reasoning/token options', async (t) => {
  const originalNow = Date.now
  let now = originalNow()
  Date.now = () => now
  t.after(() => { Date.now = originalNow })
  const api = mockApi()
  const body = { action: 'tag', image: IMAGE }
  await call(body)
  now += 300001
  await call(body)
  assert.equal(api.calls.length, 2)
  process.env.OPENAI_TAG_MAX_OUTPUT_TOKENS = '500'
  await call(body)
  process.env.OPENAI_VISION_REASONING_EFFORT = 'low'
  await call(body)
  assert.equal(api.calls.length, 4)
  for (let index = 0; index < 65; index += 1) {
    await call({ action: 'tag', image: `data:image/png;base64,${Buffer.from(`garment-${index}`).toString('base64')}` })
  }
  assert.equal(api.calls.length, 69)
  await call({ action: 'tag', image: `data:image/png;base64,${Buffer.from('garment-64').toString('base64')}` })
  assert.equal(api.calls.length, 69)
  await call({ action: 'tag', image: `data:image/png;base64,${Buffer.from('garment-0').toString('base64')}` })
  assert.equal(api.calls.length, 70)
})

test('only token truncation retries once at 2x; incomplete JSON never succeeds', async () => {
  const api = mockApi((_, attempt) => upstream(attempt === 1
    ? { status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' }, output_text: '{' }
    : completed(TAGS)))
  assert.equal((await call({ action: 'tag', image: IMAGE })).statusCode, 200)
  assert.deepEqual(api.calls.map(({ body }) => body.max_output_tokens), [300, 600])
  const failing = mockApi(() => upstream({ status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' }, output_text: '{' }))
  assert.deepEqual((await call({ action: 'tag', image: OTHER_IMAGE })).body, { error: 'OPENAI_ERROR' })
  assert.equal(failing.calls.length, 2)
  const invalid = mockApi(() => upstream(completed({ ...TAGS, colors: ['not-an-enum'] })))
  assert.equal((await call({ action: 'tag', image: OTHER_IMAGE })).statusCode, 502)
  assert.equal(invalid.calls.length, 1)
  const refused = mockApi(() => upstream({ status: 'completed', output: [{ content: [{ type: 'refusal', refusal: 'Refused' }] }] }))
  assert.deepEqual((await call({ action: 'tag', image: OTHER_IMAGE })).body, { error: 'CONTENT_BLOCKED' })
  assert.equal(refused.calls.length, 1)
})

test('unknown models omit reasoning; supported effort can be configured or omitted explicitly', async () => {
  const api = mockApi(() => upstream(completed(MEAL)))
  process.env.OPENAI_VISION_MODEL = 'some-other-model'
  await call({ action: 'meal', image: IMAGE })
  assert.equal(Object.hasOwn(api.calls[0].body, 'reasoning'), false)
  process.env.OPENAI_VISION_REASONING_EFFORT = 'low'
  await call({ action: 'meal', image: IMAGE })
  assert.deepEqual(api.calls[1].body.reasoning, { effort: 'low' })
  process.env.OPENAI_VISION_REASONING_EFFORT = 'default'
  await call({ action: 'meal', image: IMAGE })
  assert.equal(Object.hasOwn(api.calls[2].body, 'reasoning'), false)
})

test('meal keeps schema, French and no-insulin-dose rule, and never reuses cached meals', async () => {
  const api = mockApi(() => upstream(completed(MEAL)))
  const body = { action: 'meal', image: IMAGE, description: 'Deux portions' }
  assert.deepEqual((await call(body)).body, MEAL)
  await call(body)
  assert.equal(api.calls.length, 2)
  assert.equal(api.calls[0].body.max_output_tokens, 450)
  const content = api.calls[0].body.input[0].content
  assert.match(content[0].text, /NEVER compute\/recommend an insulin dose/)
  assert.match(content[0].text, /carbs and protein/)
  assert.match(content[0].text, /French/)
  assert.match(content[0].text, /Deux portions/)
  assert.equal(content[1].detail, 'low')
})

test('all image actions keep quality, size, compression, references and output shape', async () => {
  const api = mockApi(() => upstream({ data: [{ b64_json: 'aW1hZ2U=' }] }))
  for (const [action, size, compression, count] of [['enhance', '1024x1536', '85', 1], ['combine', '1024x1024', '80', 3], ['compose', '1024x1536', '90', 4]]) {
    const images = [IMAGE, OTHER_IMAGE, IMAGE, OTHER_IMAGE].slice(0, count)
    const body = { action, image: IMAGE, images, names: ['Chemise', 'Veste', 'Gilet', 'Pantalon'], gender: 'female' }
    assert.deepEqual((await call(body)).body, { image: 'data:image/webp;base64,aW1hZ2U=' })
    const form = api.calls.at(-1).body
    assert.equal(form.get('quality'), 'medium')
    assert.equal(form.get('size'), size)
    assert.equal(form.get('output_compression'), compression)
    assert.equal(form.get('n'), '1')
    assert.equal(form.get('background'), 'transparent')
    assert.equal(form.get('output_format'), 'webp')
    const blobs = form.getAll(action === 'enhance' ? 'image' : 'image[]')
    assert.equal(blobs.length, count)
    for (const [index, blob] of blobs.entries()) assert.deepEqual(Buffer.from(await blob.arrayBuffer()), Buffer.from(images[index].split(',')[1], 'base64'))
    const prompt = form.get('prompt')
    for (const rule of ['front', 'Ghost mannequin', 'rolled sleeves', 'open/closed', 'hands', 'hanger', 'motif', 'trims']) assert.ok(prompt.includes(rule), rule)
    await call(body) // Regenerate must remain a fresh paid call, not a cache hit.
  }
  assert.equal(api.calls.length, 6)
  await call({ action: 'enhance', image: IMAGE, category: 'Chaussures' })
  assert.match(api.calls.at(-1).body.get('prompt'), /exactly 1 whole shoe, outer-side profile/)
  process.env.OPENAI_COMPOSE_QUALITY = 'high'
  process.env.OPENAI_COMPOSE_SIZE = '1024x1024'
  process.env.OPENAI_COMPOSE_COMPRESSION = '95'
  await call({ action: 'compose', images: [IMAGE, OTHER_IMAGE] })
  assert.equal(api.calls.at(-1).body.get('quality'), 'high')
  assert.equal(api.calls.at(-1).body.get('size'), '1024x1024')
  assert.equal(api.calls.at(-1).body.get('output_compression'), '95')
})

test('suggest allowlists real fields, filters unavailable garments and preserves exact IDs', async () => {
  const api = mockApi(() => upstream(completed(suggestions('clean-item'))))
  const wardrobe = [
    { id: 'clean-item', name: 'Chemise', status: 'clean', category: 'Hauts', subcategory: 'Chemise', colors: ['Blanc', 'Blanc', 'https://bad.example'], season: ['Été'], style: ['Casual', { image: IMAGE }], thumb: IMAGE, photos: [IMAGE], metadata: { large: 'x'.repeat(2000) }, material: '', pattern: 'Uni' },
    { id: 'dirty', status: 'dirty' }, { id: 'laundry', status: 'laundry' }, { id: 'unavailable', available: false },
    { id: 'unclean', isClean: false }, { id: 'archived', archived: true }, { id: 'deleted', deleted: true },
    { id: 'clean-item', name: 'Duplicate ID' }, { id: 'legacy', name: 'Without status', category: 'Bas' },
  ]
  const response = await call({ action: 'suggest', wardrobe })
  assert.deepEqual(response.body, suggestions('clean-item'))
  const sent = JSON.parse(api.calls[0].body.input.split('\n').at(-1))
  assert.deepEqual(sent.map((item) => item.id), ['clean-item', 'legacy'])
  assert.deepEqual(sent[0], { id: 'clean-item', n: 'Chemise', c: 'Hauts', t: 'Chemise', p: 'Uni', co: ['Blanc'], se: ['Été'], st: ['Casual'] })
  const empty = await call({ action: 'suggest', wardrobe: [{ id: 'dirty', status: 'dirty' }] })
  assert.deepEqual(empty.body, { error: 'INVALID_WARDROBE' })
  assert.equal(api.calls.length, 1)
  mockApi(() => upstream(completed(suggestions('dirty'))))
  assert.deepEqual((await call({ action: 'suggest', wardrobe })).body, { error: 'OPENAI_ERROR' })
})

test('suggest count and UTF-8 byte caps preserve complete JSON and category diversity', async () => {
  const api = mockApi((body) => upstream(completed(suggestions(JSON.parse(body.input.split('\n').at(-1))[0].id))))
  const wardrobe = Array.from({ length: 300 }, (_, index) => ({ id: `item-${index}`, category: index < 200 ? 'Hauts' : 'Bas', name: 'é'.repeat(100), colors: ['Noir'], status: 'clean', style: ['Casual'] }))
  await call({ action: 'suggest', wardrobe })
  let encoded = api.calls.at(-1).body.input.split('\n').at(-1)
  let sent = JSON.parse(encoded)
  assert.ok(sent.length <= 120)
  assert.ok(Buffer.byteLength(encoded, 'utf8') <= 16000)
  assert.ok(sent.some((item) => item.c === 'Hauts') && sent.some((item) => item.c === 'Bas'))
  process.env.OPENAI_SUGGEST_MAX_ITEMS = '3'
  await call({ action: 'suggest', wardrobe })
  assert.equal(JSON.parse(api.calls.at(-1).body.input.split('\n').at(-1)).length, 3)
  process.env.OPENAI_SUGGEST_MAX_ITEMS = '1000'
  process.env.OPENAI_SUGGEST_MAX_BYTES = '1024'
  await call({ action: 'suggest', wardrobe })
  encoded = api.calls.at(-1).body.input.split('\n').at(-1)
  sent = JSON.parse(encoded)
  assert.ok(Buffer.byteLength(encoded, 'utf8') <= 1024)
  assert.ok(sent.every((item) => wardrobe.some((original) => original.id === item.id)))
})
