import { collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from './firebase'

const plansCollection = (householdId) => collection(db, 'households', householdId, 'mealPlans')
const slotId = (date, mealType) => `${date}_${mealType}`
const compactIngredients = (values) => {
  const items = (Array.isArray(values) ? values : []).slice(0, 60).map((item) => ({
    id: String(item.id || '').slice(0, 120),
    name: String(item.name || '').trim().slice(0, 100),
    emoji: String(item.emoji || '🛒').slice(0, 8),
    quantity: String(item.quantity || '1').slice(0, 16),
    unit: String(item.unit || 'pièce').slice(0, 24)
  })).filter((item) => item.name)
  while (items.length && JSON.stringify(items).length > 12000) items.pop()
  return JSON.stringify(items)
}

export function subscribeMealPlans(householdId, onData, onError) {
  const plansQuery = query(plansCollection(householdId), orderBy('date', 'asc'))
  return onSnapshot(plansQuery, (snapshot) => {
    onData(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })))
  }, onError)
}

export async function saveMealPlan(householdId, userId, values) {
  const reference = doc(plansCollection(householdId), slotId(values.date, values.mealType))
  const existing = await getDoc(reference)
  return setDoc(reference, {
    date: values.date,
    mealType: values.mealType,
    recipeId: String(values.recipeId || '').slice(0, 120),
    recipeSource: values.recipeSource === 'custom' ? 'custom' : values.recipeSource === 'free' ? 'free' : 'builtin',
    name: String(values.name || '').trim().slice(0, 120),
    emoji: String(values.emoji || '🍽️').slice(0, 8),
    servings: Math.round(Math.max(1, Math.min(20, Number(values.servings) || 2))),
    prepTime: Math.round(Math.max(0, Math.min(600, Number(values.prepTime) || 0))),
    ingredientIds: Array.isArray(values.ingredientIds) ? values.ingredientIds.slice(0, 60).map((item) => String(item).slice(0, 120)) : [],
    ingredientsJson: compactIngredients(values.ingredients),
    status: ['planned', 'prepared', 'eaten'].includes(values.status) ? values.status : 'planned',
    createdBy: existing.exists() ? existing.data().createdBy : userId,
    updatedBy: userId,
    createdAt: existing.exists() ? existing.data().createdAt : serverTimestamp(),
    updatedAt: serverTimestamp()
  })
}

export function updateMealPlanStatus(householdId, planId, status, userId) {
  if (!['planned', 'prepared', 'eaten'].includes(status)) return Promise.reject(new Error('INVALID_STATUS'))
  return updateDoc(doc(db, 'households', householdId, 'mealPlans', planId), { status, updatedBy: userId, updatedAt: serverTimestamp() })
}

export function deleteMealPlan(householdId, planId) {
  return deleteDoc(doc(db, 'households', householdId, 'mealPlans', planId))
}
