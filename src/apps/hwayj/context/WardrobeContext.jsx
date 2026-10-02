import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { subscribeToOutfits, subscribeToWardrobe } from '../services/wardrobe'

const WardrobeContext = createContext(null)

export function WardrobeProvider({ children }) {
  const { user, household } = useAuth()
  const [selectedOwnerId, setSelectedOwnerId] = useState(() => user?.uid || '')
  const [clothes, setClothes] = useState([])
  const [outfits, setOutfits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const ownerId = household?.members?.includes(selectedOwnerId) ? selectedOwnerId : user?.uid
  const ownerProfile = household?.memberProfiles?.[ownerId] || (ownerId && ownerId === user?.uid ? { uid: user.uid, displayName: user.displayName || user.email?.split('@')[0] || 'Moi' } : null)
  const isOwnWardrobe = ownerId === user?.uid

  useEffect(() => {
    if (!ownerId) return undefined
    const fail = () => {
      setError('Impossible de synchroniser ce dressing. Déployez les dernières règles Firestore.')
      setLoading(false)
    }
    const unsubscribeClothes = subscribeToWardrobe(ownerId, (value) => {
      setClothes(value)
      setLoading(false)
      setError('')
    }, fail)
    const unsubscribeOutfits = subscribeToOutfits(ownerId, setOutfits, fail)
    return () => {
      unsubscribeClothes()
      unsubscribeOutfits()
    }
  }, [ownerId])

  const selectOwner = useCallback((uid) => {
    if (!household?.members?.includes(uid) || uid === ownerId) return
    setClothes([])
    setOutfits([])
    setError('')
    setLoading(true)
    setSelectedOwnerId(uid)
  }, [household?.members, ownerId])

  const value = useMemo(() => ({
    clothes,
    outfits,
    loading,
    error,
    ownerId,
    ownerProfile,
    isOwnWardrobe,
    selectOwner,
  }), [clothes, error, isOwnWardrobe, loading, outfits, ownerId, ownerProfile, selectOwner])

  return <WardrobeContext.Provider value={value}>{children}</WardrobeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWardrobe() {
  const context = useContext(WardrobeContext)
  if (!context) throw new Error('useWardrobe doit être utilisé dans WardrobeProvider')
  return context
}
