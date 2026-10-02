import { LocalNotifications } from '@capacitor/local-notifications'
import { isNativeApp } from './capacitor'
import { medicationFrequencyDays, nextMedicationDueDate } from '../apps/s7a/utils/medicationSchedule'

const REGISTRY_PREFIX = 't9dya-native-health-notifications:'

function numericId(value) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0
  return Math.abs(hash) % 2000000000 + 1
}

function storedIds(ownerId) {
  try { return JSON.parse(localStorage.getItem(`${REGISTRY_PREFIX}${ownerId}`) || '[]') } catch { return [] }
}

export async function requestNativeNotificationPermission() {
  if (!isNativeApp) return 'unsupported'
  const current = await LocalNotifications.checkPermissions()
  const result = current.display === 'prompt' ? await LocalNotifications.requestPermissions() : current
  return result.display
}

export async function nativeNotificationPermission() {
  if (!isNativeApp) return 'unsupported'
  return (await LocalNotifications.checkPermissions()).display
}

export async function syncHealthNotifications({ ownerId, ownerName, medications, appointments }) {
  if (!isNativeApp || !ownerId) return
  const permission = await nativeNotificationPermission()
  if (permission !== 'granted') return

  const previousIds = storedIds(ownerId)
  if (previousIds.length) await LocalNotifications.cancel({ notifications: previousIds.map((id) => ({ id })) })

  const notifications = []
  medications.filter((item) => item.kind === 'supplement').forEach((item) => {
    const reminderTimes = item.reminderTimes || []
    reminderTimes.forEach((time, index) => {
      const [hour, minute] = time.split(':').map(Number)
      if (!Number.isInteger(hour) || !Number.isInteger(minute)) return
      const base = {
        title: `S7a ya s7a · ${ownerName}`,
        body: `C’est l’heure de prendre ${item.name}.`,
        channelId: 'health-reminders',
        isExactNotification: false,
        extra: { path: `/s7a/medications?profile=${ownerId}` }
      }
      if (medicationFrequencyDays(item) === 1) {
        notifications.push({ ...base, id: numericId(`${ownerId}:medication:${item.id}:${index}`), schedule: { on: { hour, minute }, repeats: true, allowWhileIdle: true } })
        return
      }
      let due = nextMedicationDueDate(item)
      for (let occurrence = 0; due && occurrence < 16; occurrence += 1) {
        due.setHours(hour, minute, 0, 0)
        if (due.getTime() > Date.now()) notifications.push({ ...base, id: numericId(`${ownerId}:medication:${item.id}:${index}:${due.toISOString().slice(0, 10)}`), schedule: { at: due, allowWhileIdle: true } })
        due = nextMedicationDueDate(item, due, false)
      }
    })
  })

  appointments.forEach((item) => {
    const reminder = new Date(`${item.date}T09:00:00`)
    reminder.setDate(reminder.getDate() - (Number(item.reminderDays) || 7))
    if (reminder.getTime() <= Date.now()) return
    notifications.push({
      id: numericId(`${ownerId}:appointment:${item.id}:${item.date}`),
      title: `Rendez-vous · ${ownerName}`,
      body: `${item.doctor}${item.specialty ? ` · ${item.specialty}` : ''} le ${item.date}${item.time ? ` à ${item.time}` : ''}.`,
      channelId: 'health-reminders',
      isExactNotification: false,
      schedule: { at: reminder, allowWhileIdle: true },
      extra: { path: `/s7a/appointments?profile=${ownerId}` }
    })
  })

  if (notifications.length) await LocalNotifications.schedule({ notifications })
  localStorage.setItem(`${REGISTRY_PREFIX}${ownerId}`, JSON.stringify(notifications.map((item) => item.id)))
}
