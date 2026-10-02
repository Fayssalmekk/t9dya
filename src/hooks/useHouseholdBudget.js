import { useEffect, useRef, useState } from 'react'
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../services/firebase'
import { initializeHouseholdBudget } from '../services/budget'

const byPosition = (first, second) => (first.position ?? 999) - (second.position ?? 999)

export function useHouseholdBudget(household, userId) {
  const householdId = household?.id
  const [charges, setCharges] = useState([])
  const [envelopes, setEnvelopes] = useState([])
  const [payments, setPayments] = useState([])
  const [movements, setMovements] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const setupStarted = useRef(false)

  useEffect(() => {
    if (!householdId || !userId || household.budget?.plannerVersion >= 1 || setupStarted.current) return
    setupStarted.current = true
    initializeHouseholdBudget(householdId, userId).catch(() => {
      setError('Impossible de préparer vos charges et enveloppes. Déployez les dernières règles Firebase puis rechargez la page.')
    })
  }, [household.budget?.plannerVersion, householdId, userId])

  useEffect(() => {
    if (!householdId) return undefined
    let waiting = 5
    const loaded = () => {
      waiting -= 1
      if (waiting === 0) setLoading(false)
    }
    const failed = () => {
      setError('Impossible de charger le budget du foyer. Déployez les dernières règles Firebase.')
      setLoading(false)
    }
    const basePath = ['households', householdId]
    const unsubscribeCharges = onSnapshot(collection(db, ...basePath, 'charges'), (snapshot) => {
      setCharges(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).filter((item) => item.active !== false).sort(byPosition))
      loaded()
    }, failed)
    const unsubscribeEnvelopes = onSnapshot(collection(db, ...basePath, 'envelopes'), (snapshot) => {
      setEnvelopes(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).filter((item) => item.active !== false).sort(byPosition))
      loaded()
    }, failed)
    const unsubscribePayments = onSnapshot(collection(db, ...basePath, 'chargePayments'), (snapshot) => {
      setPayments(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))
      loaded()
    }, failed)
    const movementsQuery = query(collection(db, ...basePath, 'envelopeTransactions'), orderBy('createdAt', 'desc'), limit(60))
    const unsubscribeMovements = onSnapshot(movementsQuery, (snapshot) => {
      setMovements(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))
      loaded()
    }, failed)
    const expensesQuery = query(collection(db, ...basePath, 'expenses'), orderBy('spentOn', 'desc'), limit(250))
    const unsubscribeExpenses = onSnapshot(expensesQuery, (snapshot) => {
      setExpenses(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))
      loaded()
    }, failed)

    return () => {
      unsubscribeCharges()
      unsubscribeEnvelopes()
      unsubscribePayments()
      unsubscribeMovements()
      unsubscribeExpenses()
    }
  }, [householdId])

  return { charges, envelopes, payments, movements, expenses, loading, error }
}
