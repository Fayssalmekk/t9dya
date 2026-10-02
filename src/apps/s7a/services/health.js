import { collection, deleteDoc, doc, getDoc, increment, onSnapshot, orderBy, query, serverTimestamp, setDoc, Timestamp, updateDoc } from 'firebase/firestore'
import { db } from '../../../services/firebase'

const userCollection = (uid, name) => collection(db, 'users', uid, name)
const subscribe = (uid, name, field, direction, onData, onError) => onSnapshot(query(userCollection(uid, name), orderBy(field, direction)), (snapshot) => onData(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))), onError)

export const subscribeReadings = (uid, onData, onError) => subscribe(uid, 'healthReadings', 'recordedAt', 'desc', onData, onError)
export const subscribeDoses = (uid, onData, onError) => subscribe(uid, 'insulinDoses', 'takenAt', 'desc', onData, onError)
export const subscribeMedications = (uid, onData, onError) => subscribe(uid, 'healthMedications', 'createdAt', 'asc', onData, onError)
export const subscribeChecks = (uid, onData, onError) => subscribe(uid, 'medicationChecks', 'createdAt', 'desc', onData, onError)
export const subscribeAppointments = (uid, onData, onError) => subscribe(uid, 'healthAppointments', 'date', 'asc', onData, onError)
export const subscribeMeals = (uid, onData, onError) => subscribe(uid, 'mealAnalyses', 'eatenAt', 'desc', onData, onError)
export const subscribeWater = (uid, onData, onError) => subscribe(uid, 'healthWater', 'date', 'desc', onData, onError)

export async function ensureRequiredInsulins(uid) {
  const now = serverTimestamp()
  const rapidRef = doc(db, 'users', uid, 'healthMedications', 'novorapid')
  const basalRef = doc(db, 'users', uid, 'healthMedications', 'tresiba')
  const [rapid, basal] = await Promise.all([getDoc(rapidRef), getDoc(basalRef)])
  const writes = []
  if (!rapid.exists()) writes.push(setDoc(rapidRef, { name: 'NovoRapid', kind: 'insulin', insulin: 'novorapid', stock: 0, stockInitialized: false, shoppingAdded: false, lowStockThreshold: 1, unit: 'stylo', reminderTimes: [], required: true, color: 'orange', createdAt: now, updatedAt: now }))
  if (!basal.exists()) writes.push(setDoc(basalRef, { name: 'Tresiba', kind: 'insulin', insulin: 'tresiba', stock: 0, stockInitialized: false, shoppingAdded: false, lowStockThreshold: 1, unit: 'stylo', reminderTimes: ['22:00'], required: true, color: 'green', createdAt: now, updatedAt: now }))
  await Promise.all(writes)
}

export function addGlucoseReading(uid, values) {
  const reference = doc(userCollection(uid, 'healthReadings'))
  return setDoc(reference, { value: Number(values.value), unit: values.unit, trend: values.trend, source: values.source, note: values.note.trim(), recordedAt: Timestamp.fromDate(new Date(values.recordedAt)), createdAt: serverTimestamp() })
}

export function addInsulinDose(uid, values) {
  const reference = doc(userCollection(uid, 'insulinDoses'))
  return setDoc(reference, { insulin: values.insulin, units: Number(values.units), meal: values.meal || '', note: values.note.trim(), takenAt: Timestamp.fromDate(new Date(values.takenAt)), createdAt: serverTimestamp() })
}

export function createMedication(uid, values) {
  const reference = doc(userCollection(uid, 'healthMedications'))
  return setDoc(reference, { name: values.name.trim(), kind: 'supplement', stock: Number(values.stock) || 0, stockInitialized: true, shoppingAdded: false, lowStockThreshold: Number(values.lowStockThreshold) || 1, unit: values.unit || 'boîte', reminderTimes: values.reminderTimes, frequencyDays: Math.max(1, Number(values.frequencyDays) || 1), startsOn: values.startsOn, required: false, color: values.color || 'blue', createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
}

export function updateMedication(uid, medicationId, changes) {
  return updateDoc(doc(db, 'users', uid, 'healthMedications', medicationId), { ...changes, updatedAt: serverTimestamp() })
}

export function adjustMedicationStock(uid, medicationId, amount) {
  return updateDoc(doc(db, 'users', uid, 'healthMedications', medicationId), { stock: increment(amount), stockInitialized: true, stockUpdatedAt: serverTimestamp(), updatedAt: serverTimestamp() })
}

export function deleteMedication(uid, medicationId) {
  return deleteDoc(doc(db, 'users', uid, 'healthMedications', medicationId))
}

export function deleteJournalEntry(uid, collectionName, entryId) {
  const allowedCollections = ['healthReadings', 'insulinDoses', 'mealAnalyses']
  if (!allowedCollections.includes(collectionName)) return Promise.reject(new Error('INVALID_COLLECTION'))
  return deleteDoc(doc(db, 'users', uid, collectionName, entryId))
}

export function setMedicationCheck(uid, medicationId, date, taken) {
  const reference = doc(db, 'users', uid, 'medicationChecks', `${date}_${medicationId}`)
  return taken ? setDoc(reference, { medicationId, date, taken: true, createdAt: serverTimestamp() }, { merge: true }) : deleteDoc(reference)
}

export function setWaterIntake(uid, date, amountMl) {
  const reference = doc(db, 'users', uid, 'healthWater', date)
  return setDoc(reference, { date, amountMl: Math.min(2000, Math.max(0, Number(amountMl) || 0)), goalMl: 2000, updatedAt: serverTimestamp() }, { merge: true })
}

export function createAppointment(uid, values) {
  const reference = doc(userCollection(uid, 'healthAppointments'))
  return setDoc(reference, { doctor: values.doctor.trim(), specialty: values.specialty.trim(), location: values.location.trim(), date: values.date, time: values.time, recurrenceMonths: Number(values.recurrenceMonths) || 0, reminderDays: Number(values.reminderDays) || 7, note: values.note.trim(), createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
}

export function deleteAppointment(uid, appointmentId) {
  return deleteDoc(doc(db, 'users', uid, 'healthAppointments', appointmentId))
}

export function completeAppointment(uid, appointment) {
  if (!appointment.recurrenceMonths) return deleteAppointment(uid, appointment.id)
  const date = new Date(`${appointment.date}T12:00:00`)
  date.setMonth(date.getMonth() + appointment.recurrenceMonths)
  return updateDoc(doc(db, 'users', uid, 'healthAppointments', appointment.id), { date: date.toISOString().slice(0, 10), lastCompletedAt: serverTimestamp(), updatedAt: serverTimestamp() })
}

export function saveMealAnalysis(uid, values) {
  const reference = doc(userCollection(uid, 'mealAnalyses'))
  return setDoc(reference, { name: values.name.trim(), description: values.description.trim(), carbs: Number(values.carbs), carbsMin: Number(values.carbsMin) || Number(values.carbs), carbsMax: Number(values.carbsMax) || Number(values.carbs), confidence: values.confidence || 'faible', thumb: values.thumb || '', eatenAt: Timestamp.fromDate(new Date(values.eatenAt)), createdAt: serverTimestamp() })
}
