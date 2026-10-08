import { useEffect, useState } from 'react'
import { collection, doc, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { db } from '../../services/firebase'

export default function useCarData(home) {
  const [data, setData] = useState({ vehicle: null, tasks: [], services: [], aiServices: [], aiPlan: null, mileage: [], expenses: [], envelopes: [], salaryMonths: [], loaded: [], error: '' })
  useEffect(() => {
    const base = ['households', home]
    const definitions = [
      ['vehicle', doc(db, ...base, 'vehicles', 'main')],
      ['tasks', collection(db, ...base, 'vehicleTasks')],
      ['services', collection(db, ...base, 'vehicleServices')],
      ['aiServices', collection(db, ...base, 'vehicleAiServices')],
      ['aiPlan', doc(db, ...base, 'vehicleAiPlans', 'current')],
      ['mileage', query(collection(db, ...base, 'vehicleMileage'), orderBy('createdAt', 'desc'), limit(50))],
      // Category equality only: no composite index, no truncation by other budget categories.
      ['expenses', query(collection(db, ...base, 'expenses'), where('category', '==', 'car'))],
      ['envelopes', collection(db, ...base, 'envelopes')],
      ['salaryMonths', collection(db, ...base, 'salaryMonths')]
    ]
    const unsubscribes = definitions.map(([key, target]) => onSnapshot(target, (snapshot) => {
      const value = key === 'vehicle' || key === 'aiPlan' ? (snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } : null) : snapshot.docs.map((item) => ({ ...item.data(), id: item.id }))
      setData((current) => ({ ...current, [key]: value, loaded: [...new Set([...current.loaded, key])] }))
    }, () => setData((current) => ({ ...current, error: 'Impossible de charger cet espace. Vérifiez la connexion et déployez les règles Firebase Voiture.' }))))
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe())
  }, [home])
  return { ...data, loading: data.loaded.length < 9 }
}
