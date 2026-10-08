import { addDoc, collection, deleteDoc, doc, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from './firebase'
import { DEFAULT_VEHICLE, localDate, validDate } from '../apps/car/model'
import { CAR_BASIS, CAR_URGENCY, compactCarResearch, compactCarSources } from '../../shared/carAi.js'

const ref = (home, name, id) => doc(db, 'households', home, name, id)
const list = (home, name) => collection(db, 'households', home, name)
const text = (value, max = 100) => String(value || '').trim().slice(0, max)
const validKm = (value) => Number.isInteger(value) && value >= 0 && value <= 2000000

export async function saveVehicle(home, uid, values) {
  const data = {
    name: text(values.name), make: text(values.make, 60), model: text(values.model, 60), trim: text(values.trim, 80), year: Number(values.year),
    engine: text(values.engine), fuel: text(values.fuel, 40), transmission: text(values.transmission, 40), gearbox: text(values.gearbox, 60), market: text(values.market, 60),
    registrationDate: values.registrationDate || '', color: text(values.color), plate: text(values.plate, 30), insuranceDate: values.insuranceDate || '',
    inspectionDate: values.inspectionDate || '', assistancePhone: text(values.assistancePhone, 40)
  }
  if (!data.name || !data.make || !data.model || !data.fuel || !data.transmission || !Number.isInteger(data.year) || data.year < 1900 || data.year > 2100) throw new Error('INVALID_VEHICLE')
  if ([data.registrationDate, data.insuranceDate, data.inspectionDate].some((date) => date && !validDate(date)) || (data.registrationDate && data.registrationDate > localDate())) throw new Error('INVALID_DATE')
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

export async function saveCarAiPlan(home, uid, input, result, sourceKm, vehicleKey, expectedVersion = '') {
  const checks = (Array.isArray(result?.checks) ? result.checks : []).slice(0, 6).map((check) => ({
    key: text(check.key, 20), taskId: text(check.taskId, 100), label: text(check.label), advice: text(check.advice, 300),
    dueKm: check.dueKm, remainingKm: check.remainingKm, dueDate: text(check.dueDate, 10), remainingDays: check.remainingDays, urgency: text(check.urgency, 20), basis: text(check.basis, 20),
  }))
  if (!validKm(sourceKm) || !input || input.length > 20000 || !checks.length
    || checks.some((check) => !check.key || !check.label || !check.advice || !Number.isInteger(check.dueKm) || !Number.isInteger(check.remainingKm) || typeof check.dueDate !== 'string' || !Number.isInteger(check.remainingDays) || !CAR_URGENCY.includes(check.urgency) || !CAR_BASIS.includes(check.basis))
    || new Set(checks.map((check) => check.key)).size !== checks.length) throw new Error('INVALID_AI_PLAN')
  const research = compactCarResearch(result?.research)
  const sources = compactCarSources(result?.sources)
  if (!research || !sources.length || !vehicleKey || vehicleKey.length > 1000) throw new Error('INVALID_AI_PLAN')
  const version = globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${uid.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 12) || 'member'}`
  const planRef = ref(home, 'vehicleAiPlans', 'current')
  await runTransaction(db, async (tx) => {
    const current = await tx.get(planRef)
    const vehicleSnapshot = await tx.get(ref(home, 'vehicles', 'main'))
    const vehicle = { ...DEFAULT_VEHICLE, ...(vehicleSnapshot.exists() ? vehicleSnapshot.data() : {}) }
    const currentVehicleKey = JSON.stringify([vehicle.make, vehicle.model, vehicle.trim, vehicle.year, vehicle.engine, vehicle.fuel, vehicle.transmission, vehicle.gearbox, vehicle.market])
    if (currentVehicleKey !== vehicleKey) throw new Error('VEHICLE_CHANGED')
    if ((current.exists() ? current.data().version : '') !== expectedVersion) throw new Error('AI_PLAN_CHANGED')
    tx.set(planRef, {
      vehicleId: 'main', version, input, checksJson: JSON.stringify(checks), checkKeys: checks.map((check) => check.key),
      researchJson: JSON.stringify(research), sourcesJson: JSON.stringify(sources), vehicleKey,
      sourceKm, generatedOn: localDate(), updatedBy: uid, updatedAt: serverTimestamp(),
    })
  })
}

export async function completeAiCarCheck(home, uid, plan, check, values) {
  const odometer = Number(values.odometer)
  if (!plan?.version || !check?.key || values.odometer === '' || !validKm(odometer)
    || !validDate(values.performedOn) || values.performedOn > localDate()) throw new Error('INVALID_SERVICE')
  const service = ref(home, 'vehicleAiServices', `${plan.version}-${check.key}`)
  await runTransaction(db, async (tx) => {
    const vehicle = await tx.get(ref(home, 'vehicles', 'main'))
    const currentPlan = await tx.get(ref(home, 'vehicleAiPlans', 'current'))
    const existing = await tx.get(service)
    if (existing.exists()) throw new Error('AI_CHECK_ALREADY_DONE')
    if (!currentPlan.exists() || currentPlan.data().version !== plan.version || !currentPlan.data().checkKeys.includes(check.key)) throw new Error('AI_PLAN_CHANGED')
    if (!vehicle.exists() || vehicle.data().odometer === null || odometer > vehicle.data().odometer) throw new Error('UPDATE_MILEAGE_FIRST')
    tx.set(service, {
      vehicleId: 'main', planVersion: plan.version, aiKey: check.key, taskId: text(check.taskId, 100), taskName: text(check.label),
      odometer, performedOn: values.performedOn, garage: text(values.garage), note: text(values.note, 300), createdBy: uid, createdAt: serverTimestamp(),
    })
  })
  return service.id
}

export function deleteAiCarService(home, id) {
  return deleteDoc(ref(home, 'vehicleAiServices', id))
}
