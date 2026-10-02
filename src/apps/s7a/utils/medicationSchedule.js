import { localDateKey } from './dates'

const DAY_MS = 86400000

export const MEDICATION_FREQUENCIES = [1, 2, 3, 7, 15, 30]

function calendarDayNumber(dateKey) {
  const [year, month, day] = String(dateKey || '').split('-').map(Number)
  if (!year || !month || !day) return null
  return Math.floor(Date.UTC(year, month - 1, day) / DAY_MS)
}

export function medicationFrequencyDays(medication) {
  const value = Number(medication?.frequencyDays)
  return Number.isInteger(value) && value > 0 ? value : 1
}

export function medicationFrequencyLabel(medication) {
  const days = medicationFrequencyDays(medication)
  if (days === 1) return 'Tous les jours'
  if (days === 7) return 'Chaque semaine'
  return `Tous les ${days} jours`
}

export function isMedicationDueOnDate(medication, dateKey) {
  const days = medicationFrequencyDays(medication)
  if (days === 1 || !medication?.startsOn) return true
  const date = calendarDayNumber(dateKey)
  const start = calendarDayNumber(medication.startsOn)
  return date !== null && start !== null && date >= start && (date - start) % days === 0
}

export function nextMedicationDueDate(medication, from = new Date(), includeFrom = true) {
  const candidate = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  if (!includeFrom) candidate.setDate(candidate.getDate() + 1)
  for (let offset = 0; offset <= 366; offset += 1) {
    if (isMedicationDueOnDate(medication, localDateKey(candidate))) return candidate
    candidate.setDate(candidate.getDate() + 1)
  }
  return null
}
