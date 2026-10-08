export const DEFAULT_VEHICLE = { name: 'Ma Fabia', make: 'Škoda', model: 'Fabia', trim: '', year: 2026, engine: '', fuel: 'Essence', transmission: 'Automatique', gearbox: '', market: 'Maroc', registrationDate: '', color: 'Gris-vert · toit noir', plate: '', insuranceDate: '', inspectionDate: '', assistancePhone: '' }
export const CAR_CATEGORIES = [
  ['fuel', '⛽', 'Carburant'], ['maintenance', '🔧', 'Entretien'], ['repair', '🛠️', 'Réparation'],
  ['insurance', '🛡️', 'Assurance'], ['parking', '🅿️', 'Parking / péage'], ['wash', '🫧', 'Lavage'], ['other', '🚗', 'Autre']
]

export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false
  const date = new Date(`${value}T12:00:00`)
  return Number.isFinite(date.getTime()) && localDate(date) === value
}

export function addMonths(value, months) {
  if (!validDate(value)) return ''
  const date = new Date(`${value}T12:00:00`)
  const day = date.getDate()
  date.setDate(1)
  date.setMonth(date.getMonth() + months)
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  date.setDate(Math.min(day, last))
  return localDate(date)
}

export function daysUntil(value, today) {
  if (!validDate(value) || !validDate(today)) return null
  const utc = (key) => { const [y, m, d] = key.split('-').map(Number); return Date.UTC(y, m - 1, d) }
  return Math.round((utc(value) - utc(today)) / 86400000)
}

export function taskStatus(task, services, odometer, today) {
  const history = services.filter((entry) => entry.taskId === task.id).sort((a, b) => b.performedOn.localeCompare(a.performedOn) || b.odometer - a.odometer)
  const last = history[0]
  const baseKm = last?.odometer ?? task.baselineKm
  const baseDate = last?.performedOn || task.baselineDate
  const nextKm = task.intervalKm > 0 ? baseKm + task.intervalKm : null
  const nextDate = task.intervalMonths > 0 ? addMonths(baseDate, task.intervalMonths) : ''
  const remainingKm = nextKm !== null && odometer !== null ? nextKm - odometer : null
  const remainingDays = daysUntil(nextDate, today)
  const due = (remainingKm !== null && remainingKm <= 0) || (remainingDays !== null && remainingDays <= 0)
  const soon = !due && ((remainingKm !== null && remainingKm <= 1000) || (remainingDays !== null && remainingDays <= 30))
  const progress = task.intervalKm > 0 && odometer !== null ? Math.max(0, Math.min(1, (odometer - baseKm) / task.intervalKm)) : 0
  return { last, nextKm, nextDate, remainingKm, remainingDays, due, soon, progress }
}

export const formatKm = (value) => Number(value).toLocaleString('fr-FR')
export const money = (value) => `${Number(value || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} DH`
export const displayDate = (value) => validDate(value) ? new Date(`${value}T12:00:00`).toLocaleDateString('fr-FR') : 'Non renseignée'

export function carExpenseFields(values) {
  if (values.category !== 'car') return {}
  const odometer = values.carOdometer === '' || values.carOdometer == null ? null : Number(values.carOdometer)
  const liters = values.carLiters === '' || values.carLiters == null ? null : Number(values.carLiters)
  if (odometer !== null && (!Number.isInteger(odometer) || odometer < 0 || odometer > 2000000)) throw new Error('INVALID_CAR_ODOMETER')
  if (liters !== null && (!Number.isFinite(liters) || liters <= 0 || liters > 300)) throw new Error('INVALID_CAR_LITERS')
  const carKind = CAR_CATEGORIES.some(([key]) => key === values.carKind) ? values.carKind : 'other'
  return { vehicleId: 'main', carKind, carOdometer: odometer, carLiters: carKind === 'fuel' ? liters : null, carServiceId: String(values.carServiceId || '').slice(0, 100) }
}
