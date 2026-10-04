import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from './firebase'

const recipesCollection = (householdId) => collection(db, 'households', householdId, 'customRecipes')

export function subscribeCustomRecipes(householdId, onData, onError) {
  const recipesQuery = query(recipesCollection(householdId), orderBy('updatedAt', 'desc'))
  return onSnapshot(recipesQuery, (snapshot) => {
    onData(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })))
  }, onError)
}

export function createCustomRecipe(householdId, userId, recipe) {
  return addDoc(recipesCollection(householdId), {
    ...recipe,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
}

export function updateCustomRecipe(householdId, recipeId, recipe, userId) {
  return updateDoc(doc(db, 'households', householdId, 'customRecipes', recipeId), {
    ...recipe,
    updatedBy: userId,
    updatedAt: serverTimestamp()
  })
}

export function deleteCustomRecipe(householdId, recipeId) {
  return deleteDoc(doc(db, 'households', householdId, 'customRecipes', recipeId))
}
