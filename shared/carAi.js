// Shared, bounded protocol. No photos, plates, partner details or expense data.
export const CAR_CHECK_KEYS = ['oil', 'filters', 'tires', 'brakes', 'transmission', 'battery', 'fluids', 'other']
const text = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : ''
const km = (value) => Number.isInteger(value) && value >= 0 && value <= 2000000
const date = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)

export function compactCarContext(input) {
  if (!input || !km(input.km) || !date(input.day) || !Array.isArray(input.s) || !Array.isArray(input.h)) throw new Error('INVALID_CAR_DATA')
  const schedules = input.s.filter((item) => item && /^[\w-]{1,100}$/.test(item.id)
    && km(item.b) && Number.isInteger(item.k) && item.k >= 0 && item.k <= 200000
    && Number.isInteger(item.m) && item.m >= 0 && item.m <= 120 && (item.k || item.m)
    && (!item.m || date(item.d)))
    .map((item) => ({ id: item.id, n: text(item.n, 70), k: item.k, m: item.m, b: item.b, d: date(item.d) ? item.d : '' }))
    .sort((a, b) => a.id.localeCompare(b.id)).slice(0, 20)
  const seen = new Set()
  const history = input.h.filter((item) => item && km(item.k) && date(item.d))
    .sort((a, b) => b.d.localeCompare(a.d) || b.k - a.k)
    .filter((item) => {
      const key = text(item.t, 100)
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    }).slice(0, 28)
    .map((item) => ({ t: text(item.t, 100), n: text(item.n, 70), k: item.k, d: item.d, key: CAR_CHECK_KEYS.includes(item.key) ? item.key : '' }))
  return {
    v: [text(input.v?.[0], 70), Number.isInteger(input.v?.[1]) ? input.v[1] : 0, text(input.v?.[2], 40), text(input.v?.[3], 80)],
    km: input.km, day: input.day, s: schedules, h: history,
  }
}

export function validateCarChecks(result, context) {
  const seen = new Set()
  if (!Array.isArray(result?.checks) || !result.checks.length || result.checks.length > 8) throw new Error('OPENAI_ERROR')
  for (const check of result.checks) {
    if (!CAR_CHECK_KEYS.includes(check.key) || seen.has(check.key)
      || typeof check.label !== 'string' || !check.label.trim() || check.label.length > 100
      || typeof check.advice !== 'string' || !check.advice.trim() || check.advice.length > 300
      || typeof check.taskId !== 'string' || (check.taskId && !context.s.some((task) => task.id === check.taskId))) throw new Error('OPENAI_ERROR')
    seen.add(check.key)
  }
  return result
}
