import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { subscribeToOutfits, subscribeToPlans, subscribeToWardrobe } from '../services/wardrobe'

const WardrobeContext = createContext(null)

export function WardrobeProvider({ children }) {
  const { user } = useAuth()
  const [clothes, setClothes] = useState([])
  const [outfits, setOutfits] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.uid) return undefined
    const fail = () => { setError('Impossible de synchroniser Hwayj. Déployez les règles Firestore.'); setLoading(false) }
    const unsubscribeClothes = subscribeToWardrobe(user.uid, (value) => { setClothes(value); setLoading(false); setError('') }, fail)
    const unsubscribeOutfits = subscribeToOutfits(user.uid, setOutfits, fail)
    const unsubscribePlans = subscribeToPlans(user.uid, setPlans, fail)
    return () => { unsubscribeClothes(); unsubscribeOutfits(); unsubscribePlans() }
  }, [user?.uid])

  const value = useMemo(() => ({ clothes, outfits, plans, loading, error }), [clothes, error, loading, outfits, plans])
  return <WardrobeContext.Provider value={value}>{children}</WardrobeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWardrobe() {
  const context = useContext(WardrobeContext)
  if (!context) throw new Error('useWardrobe doit être utilisé dans WardrobeProvider')
  return context
}
