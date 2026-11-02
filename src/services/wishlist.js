import { addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from './firebase'

const wishesCollection = (householdId) => collection(db, 'households', householdId, 'wishes')

const cleanUrl = (value) => {
  const url = String(value || '').trim()
  if (!url) return ''
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString().slice(0, 500) : ''
  } catch { return '' }
}

export function subscribeWishes(householdId, onData, onError) {
  const wishesQuery = query(wishesCollection(householdId), orderBy('updatedAt', 'desc'))
  return onSnapshot(wishesQuery, (snapshot) => onData(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))), onError)
}

export function createWish(householdId, userId, values) {
  return addDoc(wishesCollection(householdId), {
    title: String(values.title || '').trim().slice(0, 120),
    category: values.category,
    status: values.status === 'planned' ? 'planned' : 'idea',
    forWhom: values.forWhom || 'couple',
    priority: ['low', 'normal', 'high'].includes(values.priority) ? values.priority : 'normal',
    estimatedBudget: Math.max(0, Math.min(10000000, Number(values.estimatedBudget) || 0)),
    targetDate: String(values.targetDate || '').slice(0, 10),
    place: String(values.place || '').trim().slice(0, 150),
    url: cleanUrl(values.url),
    note: String(values.note || '').trim().slice(0, 1000),
    emoji: String(values.emoji || '✨').slice(0, 16),
    voters: [userId],
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedBy: userId,
    updatedAt: serverTimestamp(),
    completedAt: null
  })
}

export function updateWish(householdId, wishId, userId, values) {
  return updateDoc(doc(db, 'households', householdId, 'wishes', wishId), {
    title: String(values.title || '').trim().slice(0, 120),
    category: values.category,
    status: ['idea', 'planned', 'done'].includes(values.status) ? values.status : 'idea',
    forWhom: values.forWhom || 'couple',
    priority: ['low', 'normal', 'high'].includes(values.priority) ? values.priority : 'normal',
    estimatedBudget: Math.max(0, Math.min(10000000, Number(values.estimatedBudget) || 0)),
    targetDate: String(values.targetDate || '').slice(0, 10),
    place: String(values.place || '').trim().slice(0, 150),
    url: cleanUrl(values.url),
    note: String(values.note || '').trim().slice(0, 1000),
    emoji: String(values.emoji || '✨').slice(0, 16),
    completedAt: values.status === 'done' ? (values.completedAt || serverTimestamp()) : null,
    updatedBy: userId,
    updatedAt: serverTimestamp()
  })
}

export function toggleWishVote(householdId, wishId, userId, active) {
  return updateDoc(doc(db, 'households', householdId, 'wishes', wishId), {
    voters: active ? arrayRemove(userId) : arrayUnion(userId),
    updatedBy: userId,
    updatedAt: serverTimestamp()
  })
}

export function setWishStatus(householdId, wishId, userId, status) {
  if (!['idea', 'planned', 'done'].includes(status)) return Promise.reject(new Error('INVALID_STATUS'))
  return updateDoc(doc(db, 'households', householdId, 'wishes', wishId), {
    status,
    completedAt: status === 'done' ? serverTimestamp() : null,
    updatedBy: userId,
    updatedAt: serverTimestamp()
  })
}

export function deleteWish(householdId, wishId) {
  return deleteDoc(doc(db, 'households', householdId, 'wishes', wishId))
}
