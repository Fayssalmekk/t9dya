import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'firebase/firestore'
import { db } from './firebase'

const householdDoc = (householdId) => doc(db, 'households', householdId)
const householdCollection = (householdId, name) => collection(db, 'households', householdId, name)

const starterCharges = [
  { id: 'credit', name: 'Crédit', amount: 2400, icon: '💳', dueDay: 5 },
  { id: 'loyer', name: 'Loyer', amount: 2800, icon: '🏠', dueDay: 5 },
  { id: 'eau-wifi', name: 'Eau + Wi-Fi', amount: 1000, icon: '💧', dueDay: 12 },
  { id: 'home-fayssal', name: 'Home Fayssal', amount: 2000, icon: '👨🏻', dueDay: 1 },
  { id: 'home-salma', name: 'Home Salma', amount: 3500, icon: '👩🏻', dueDay: 1 },
  { id: 'voiture', name: 'Voiture', amount: 0, icon: '🚗', dueDay: 15 }
]

const starterEnvelopes = [
  { id: 'epargne', name: 'Épargne', icon: '🐷', color: 'teal' },
  { id: 'laser', name: 'Laser', icon: '✨', color: 'violet' },
  { id: 'assurance', name: 'Assurance', icon: '🛡️', color: 'amber' }
]

export async function initializeHouseholdBudget(householdId, userId) {
  const homeRef = householdDoc(householdId)
  await runTransaction(db, async (transaction) => {
    const homeSnapshot = await transaction.get(homeRef)
    if (!homeSnapshot.exists() || homeSnapshot.data().budget?.plannerVersion >= 1) return

    starterCharges.forEach((charge, position) => {
      transaction.set(doc(db, 'households', householdId, 'charges', charge.id), {
        ...charge,
        position,
        active: true,
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    })
    starterEnvelopes.forEach((envelope, position) => {
      transaction.set(doc(db, 'households', householdId, 'envelopes', envelope.id), {
        ...envelope,
        balance: 0,
        target: 0,
        position,
        active: true,
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    })
    transaction.update(homeRef, {
      'budget.plannerVersion': 1,
      updatedAt: serverTimestamp()
    })
  })
}

export async function createEnvelope(householdId, userId, values) {
  return addDoc(householdCollection(householdId, 'envelopes'), {
    name: values.name.trim(),
    icon: values.icon,
    color: values.color,
    balance: 0,
    target: Number(values.target) || 0,
    active: true,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
}

export async function updateEnvelope(householdId, envelopeId, values) {
  return updateDoc(doc(db, 'households', householdId, 'envelopes', envelopeId), {
    name: values.name.trim(),
    icon: values.icon,
    color: values.color,
    target: Number(values.target) || 0,
    updatedAt: serverTimestamp()
  })
}

export async function archiveEnvelope(householdId, envelopeId) {
  const envelopeRef = doc(db, 'households', householdId, 'envelopes', envelopeId)
  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(envelopeRef)
    if (!snapshot.exists()) throw new Error('ENVELOPE_NOT_FOUND')
    if (Number(snapshot.data().balance || 0) > 0) throw new Error('ENVELOPE_NOT_EMPTY')
    transaction.update(envelopeRef, {
      active: false,
      archivedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  })
}

export async function addEnvelopeMovement(householdId, envelope, userId, values) {
  const envelopeRef = doc(db, 'households', householdId, 'envelopes', envelope.id)
  const movementRef = doc(householdCollection(householdId, 'envelopeTransactions'))
  const amount = Number(values.amount)
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('INVALID_AMOUNT')

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(envelopeRef)
    if (!snapshot.exists() || snapshot.data().active === false) throw new Error('ENVELOPE_NOT_FOUND')
    const currentBalance = Number(snapshot.data().balance) || 0
    const nextBalance = values.type === 'withdrawal' ? currentBalance - amount : currentBalance + amount
    if (nextBalance < 0) throw new Error('INSUFFICIENT_BALANCE')

    transaction.update(envelopeRef, { balance: nextBalance, updatedAt: serverTimestamp() })
    transaction.set(movementRef, {
      envelopeId: envelope.id,
      envelopeName: envelope.name,
      envelopeIcon: envelope.icon,
      type: values.type,
      amount,
      note: values.note.trim(),
      balanceAfter: nextBalance,
      createdBy: userId,
      createdAt: serverTimestamp()
    })
  })
}

export async function createCharge(householdId, userId, values) {
  return addDoc(householdCollection(householdId, 'charges'), {
    name: values.name.trim(),
    amount: Number(values.amount) || 0,
    icon: values.icon,
    dueDay: Number(values.dueDay) || 1,
    active: true,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
}

export async function updateCharge(householdId, chargeId, values) {
  return updateDoc(doc(db, 'households', householdId, 'charges', chargeId), {
    name: values.name.trim(),
    amount: Number(values.amount) || 0,
    icon: values.icon,
    dueDay: Number(values.dueDay) || 1,
    updatedAt: serverTimestamp()
  })
}

export async function archiveCharge(householdId, chargeId) {
  return updateDoc(doc(db, 'households', householdId, 'charges', chargeId), {
    active: false,
    archivedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
}

export async function markChargePaid(householdId, charge, month, userId) {
  return setDoc(doc(db, 'households', householdId, 'chargePayments', `${charge.id}_${month}`), {
    chargeId: charge.id,
    chargeName: charge.name,
    chargeIcon: charge.icon,
    month,
    amount: Number(charge.amount) || 0,
    paidBy: userId,
    paidAt: serverTimestamp()
  })
}

export async function unmarkChargePaid(householdId, chargeId, month) {
  return deleteDoc(doc(db, 'households', householdId, 'chargePayments', `${chargeId}_${month}`))
}
