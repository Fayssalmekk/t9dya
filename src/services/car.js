import { addDoc, collection, deleteDoc, doc, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from './firebase'
import { localDate, validDate } from '../apps/car/model'

const ref = (home, name, id) => doc(db, 'households', home, name, id)
const list = (home, name) => collection(db, 'households', home, name)
const text = (value, max = 100) => String(value || '').trim().slice(0, max)
const validKm = (value) => Number.isInteger(value) && value >= 0 && value <= 2000000

export async function saveVehicle(home, uid, values) {
  const data = {
    name: text(values.name), year: Number(values.year), transmission: text(values.transmission, 40), color: text(values.color),
    plate: text(values.plate, 30), engine: text(values.engine), insuranceDate: values.insuranceDate || '', inspectionDate: values.inspectionDate || '', assistancePhone: text(values.assistancePhone, 40)
  }
  if (!data.name || !Number.isInteger(data.year) || data.year < 1900 || data.year > 2100) throw new Error('INVALID_VEHICLE')
  if ([data.insuranceDate, data.inspectionDate].some((date) => date && !validDate(date))) throw new Error('INVALID_DATE')
  return runTransaction(db, async (tx) => {
    const vehicle = ref(home, 'vehicles', 'main')
    const current = await tx.get(vehicle)
    tx.set(vehicle, { ...data, ...(!current.exists() ? { odometer: null, createdBy: uid, createdAt: serverTimestamp() } : {}), updatedBy: uid, updatedAt: serverTimestamp() }, { merge: true })
  })
}

export async function recordMileage(home, uid, values) {
  const amount = Number(values.value)
  if (values.value === '' || !validKm(amount) || !['absolute', 'increment', 'correction'].includes(values.mode)) throw new Error('INVALID_MILEAGE')
  if (values.mode === 'correction' && !text(values.note, 240)) throw new Error('CORRECTION_NOTE_REQUIRED')
  const log = doc(list(home, 'vehicleMileage'))
  return runTransaction(db, async (tx) => {
    const vehicle = ref(home, 'vehicles', 'main')
    const snapshot = await tx.get(vehicle)
    if (!snapshot.exists()) throw new Error('VEHICLE_NOT_FOUND')
    const previous = snapshot.data().odometer ?? null
    if (values.mode !== 'increment' && previous !== values.expected) throw new Error('MILEAGE_CHANGED')
    if (values.mode === 'increment' && previous === null) throw new Error('INITIAL_MILEAGE_REQUIRED')
    const next = values.mode === 'increment' ? previous + amount : amount
    if (!validKm(next) || (values.mode !== 'correction' && previous !== null && next < previous)) throw new Error('MILEAGE_DECREASE')
    if (next === previous) throw new Error('MILEAGE_UNCHANGED')
    tx.update(vehicle, { odometer: next, updatedBy: uid, updatedAt: serverTimestamp(), mileageUpdatedAt: serverTimestamp() })
    tx.set(log, { vehicleId: 'main', previous, value: next, mode: values.mode, note: text(values.note, 240), createdBy: uid, createdAt: serverTimestamp() })
  })
}

export async function saveCarTask(home, uid, values, id) {
  const data = {
    vehicleId: 'main', name: text(values.name), intervalKm: Number(values.intervalKm || 0), intervalMonths: Number(values.intervalMonths || 0),
    baselineKm: Number(values.baselineKm || 0), baselineDate: values.baselineDate || '', note: text(values.note, 300), active: true, updatedAt: serverTimestamp()
  }
  if (!data.name || !validKm(data.baselineKm) || !Number.isInteger(data.intervalKm) || data.intervalKm < 0 || data.intervalKm > 200000
    || !Number.isInteger(data.intervalMonths) || data.intervalMonths < 0 || data.intervalMonths > 120 || (!data.intervalKm && !data.intervalMonths)
    || (data.baselineDate && (!validDate(data.baselineDate) || data.baselineDate > localDate())) || (data.intervalMonths && !validDate(data.baselineDate))) throw new Error('INVALID_TASK')
  if (id) return updateDoc(ref(home, 'vehicleTasks', id), data)
  return addDoc(list(home, 'vehicleTasks'), { ...data, createdBy: uid, createdAt: serverTimestamp() })
}

export function archiveCarTask(home, id) {
  return updateDoc(ref(home, 'vehicleTasks', id), { active: false, updatedAt: serverTimestamp() })
}

export async function completeCarTask(home, uid, task, values) {
  const odometer = Number(values.odometer)
  if (values.odometer === '' || !validKm(odometer) || !validDate(values.performedOn) || values.performedOn > localDate()) throw new Error('INVALID_SERVICE')
  const service = doc(list(home, 'vehicleServices'))
  await runTransaction(db, async (tx) => {
    const vehicle = await tx.get(ref(home, 'vehicles', 'main'))
    const currentTask = await tx.get(ref(home, 'vehicleTasks', task.id))
    if (!currentTask.exists() || !currentTask.data().active) throw new Error('TASK_NOT_FOUND')
    if (!vehicle.exists() || vehicle.data().odometer === null || odometer > vehicle.data().odometer) throw new Error('UPDATE_MILEAGE_FIRST')
    tx.set(service, { vehicleId: 'main', taskId: task.id, taskName: currentTask.data().name, odometer, performedOn: values.performedOn, garage: text(values.garage), note: text(values.note, 300), createdBy: uid, createdAt: serverTimestamp() })
  })
  return service.id
}

export function deleteCarService(home, id) {
  return deleteDoc(ref(home, 'vehicleServices', id))
}
