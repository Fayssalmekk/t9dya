import { addDoc, collection, deleteDoc, doc, getDoc, increment, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from '../../../services/firebase'

const userCollection = (uid, name) => collection(db, 'users', uid, name)

export function subscribeToWardrobe(uid, onData, onError) {
  return onSnapshot(query(userCollection(uid, 'clothes'), orderBy('createdAt', 'desc')), (snapshot) => onData(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))), onError)
}

export function subscribeToOutfits(uid, onData, onError) {
  return onSnapshot(query(userCollection(uid, 'outfits'), orderBy('createdAt', 'desc')), (snapshot) => onData(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))), onError)
}

export function subscribeToPlans(uid, onData, onError) {
  return onSnapshot(userCollection(uid, 'outfitPlans'), (snapshot) => onData(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))), onError)
}

export async function createClothingItem(uid, item, image, thumb) {
  if (!image?.startsWith('data:image/') || image.length > 900000) throw new Error('IMAGE_TOO_LARGE')
  if (!thumb?.startsWith('data:image/') || thumb.length > 250000) throw new Error('THUMB_TOO_LARGE')
  const itemRef = doc(userCollection(uid, 'clothes'))
  const batch = writeBatch(db)
  batch.set(itemRef, { ...item, thumb, wearCount: 0, lastWornAt: null, status: 'clean', favorite: false, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  batch.set(doc(db, 'users', uid, 'clothesImages', itemRef.id), { image, updatedAt: serverTimestamp() })
  await batch.commit()
  return itemRef.id
}

export async function getClothingImage(uid, itemId) {
  const snapshot = await getDoc(doc(db, 'users', uid, 'clothesImages', itemId))
  return snapshot.exists() ? snapshot.data().image : null
}

export function updateClothingItem(uid, itemId, changes) {
  return updateDoc(doc(db, 'users', uid, 'clothes', itemId), { ...changes, updatedAt: serverTimestamp() })
}

export function markClothingWorn(uid, itemId) {
  return updateDoc(doc(db, 'users', uid, 'clothes', itemId), { wearCount: increment(1), lastWornAt: serverTimestamp(), status: 'dirty', updatedAt: serverTimestamp() })
}

export async function removeClothingItem(uid, itemId) {
  const itemRef = doc(db, 'users', uid, 'clothes', itemId)
  const imageRef = doc(db, 'users', uid, 'clothesImages', itemId)
  const [itemSnapshot, imageSnapshot] = await Promise.all([getDoc(itemRef), getDoc(imageRef)])
  const backup = { item: itemSnapshot.data(), image: imageSnapshot.data() }
  const batch = writeBatch(db)
  batch.delete(itemRef)
  batch.delete(imageRef)
  await batch.commit()
  return backup
}

export async function restoreClothingItem(uid, itemId, backup) {
  const batch = writeBatch(db)
  batch.set(doc(db, 'users', uid, 'clothes', itemId), backup.item)
  if (backup.image) batch.set(doc(db, 'users', uid, 'clothesImages', itemId), backup.image)
  return batch.commit()
}

export async function saveOutfit(uid, outfit, outfitId) {
  const reference = outfitId ? doc(db, 'users', uid, 'outfits', outfitId) : doc(userCollection(uid, 'outfits'))
  await setDoc(reference, { ...outfit, updatedAt: serverTimestamp(), ...(outfitId ? {} : { createdAt: serverTimestamp() }) }, { merge: true })
  return reference.id
}

export function deleteOutfit(uid, outfitId) {
  return deleteDoc(doc(db, 'users', uid, 'outfits', outfitId))
}

export function assignOutfit(uid, date, outfitId) {
  return setDoc(doc(db, 'users', uid, 'outfitPlans', date), { outfitId, date, updatedAt: serverTimestamp() }, { merge: true })
}

export async function markPlannedOutfitWorn(uid, date, outfit) {
  const batch = writeBatch(db)
  outfit.items.forEach((item) => batch.update(doc(db, 'users', uid, 'clothes', item.itemId), { wearCount: increment(1), lastWornAt: serverTimestamp(), status: 'dirty', updatedAt: serverTimestamp() }))
  batch.set(doc(db, 'users', uid, 'outfitPlans', date), { outfitId: outfit.id, date, worn: true, wornAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true })
  return batch.commit()
}

export function removeOutfitPlan(uid, date) {
  return deleteDoc(doc(db, 'users', uid, 'outfitPlans', date))
}

export async function duplicateOutfit(uid, outfit) {
  const { id: _ID, createdAt: _CREATED, updatedAt: _UPDATED, ...copy } = outfit
  return addDoc(userCollection(uid, 'outfits'), { ...copy, name: `${outfit.name} · copie`, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
}
