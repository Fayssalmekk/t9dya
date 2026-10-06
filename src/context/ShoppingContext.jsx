import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useAuth } from './AuthContext'
import { db } from '../services/firebase'
import { isNativeApp } from '../native/capacitor'
import { DEFAULT_LIST_ID, ensureDefaultShoppingList, removeExpiredBoughtItems } from '../services/shopping'

const ShoppingContext = createContext(null)

const timeValue = (value) => value?.toMillis?.() || 0
const BOUGHT_ITEM_LIFETIME = 24 * 60 * 60 * 1000

export function ShoppingProvider({ children }) {
  const { household, user } = useAuth()
  const [allItems, setAllItems] = useState([])
  const [lists, setLists] = useState([])
  const [customProducts, setCustomProducts] = useState([])
  const [purchases, setPurchases] = useState([])
  const [itemsLoading, setItemsLoading] = useState(true)
  const [purchasesLoading, setPurchasesLoading] = useState(true)
  const [listsLoading, setListsLoading] = useState(true)
  const [error, setError] = useState('')
  const ensuredHouseholdRef = useRef('')

  useEffect(() => {
    if (!household?.id) return undefined
    return onSnapshot(collection(db, 'households', household.id, 'items'), (snapshot) => {
      const nextItems = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
      nextItems.sort((a, b) => timeValue(b.createdAt) - timeValue(a.createdAt))
      const expiryTime = Date.now() - BOUGHT_ITEM_LIFETIME
      const expiredBoughtItems = nextItems.filter((item) => item.bought && timeValue(item.boughtAt) > 0 && timeValue(item.boughtAt) <= expiryTime)
      setAllItems(nextItems.filter((item) => !expiredBoughtItems.some((expired) => expired.id === item.id)))
      if (expiredBoughtItems.length) removeExpiredBoughtItems(household.id, expiredBoughtItems.map((item) => item.id)).catch(() => {})
      setItemsLoading(false)
      setError('')
    }, () => {
      setItemsLoading(false)
      setError('La liste ne peut pas être synchronisée pour le moment.')
    })
  }, [household?.id])

  useEffect(() => {
    if (!household?.id || !user?.uid || listsLoading || ensuredHouseholdRef.current === household.id) return
    ensuredHouseholdRef.current = household.id
    ensureDefaultShoppingList(household.id, user.uid, household.activeListId).catch(() => {
      ensuredHouseholdRef.current = ''
      setError('Impossible de préparer la liste partagée pour le moment.')
    })
  }, [household?.activeListId, household?.id, listsLoading, user?.uid])

  useEffect(() => {
    if (!household?.id) return undefined
    const customProductsQuery = query(collection(db, 'households', household.id, 'customProducts'), orderBy('createdAt', 'desc'))
    return onSnapshot(customProductsQuery, (snapshot) => {
      setCustomProducts(snapshot.docs.map((product) => ({
        id: `custom-${product.id}`,
        customDocId: product.id,
        isCustom: true,
        ...product.data()
      })))
    }, () => setError('Impossible de charger vos produits personnalisés.'))
  }, [household?.id])

  useEffect(() => {
    if (!household?.id) return undefined
    const listsQuery = query(collection(db, 'households', household.id, 'lists'), orderBy('createdAt', 'desc'))
    return onSnapshot(listsQuery, (snapshot) => {
      setLists(snapshot.docs.map((list) => ({ id: list.id, ...list.data() })))
      setListsLoading(false)
    }, () => setListsLoading(false))
  }, [household?.id])

  useEffect(() => {
    if (!household?.id) return undefined
    const purchasesQuery = query(
      collection(db, 'households', household.id, 'purchases'),
      orderBy('purchasedAt', 'desc'),
      limit(250)
    )
    return onSnapshot(purchasesQuery, (snapshot) => {
      setPurchases(snapshot.docs.map((purchase) => ({ id: purchase.id, ...purchase.data() })))
      setPurchasesLoading(false)
    }, () => setPurchasesLoading(false))
  }, [household?.id])

  const activeList = useMemo(() => lists.find((list) => list.id === DEFAULT_LIST_ID)
    || { id: DEFAULT_LIST_ID, title: 'Liste partagée', status: 'active' }, [lists])
  const items = allItems
  const incomingRequest = lists.find((list) => list.assignedTo === user?.uid && list.status === 'requested') || null

  useEffect(() => {
    if (isNativeApp || !incomingRequest?.shoppingRequestedAt || typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    const requestKey = `${incomingRequest.id}-${incomingRequest.shoppingRequestedAt.toMillis?.() || ''}`
    if (localStorage.getItem('t9dya-last-shopping-request') === requestKey) return
    localStorage.setItem('t9dya-last-shopping-request', requestKey)
    new Notification('T9dya · Course à faire 🛒', {
      body: `${incomingRequest.title} vous attend.`,
      icon: '/t9dya-icon.svg',
      tag: requestKey
    })
    navigator.vibrate?.([80, 40, 80])
  }, [incomingRequest])

  const value = useMemo(() => ({
    items,
    allItems,
    lists,
    customProducts,
    activeList,
    incomingRequest,
    purchases,
    loading: itemsLoading || listsLoading,
    purchasesLoading,
    error,
    activeItems: items.filter((item) => !item.bought),
    boughtItems: items.filter((item) => item.bought)
  }), [activeList, allItems, customProducts, error, incomingRequest, items, itemsLoading, lists, listsLoading, purchases, purchasesLoading])

  return <ShoppingContext.Provider value={value}>{children}</ShoppingContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useShopping() {
  const context = useContext(ShoppingContext)
  if (!context) throw new Error('useShopping doit être utilisé dans ShoppingProvider')
  return context
}
