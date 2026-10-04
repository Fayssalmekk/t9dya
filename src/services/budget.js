import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch
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
      occurredOn: values.occurredOn || new Date().toISOString().slice(0, 10),
      sourceSalaryId: values.type === 'deposit' ? values.sourceSalaryId || '' : '',
      sourceSalaryName: values.type === 'deposit' ? values.sourceSalaryName || '' : '',
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
    salaryOwnerId: values.salaryOwnerId || '',
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
    salaryOwnerId: values.salaryOwnerId || '',
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
    salaryOwnerId: charge.salaryOwnerId || '',
    paidBy: userId,
    paidAt: serverTimestamp()
  })
}

export function setMonthlySalary(householdId, memberId, month, amount, editedBy) {
  return setDoc(doc(db, 'households', householdId, 'salaryMonths', `${month}_${memberId}`), {
    memberId,
    month,
    amount: Math.max(0, Number(amount) || 0),
    editedBy,
    updatedAt: serverTimestamp()
  }, { merge: true })
}

export function setGrocerySalaryOwner(householdId, memberId) {
  return updateDoc(householdDoc(householdId), {
    'budget.grocerySalaryOwnerId': memberId || '',
    updatedAt: serverTimestamp()
  })
}

export async function unmarkChargePaid(householdId, chargeId, month) {
  return deleteDoc(doc(db, 'households', householdId, 'chargePayments', `${chargeId}_${month}`))
}

export async function resetChargePaymentsForMonth(householdId, month) {
  const payments = await getDocs(query(householdCollection(householdId, 'chargePayments'), where('month', '==', month)))
  if (payments.empty) return 0
  const batch = writeBatch(db)
  payments.docs.forEach((payment) => batch.delete(payment.ref))
  await batch.commit()
  return payments.size
}

export async function createExpense(householdId, userId, values) {
  const amount = Number(values.amount)
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('INVALID_AMOUNT')

  const expenseRef = doc(householdCollection(householdId, 'expenses'))
  const payload = {
    amount,
    reason: values.reason.trim(),
    note: values.note.trim(),
    category: values.category,
    sourceType: values.sourceType,
    sourceId: values.sourceId,
    sourceName: values.sourceName,
    sourceIcon: values.sourceIcon || '💳',
    spentOn: values.spentOn,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }

  if (values.sourceType !== 'envelope') {
    await setDoc(expenseRef, payload)
    return expenseRef
  }

  const envelopeRef = doc(db, 'households', householdId, 'envelopes', values.sourceId)
  const movementRef = doc(householdCollection(householdId, 'envelopeTransactions'))
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(envelopeRef)
    if (!snapshot.exists() || snapshot.data().active === false) throw new Error('ENVELOPE_NOT_FOUND')
    const nextBalance = Number(snapshot.data().balance || 0) - amount
    if (nextBalance < 0) throw new Error('INSUFFICIENT_BALANCE')
    transaction.update(envelopeRef, { balance: nextBalance, updatedAt: serverTimestamp() })
    transaction.set(expenseRef, payload)
    transaction.set(movementRef, {
      envelopeId: values.sourceId,
      envelopeName: values.sourceName,
      envelopeIcon: values.sourceIcon,
      expenseId: expenseRef.id,
      type: 'withdrawal',
      amount,
      occurredOn: values.spentOn,
      note: `Dépense · ${values.reason.trim()}`,
      balanceAfter: nextBalance,
      createdBy: userId,
      createdAt: serverTimestamp()
    })
  })
  return expenseRef
}

export async function deleteExpense(householdId, userId, expense) {
  const expenseRef = doc(db, 'households', householdId, 'expenses', expense.id)
  if (expense.sourceType !== 'envelope' || !expense.sourceId) return deleteDoc(expenseRef)

  const movementRef = doc(householdCollection(householdId, 'envelopeTransactions'))
  return runTransaction(db, async (transaction) => {
    const expenseSnapshot = await transaction.get(expenseRef)
    if (!expenseSnapshot.exists()) throw new Error('EXPENSE_NOT_FOUND')
    const storedExpense = expenseSnapshot.data()
    if (storedExpense.sourceType !== 'envelope' || !storedExpense.sourceId) throw new Error('INVALID_EXPENSE_SOURCE')
    const envelopeRef = doc(db, 'households', householdId, 'envelopes', storedExpense.sourceId)
    const envelopeSnapshot = await transaction.get(envelopeRef)
    if (!envelopeSnapshot.exists()) throw new Error('ENVELOPE_NOT_FOUND')
    const nextBalance = Number(envelopeSnapshot.data().balance || 0) + Number(storedExpense.amount || 0)
    transaction.update(envelopeRef, { balance: nextBalance, updatedAt: serverTimestamp() })
    transaction.delete(expenseRef)
    transaction.set(movementRef, {
      envelopeId: storedExpense.sourceId,
      envelopeName: storedExpense.sourceName,
      envelopeIcon: storedExpense.sourceIcon,
      expenseId: expense.id,
      type: 'deposit',
      amount: Number(storedExpense.amount || 0),
      occurredOn: new Date().toISOString().slice(0, 10),
      note: `Annulation · ${storedExpense.reason}`,
      balanceAfter: nextBalance,
      createdBy: userId,
      createdAt: serverTimestamp()
    })
  })
}
