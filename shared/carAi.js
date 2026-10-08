// Shared, bounded protocol. No photos, plates, partner details or expense data.
export const CAR_CHECK_KEYS = ['oil', 'filters', 'tires', 'brakes', 'transmission', 'battery', 'fluids', 'other']
export const CAR_URGENCY = ['due', 'soon', 'upcoming', 'inspect']
export const CAR_BASIS = ['history', 'manufacturer', 'reliable', 'inspection', 'unknown']
const text = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : ''
const km = (value) => Number.isInteger(value) && value >= 0 && value <= 2000000
const date = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day
}
const dateDifference = (future, current) => {
  const utc = (value) => { const [year, month, day] = value.split('-').map(Number); return Date.UTC(year, month - 1, day) }
  return Math.round((utc(future) - utc(current)) / 86400000)
}
const interval = (value) => Number.isInteger(value) && value >= -1 && value <= 200000

export function compactCarContext(input) {
  if (!input || !km(input.km) || !date(input.day) || !Array.isArray(input.s) || input.s.length > 500 || !Array.isArray(input.h) || input.h.length > 500) throw new Error('INVALID_CAR_DATA')
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
    v: [text(input.v?.[0], 60), text(input.v?.[1], 60), text(input.v?.[2], 80), Number.isInteger(input.v?.[3]) && input.v[3] >= 1900 && input.v[3] <= 2100 ? input.v[3] : 0, text(input.v?.[4], 100), text(input.v?.[5], 40), text(input.v?.[6], 40), text(input.v?.[7], 60), text(input.v?.[8], 60)],
    r: date(input.r) ? input.r : '', km: input.km, day: input.day, s: schedules, h: history,
  }
}

export function compactCarResearch(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || !Array.isArray(value.schedules)) return null
  const schedules = value.schedules.slice(0, 16).map((item) => {
    if (!item || !CAR_CHECK_KEYS.includes(item.key) || !interval(item.everyKm) || !Number.isInteger(item.everyMonths) || item.everyMonths < -1 || item.everyMonths > 120 || !interval(item.firstDueKm)) return null
    const label = text(item.label, 100), note = text(item.note, 300)
    if (!label || !note || !CAR_BASIS.includes(item.basis)) return null
    return { key: item.key, label, everyKm: item.everyKm, everyMonths: item.everyMonths, firstDueKm: item.firstDueKm, note, basis: item.basis }
  }).filter(Boolean)
  const identity = text(value.identity, 180), summary = text(value.summary, 500)
  return identity && summary && schedules.length ? { identity, summary, schedules } : null
}

export function compactCarSources(value) {
  if (!Array.isArray(value)) return []
  const seen = new Set()
  return value.map((source) => ({ title: text(source?.title, 140), url: text(source?.url, 600) }))
    .filter((source) => source.title && /^https:\/\//i.test(source.url) && !seen.has(source.url) && seen.add(source.url)).slice(0, 6)
}

export function validateCarChecks(result, context, horizon = 15000) {
  const seen = new Set()
  const usedTasks = new Set()
  if (!Array.isArray(result?.checks) || result.checks.length < 1 || result.checks.length > 6) throw new Error('OPENAI_ERROR')
  const checks = result.checks.map((check) => {
    if (!CAR_CHECK_KEYS.includes(check.key) || seen.has(check.key)
      || typeof check.label !== 'string' || !check.label.trim() || check.label.length > 100
      || typeof check.advice !== 'string' || !check.advice.trim() || check.advice.length > 300
      || typeof check.taskId !== 'string' || !Number.isInteger(check.dueKm) || check.dueKm < -1 || check.dueKm > 2000000
      || !Number.isInteger(check.remainingKm) || check.remainingKm < -2000000 || check.remainingKm > 2000000
      || typeof check.dueDate !== 'string' || (check.dueDate && !date(check.dueDate))
      || !Number.isInteger(check.remainingDays) || check.remainingDays < -100000 || check.remainingDays > 100000
      || !CAR_URGENCY.includes(check.urgency) || !CAR_BASIS.includes(check.basis)) throw new Error('OPENAI_ERROR')
    seen.add(check.key)
    const taskId = check.taskId && context.s.some((task) => task.id === check.taskId) && !usedTasks.has(check.taskId) ? check.taskId : ''
    if (taskId) usedTasks.add(taskId)
    const remainingKm = check.dueKm >= 0 ? check.dueKm - context.km : -1
    const remainingDays = check.dueDate ? dateDifference(check.dueDate, context.day) : -1
    return { ...check, taskId, remainingKm, remainingDays }
  })
  const relevant = checks.filter((check) => (check.dueKm < 0 ? check.urgency !== 'upcoming' : check.remainingKm <= horizon) || (check.dueDate && check.remainingDays <= 90))
  if (!relevant.length) throw new Error('OPENAI_ERROR')
  return { ...result, checks: relevant }
}
