import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from './firebase'

export function subscribeHouseholdLocations(householdId, onData, onError) {
  return onSnapshot(collection(db, 'households', householdId, 'locations'), (snapshot) => {
    onData(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })))
  }, onError)
}

export function publishLocation(householdId, userId, position) {
  const { latitude, longitude, accuracy, heading, speed } = position.coords
  return setDoc(doc(db, 'households', householdId, 'locations', userId), {
    uid: userId,
    latitude,
    longitude,
    accuracy: Math.max(0, accuracy || 0),
    heading: Number.isFinite(heading) ? heading : null,
    speed: Number.isFinite(speed) ? Math.max(0, speed) : null,
    sharing: true,
    updatedAt: serverTimestamp()
  })
}

export function removeSharedLocation(householdId, userId) {
  return deleteDoc(doc(db, 'households', householdId, 'locations', userId))
}
