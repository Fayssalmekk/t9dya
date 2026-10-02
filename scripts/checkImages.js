import { ingredients } from '../src/features/cuisine/data/ingredients.js'
import { recipes } from '../src/features/cuisine/data/recipes.js'

const entries = [
  ...ingredients.map((item) => ({ kind: 'ingredient', id: item.id, url: item.imageUrl })),
  ...recipes.map((item) => ({ kind: 'recipe', id: item.id, url: item.imageUrl }))
]

async function check(entry) {
  try {
    const response = await fetch(entry.url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(12000) })
    await response.body?.cancel()
    return { ...entry, ok: response.ok, status: response.status }
  } catch (error) {
    return { ...entry, ok: false, status: error.message }
  }
}

const broken = []
const batchSize = 12

for (let index = 0; index < entries.length; index += batchSize) {
  const results = await Promise.all(entries.slice(index, index + batchSize).map(check))
  broken.push(...results.filter((result) => !result.ok))
  process.stdout.write(`\rImages vérifiées : ${Math.min(index + batchSize, entries.length)}/${entries.length}`)
}

console.log(`\n${entries.length - broken.length} images valides, ${broken.length} cassée(s).`)
broken.forEach((item) => console.log(`[${item.kind}] ${item.id} — ${item.status} — ${item.url}`))
process.exitCode = broken.length ? 1 : 0
