import { LocalNotifications } from '@capacitor/local-notifications'
import { isNativeApp } from './capacitor'
import { medicationFrequencyDays, nextMedicationDueDate } from '../apps/s7a/utils/medicationSchedule'

const HEALTH_REGISTRY_PREFIX = 't9dya-native-health-notifications:'
const DAILY_REGISTRY_PREFIX = 't9dya-native-daily-notifications:'
const SEEN_EVENTS_PREFIX = 't9dya-native-seen-events:'
const PREFERENCES_KEY = 't9dya-native-notification-preferences'

export const notificationOptions = [
  { key: 'shoppingRequests', title: 'Demandes de courses', description: 'Quand votre partenaire vous demande de faire une liste.', color: 'violet' },
  { key: 'partnerItems', title: 'Produits ajoutés', description: 'Quand votre partenaire ajoute un nouveau produit.', color: 'pink' },
  { key: 'shoppingDaily', title: 'Rappel courses quotidien', description: 'Un rappel s’il reste des produits à acheter.', color: 'amber', timeKey: 'shoppingDailyTime' },
  { key: 'medications', title: 'Traitements', description: 'À chaque heure prévue pour un traitement.', color: 'emerald' },
  { key: 'appointments', title: 'Rendez-vous médicaux', description: 'Avant les rendez-vous enregistrés dans S7a.', color: 'sky' },
  { key: 'lowStock', title: 'Stocks médicaments', description: 'Quand un traitement atteint son seuil minimum.', color: 'rose' },
  { key: 'dailySummary', title: 'Résumé quotidien', description: 'Un rappel pour vérifier le Hub et la journée.', color: 'teal', timeKey: 'dailySummaryTime' }
]

export const defaultNotificationPreferences = {
  shoppingRequests: true,
  partnerItems: true,
  shoppingDaily: false,
  shoppingDailyTime: '18:00',
  medications: true,
  appointments: true,
  lowStock: true,
  dailySummary: false,
  dailySummaryTime: '20:00'
}

function numericId(value) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0
  return Math.abs(hash) % 2000000000 + 1
}

function storedValues(key) {
  try {
    const values = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(values) ? values : []
  } catch {
    return []
  }
}

function validTime(value, fallback) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value || '') ? value : fallback
}

export function getNotificationPreferences() {
  try {
    return { ...defaultNotificationPreferences, ...JSON.parse(localStorage.getItem(PREFERENCES_KEY) || '{}') }
  } catch {
    return { ...defaultNotificationPreferences }
  }
}

export function saveNotificationPreferences(nextPreferences) {
  const preferences = { ...defaultNotificationPreferences, ...nextPreferences }
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences))
  window.dispatchEvent(new CustomEvent('t9dya-notification-preferences', { detail: preferences }))
  return preferences
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

export async function sendTestNotification() {
  if (!isNativeApp) throw new Error('NOT_NATIVE')
  const permission = await requestNativeNotificationPermission()
  if (permission !== 'granted') throw new Error('NOTIFICATION_PERMISSION_DENIED')
  await LocalNotifications.schedule({ notifications: [{
    id: numericId(`notification-test:${Date.now()}`),
    title: 'T9DYA · Test réussi 🔔',
    body: 'Les notifications Android fonctionnent sur ce téléphone.',
    channelId: 'daily-reminders',
    isExactNotification: false,
    schedule: { at: new Date(Date.now() + 1500), allowWhileIdle: true },
    extra: { path: '/settings' }
  }] })
}

export async function notifyNativeOnce({ preferenceKey, eventKey, title, body, path, channelId }) {
  if (!isNativeApp || !getNotificationPreferences()[preferenceKey]) return false
  if (await nativeNotificationPermission() !== 'granted') return false

  const storageKey = `${SEEN_EVENTS_PREFIX}${preferenceKey}`
  const seen = storedValues(storageKey)
  if (seen.includes(eventKey)) return false

  await LocalNotifications.schedule({ notifications: [{
    id: numericId(`${preferenceKey}:${eventKey}`),
    title,
    body,
    channelId,
    isExactNotification: false,
    schedule: { at: new Date(Date.now() + 500), allowWhileIdle: true },
    extra: { path }
  }] })
  localStorage.setItem(storageKey, JSON.stringify([...seen, eventKey].slice(-150)))
  return true
}

export async function syncHealthNotifications({ ownerId, ownerName, medications, appointments }) {
  if (!isNativeApp || !ownerId) return
  if (await nativeNotificationPermission() !== 'granted') return

  const registryKey = `${HEALTH_REGISTRY_PREFIX}${ownerId}`
  const previousIds = storedValues(registryKey)
  if (previousIds.length) await LocalNotifications.cancel({ notifications: previousIds.map((id) => ({ id })) })

  const preferences = getNotificationPreferences()
  const notifications = []
  if (preferences.medications) medications.forEach((item) => {
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

  if (preferences.appointments) appointments.forEach((item) => {
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
  localStorage.setItem(registryKey, JSON.stringify(notifications.map((item) => item.id)))
}

export async function syncDailyNotifications({ userId, openShoppingItems }) {
  if (!isNativeApp || !userId) return
  if (await nativeNotificationPermission() !== 'granted') return

  const registryKey = `${DAILY_REGISTRY_PREFIX}${userId}`
  const previousIds = storedValues(registryKey)
  if (previousIds.length) await LocalNotifications.cancel({ notifications: previousIds.map((id) => ({ id })) })

  const preferences = getNotificationPreferences()
  const notifications = []
  if (preferences.shoppingDaily && openShoppingItems > 0) {
    const [hour, minute] = validTime(preferences.shoppingDailyTime, '18:00').split(':').map(Number)
    notifications.push({
      id: numericId(`${userId}:shopping-daily`), title: 'T9dya · Courses à faire',
      body: `${openShoppingItems} produit${openShoppingItems > 1 ? 's' : ''} vous attend${openShoppingItems > 1 ? 'ent' : ''} dans vos listes.`,
      channelId: 'daily-reminders', isExactNotification: false,
      schedule: { on: { hour, minute }, repeats: true, allowWhileIdle: true }, extra: { path: '/t9dya/list' }
    })
  }
  if (preferences.dailySummary) {
    const [hour, minute] = validTime(preferences.dailySummaryTime, '20:00').split(':').map(Number)
    notifications.push({
      id: numericId(`${userId}:daily-summary`), title: 'Votre foyer aujourd’hui',
      body: 'Un petit passage dans le Hub pour vérifier courses, santé et budget.',
      channelId: 'daily-reminders', isExactNotification: false,
      schedule: { on: { hour, minute }, repeats: true, allowWhileIdle: true }, extra: { path: '/' }
    })
  }

  if (notifications.length) await LocalNotifications.schedule({ notifications })
  localStorage.setItem(registryKey, JSON.stringify(notifications.map((item) => item.id)))
}
