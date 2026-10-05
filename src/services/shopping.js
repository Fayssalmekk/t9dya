import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch
} from 'firebase/firestore'
import { db } from './firebase'

const householdCollection = (householdId, name) => collection(db, 'households', householdId, name)
export const DEFAULT_LIST_ID = 'inbox'

const normalizeItemName = (value) => String(value || '').trim().toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const quickProductId = (name) => {
  let hash = 2166136261
  for (const character of normalizeItemName(name)) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return `quick-${(hash >>> 0).toString(36)}`
}

export async function ensureDefaultShoppingList(householdId, userId, activeListId) {
  const listRef = doc(db, 'households', householdId, 'lists', DEFAULT_LIST_ID)
  const listSnapshot = await getDoc(listRef)
  if (listSnapshot.exists() && activeListId === DEFAULT_LIST_ID) return DEFAULT_LIST_ID

  const batch = writeBatch(db)
  if (!listSnapshot.exists()) {
    batch.set(listRef, {
      title: 'Liste partagée',
      plannedFor: Timestamp.now(),
      status: 'active',
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  }
  if (activeListId !== DEFAULT_LIST_ID) {
    batch.update(doc(db, 'households', householdId), {
      activeListId: DEFAULT_LIST_ID,
      updatedAt: serverTimestamp()
    })
  }
  await batch.commit()
  return DEFAULT_LIST_ID
}

export async function addQuickTextItem(householdId, user, name, duplicate) {
  const cleanName = String(name || '').trim().replace(/\s+/g, ' ').slice(0, 100)
  if (!cleanName) throw new Error('ITEM_NAME_REQUIRED')
  if (duplicate) {
    await updateDoc(doc(db, 'households', householdId, 'items', duplicate.id), {
      quantity: increment(1),
      bought: false,
      status: duplicate.addedBy === user.uid ? duplicate.status : 'proposed',
      lastModifiedBy: user.uid,
      updatedAt: serverTimestamp()
    })
    return { id: duplicate.id, merged: true }
  }

  const reference = await addDoc(householdCollection(householdId, 'items'), {
    listId: DEFAULT_LIST_ID,
    productId: quickProductId(cleanName),
    name: cleanName,
    brand: '',
    format: '',
    altName: '',
    category: 'quick',
    categoryName: '',
    emoji: '',
    quantity: 1,
    unit: 'pièce',
    note: '',
    estimatedPrice: 0,
    addedBy: user.uid,
    lastModifiedBy: user.uid,
    status: 'proposed',
    bought: false,
    quickEntry: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  return { id: reference.id, merged: false }
}

export async function removeExpiredBoughtItems(householdId, itemIds) {
  const ids = [...new Set(itemIds)].filter(Boolean)
  for (let start = 0; start < ids.length; start += 400) {
    const batch = writeBatch(db)
    ids.slice(start, start + 400).forEach((itemId) => batch.delete(doc(db, 'households', householdId, 'items', itemId)))
    await batch.commit()
  }
}

export async function addShoppingItem(householdId, listId, product, user, details, duplicate) {
  if (duplicate) {
    await updateDoc(doc(db, 'households', householdId, 'items', duplicate.id), {
      quantity: increment(details.quantity),
      unit: details.unit,
      note: details.note || duplicate.note || '',
      status: duplicate.addedBy === user.uid ? duplicate.status : 'proposed',
      lastModifiedBy: user.uid,
      updatedAt: serverTimestamp()
    })
    return { id: duplicate.id, merged: true }
  }

  const item = {
    listId,
    productId: product.id,
    name: product.name,
    brand: product.brand || '',
    format: product.format || '',
    altName: product.altName || '',
    category: product.category,
    categoryName: product.categoryName,
    emoji: product.emoji || '🛒',
    quantity: details.quantity,
    unit: details.unit,
    note: details.note || '',
    estimatedPrice: Number(product.defaultPrice) || 0,
    addedBy: user.uid,
    lastModifiedBy: user.uid,
    status: 'proposed',
    bought: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }
  const reference = await addDoc(householdCollection(householdId, 'items'), item)
  return { id: reference.id, merged: false }
}

export async function validateItem(householdId, itemId, userId) {
  return updateDoc(doc(db, 'households', householdId, 'items', itemId), {
    status: 'validated',
    validatedBy: userId,
    validatedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
}

export async function validateMany(householdId, items, userId) {
  const batch = writeBatch(db)
  items.forEach((item) => batch.update(doc(db, 'households', householdId, 'items', item.id), {
    status: 'validated',
    validatedBy: userId,
    validatedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }))
  return batch.commit()
}

export async function updateShoppingItem(householdId, itemId, changes, userId) {
  return updateDoc(doc(db, 'households', householdId, 'items', itemId), {
    ...changes,
    status: 'proposed',
    lastModifiedBy: userId,
    updatedAt: serverTimestamp()
  })
}

export async function adjustShoppingItemQuantity(householdId, itemId, amount, userId) {
  return updateDoc(doc(db, 'households', householdId, 'items', itemId), {
    quantity: increment(amount),
    status: 'proposed',
    lastModifiedBy: userId,
    updatedAt: serverTimestamp()
  })
}

export async function removeShoppingItem(householdId, itemId) {
  return deleteDoc(doc(db, 'households', householdId, 'items', itemId))
}

export async function restoreShoppingItem(householdId, item) {
  const { id, ...data } = item
  return setDoc(doc(db, 'households', householdId, 'items', id), {
    ...data,
    restoredAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
}

export async function markItemBought(householdId, item, userId, purchase) {
  const now = Timestamp.now()
  const purchaseRef = doc(householdCollection(householdId, 'purchases'))
  const itemRef = doc(db, 'households', householdId, 'items', item.id)
  const historyRef = doc(db, 'households', householdId, 'priceHistory', item.productId)
  const historySnapshot = await getDoc(historyRef)
  const previousEntries = historySnapshot.exists() ? historySnapshot.data().entries || [] : []
  const price = purchase.skipPrice ? null : Number(purchase.price)
  const entry = price === null ? null : { purchaseId: purchaseRef.id, price, store: purchase.store, date: now, boughtBy: userId }
  const entries = entry ? [entry, ...previousEntries].slice(0, 12) : previousEntries.slice(0, 12)
  const batch = writeBatch(db)

  batch.set(purchaseRef, {
    listId: item.listId || null,
    productId: item.productId,
    itemName: item.name,
    category: item.category,
    categoryName: item.categoryName,
    emoji: item.emoji,
    quantity: item.quantity,
    unit: item.unit,
    price,
    store: purchase.store,
    note: purchase.note || '',
    boughtBy: userId,
    purchasedAt: serverTimestamp()
  })
  batch.update(itemRef, {
    bought: true,
    boughtBy: userId,
    boughtAt: serverTimestamp(),
    purchaseId: purchaseRef.id,
    paidPrice: price,
    store: purchase.store,
    updatedAt: serverTimestamp()
  })
  batch.set(historyRef, {
    productId: item.productId,
    productName: item.name,
    lastPrice: price ?? historySnapshot.data()?.lastPrice ?? item.estimatedPrice,
    lastStore: purchase.store,
    entries,
    updatedAt: serverTimestamp()
  }, { merge: true })
  batch.update(doc(db, 'households', householdId), {
    lastUsedStore: purchase.store,
    updatedAt: serverTimestamp()
  })

  await batch.commit()
  return purchaseRef.id
}

export async function createShoppingList(householdId, userId, title, plannedFor, legacyItems = []) {
  const listRef = doc(collection(db, 'households', householdId, 'lists'))
  const batch = writeBatch(db)
  batch.set(listRef, {
    title: title.trim() || 'Nouvelle course',
    plannedFor: plannedFor ? Timestamp.fromDate(new Date(`${plannedFor}T12:00:00`)) : Timestamp.now(),
    status: 'active',
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  legacyItems.filter((item) => !item.listId).forEach((item) => {
    batch.update(doc(db, 'households', householdId, 'items', item.id), { listId: listRef.id, updatedAt: serverTimestamp() })
  })
  batch.update(doc(db, 'households', householdId), { activeListId: listRef.id, updatedAt: serverTimestamp() })
  await batch.commit()
  return listRef.id
}

export async function selectShoppingList(householdId, listId) {
  return updateDoc(doc(db, 'households', householdId), { activeListId: listId, updatedAt: serverTimestamp() })
}

export async function requestShoppingRun(householdId, listId, requestedBy, assignedTo) {
  const batch = writeBatch(db)
  batch.update(doc(db, 'households', householdId, 'lists', listId), {
    status: 'requested',
    requestedBy,
    assignedTo,
    shoppingRequestedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  batch.update(doc(db, 'households', householdId), { activeListId: listId, updatedAt: serverTimestamp() })
  return batch.commit()
}

export async function startShoppingRun(householdId, listId, userId) {
  return updateDoc(doc(db, 'households', householdId, 'lists', listId), {
    status: 'shopping',
    startedBy: userId,
    startedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
}

export async function finishShoppingList(householdId, list, items, userId, fallbackListId = null) {
  const bought = items.filter((item) => item.bought)
  const remaining = items.filter((item) => !item.bought)
  const batch = writeBatch(db)
  const total = bought.reduce((sum, item) => sum + (Number.isFinite(item.paidPrice) ? item.paidPrice : 0), 0)

  batch.update(doc(db, 'households', householdId, 'lists', list.id), {
    status: 'completed',
    completedBy: userId,
    completedAt: serverTimestamp(),
    summary: {
      itemCount: items.length,
      boughtCount: bought.length,
      remainingCount: remaining.length,
      total,
      stores: [...new Set(bought.map((item) => item.store).filter(Boolean))],
      items: items.map((item) => ({
        productId: item.productId,
        name: item.name,
        brand: item.brand || '',
        emoji: item.emoji,
        quantity: item.quantity,
        unit: item.unit,
        bought: item.bought,
        paidPrice: item.paidPrice ?? null
      }))
    },
    updatedAt: serverTimestamp()
  })

  items.forEach((item) => batch.delete(doc(db, 'households', householdId, 'items', item.id)))
  batch.update(doc(db, 'households', householdId), {
    activeListId: fallbackListId || deleteField(),
    updatedAt: serverTimestamp()
  })
  await batch.commit()
  return fallbackListId
}

export async function deleteShoppingList(householdId, list, items, fallbackListId, isCurrentList) {
  const batch = writeBatch(db)

  batch.delete(doc(db, 'households', householdId, 'lists', list.id))
  items.forEach((item) => batch.delete(doc(db, 'households', householdId, 'items', item.id)))

  if (isCurrentList) {
    batch.update(doc(db, 'households', householdId), {
      activeListId: fallbackListId || deleteField(),
      updatedAt: serverTimestamp()
    })
  }

  await batch.commit()
  return fallbackListId || null
}

export async function unmarkItemBought(householdId, item) {
  const itemRef = doc(db, 'households', householdId, 'items', item.id)
  const historyRef = doc(db, 'households', householdId, 'priceHistory', item.productId)
  const historySnapshot = await getDoc(historyRef)
  const batch = writeBatch(db)

  batch.update(itemRef, {
    bought: false,
    boughtBy: deleteField(),
    boughtAt: deleteField(),
    purchaseId: deleteField(),
    paidPrice: deleteField(),
    store: deleteField(),
    updatedAt: serverTimestamp()
  })

  if (item.purchaseId) {
    batch.delete(doc(db, 'households', householdId, 'purchases', item.purchaseId))
  }

  if (historySnapshot.exists() && item.purchaseId) {
    let removedLegacyEntry = false
    const remainingEntries = (historySnapshot.data().entries || []).filter((entry) => {
      if (entry.purchaseId === item.purchaseId) return false
      const isLegacyMatch = !entry.purchaseId
        && !removedLegacyEntry
        && entry.price === item.paidPrice
        && entry.store === item.store
      if (isLegacyMatch) removedLegacyEntry = true
      return !isLegacyMatch
    })
    batch.set(historyRef, {
      entries: remainingEntries,
      lastPrice: remainingEntries[0]?.price ?? item.estimatedPrice ?? 0,
      lastStore: remainingEntries[0]?.store ?? null,
      updatedAt: serverTimestamp()
    }, { merge: true })
  }

  await batch.commit()
}

export async function setMonthlyBudget(householdId, monthly) {
  return updateDoc(doc(db, 'households', householdId), {
    'budget.monthly': Number(monthly),
    updatedAt: serverTimestamp()
  })
}

export async function createCustomProduct(householdId, userId, product) {
  const productRef = doc(collection(db, 'households', householdId, 'customProducts'))
  const data = {
    name: product.name.trim(),
    altName: product.altName.trim(),
    brand: product.brand.trim(),
    format: product.format.trim(),
    category: product.category,
    categoryName: product.categoryName,
    emoji: product.emoji,
    unit: product.unit,
    defaultPrice: Number(product.defaultPrice) || 0,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }
  await setDoc(productRef, data)
  return { id: `custom-${productRef.id}`, customDocId: productRef.id, isCustom: true, ...data }
}
