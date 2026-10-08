import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useShopping } from '../../../context/ShoppingContext'
import { addShoppingItem } from '../../../services/shopping'
import { ensureRequiredInsulins, subscribeAppointments, subscribeBadHabits, subscribeChecks, subscribeDoses, subscribeMeals, subscribeMedications, subscribeReadings, subscribeWater, updateMedication } from '../services/health'

const HealthContext = createContext(null)

export function HealthProvider({ children }) {
  const { user, household } = useAuth()
  const { lists, allItems } = useShopping()
  const healthProfiles = useMemo(() => (household?.members || []).map((uid) => household.memberProfiles?.[uid]).filter(Boolean), [household])
  const [requestedHealthOwnerId, setHealthOwnerId] = useState(() => new URLSearchParams(window.location.search).get('profile') || user?.uid || '')
  const healthOwnerId = healthProfiles.some((member) => member.uid === requestedHealthOwnerId) ? requestedHealthOwnerId : (healthProfiles.some((member) => member.uid === user?.uid) ? user.uid : healthProfiles[0]?.uid || '')
  const activeHealthProfile = healthProfiles.find((member) => member.uid === healthOwnerId) || healthProfiles[0] || null
  const addingToShopping = useRef(new Set())
  const [readings, setReadings] = useState([])
  const [doses, setDoses] = useState([])
  const [medications, setMedications] = useState([])
  const [checks, setChecks] = useState([])
  const [appointments, setAppointments] = useState([])
  const [meals, setMeals] = useState([])
  const [waterEntries, setWaterEntries] = useState([])
  const [badHabits, setBadHabits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!healthOwnerId) return undefined
    if (activeHealthProfile?.diabetic) ensureRequiredInsulins(healthOwnerId).catch(() => setError('Impossible d’initialiser les insulines. Déployez les règles Firebase.'))
    const fail = () => { setError('Impossible de synchroniser les données santé.'); setLoading(false) }
    const diabetesSubscriptions = activeHealthProfile?.diabetic ? [
      subscribeReadings(healthOwnerId, (value) => setReadings(value.map((item) => ({ ...item, healthOwnerId }))), fail),
      subscribeDoses(healthOwnerId, (value) => setDoses(value.map((item) => ({ ...item, healthOwnerId }))), fail)
    ] : []
    const subscriptions = [
      ...diabetesSubscriptions,
      subscribeMedications(healthOwnerId, (value) => { setMedications(value.map((item) => ({ ...item, healthOwnerId }))); setLoading(false); setError('') }, fail),
      subscribeChecks(healthOwnerId, (value) => setChecks(value.map((item) => ({ ...item, healthOwnerId }))), fail), subscribeAppointments(healthOwnerId, (value) => setAppointments(value.map((item) => ({ ...item, healthOwnerId }))), fail), subscribeMeals(healthOwnerId, (value) => setMeals(value.map((item) => ({ ...item, healthOwnerId }))), fail), subscribeWater(healthOwnerId, (value) => setWaterEntries(value.map((item) => ({ ...item, healthOwnerId }))), fail), subscribeBadHabits(healthOwnerId, (value) => setBadHabits(value.map((item) => ({ ...item, healthOwnerId }))), fail)
    ]
    return () => subscriptions.forEach((unsubscribe) => unsubscribe())
  }, [activeHealthProfile?.diabetic, healthOwnerId])

  const selectedData = useMemo(() => ({
    readings: readings.filter((item) => item.healthOwnerId === healthOwnerId),
    doses: doses.filter((item) => item.healthOwnerId === healthOwnerId),
    medications: medications.filter((item) => item.healthOwnerId === healthOwnerId),
    checks: checks.filter((item) => item.healthOwnerId === healthOwnerId),
    appointments: appointments.filter((item) => item.healthOwnerId === healthOwnerId),
    meals: meals.filter((item) => item.healthOwnerId === healthOwnerId),
    waterEntries: waterEntries.filter((item) => item.healthOwnerId === healthOwnerId),
    badHabits: badHabits.filter((item) => item.healthOwnerId === healthOwnerId)
  }), [appointments, badHabits, checks, doses, healthOwnerId, meals, medications, readings, waterEntries])

  useEffect(() => {
    const activeLists = lists.filter((list) => list.status !== 'completed')
    if (!user?.uid || !healthOwnerId || !household?.id || activeLists.length !== 1) return
    const listId = activeLists[0].id
    selectedData.medications.filter((medication) => activeHealthProfile?.diabetic || medication.kind !== 'insulin').forEach(async (medication) => {
      const medicationKey = `${healthOwnerId}:${medication.id}`
      if (medication.stock > medication.lowStockThreshold && medication.shoppingAdded) {
        await updateMedication(healthOwnerId, medication.id, { shoppingAdded: false }).catch(() => {})
        return
      }
      if (!medication.stockInitialized || medication.stock > medication.lowStockThreshold || medication.shoppingAdded || addingToShopping.current.has(medicationKey)) return
      addingToShopping.current.add(medicationKey)
      const productId = `pharmacy-${medication.id}`
      const duplicate = allItems.find((item) => item.listId === listId && item.productId === productId)
      try {
        if (!duplicate) await addShoppingItem(household.id, listId, { id: productId, name: medication.name, altName: '', brand: '', format: '', category: 'pharmacie', categoryName: 'Pharmacie & Santé', emoji: medication.kind === 'insulin' ? '💉' : '💊', defaultPrice: 0, unit: medication.unit }, user, { quantity: 1, unit: medication.unit, note: 'Ajout automatique · stock faible S7a ya s7a' }, null)
        await updateMedication(healthOwnerId, medication.id, { shoppingAdded: true })
      } catch { /* The in-app stock alert remains visible for a manual retry. */ } finally { addingToShopping.current.delete(medicationKey) }
    })
  }, [activeHealthProfile?.diabetic, allItems, healthOwnerId, household?.id, lists, selectedData.medications, user])

  const value = useMemo(() => ({ ...selectedData, loading, error, healthProfiles, healthOwnerId, setHealthOwnerId, activeHealthProfile }), [activeHealthProfile, error, healthOwnerId, healthProfiles, loading, selectedData])
  return <HealthContext.Provider value={value}>{children}</HealthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useHealth() {
  const context = useContext(HealthContext)
  if (!context) throw new Error('useHealth doit être utilisé dans HealthProvider')
  return context
}
