import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { useAuth } from './AuthContext'
import { db } from '../services/firebase'

const PresenceContext = createContext(null)
const ONLINE_TIMEOUT = 130000
const HEARTBEAT_DELAY = 60000

export function PresenceProvider({ children }) {
  const { household, user } = useAuth()
  const partnerId = household.members.find((memberId) => memberId !== user.uid)
  const partner = household.memberProfiles?.[partnerId] || null
  const [partnerStatus, setPartnerStatus] = useState(null)
  const [clock, setClock] = useState(0)

  useEffect(() => {
    if (!household.id || !user.uid) return undefined
    const ownPresenceRef = doc(db, 'households', household.id, 'presence', user.uid)
    const updatePresence = (state) => setDoc(ownPresenceRef, {
      uid: user.uid,
      state,
      lastSeen: serverTimestamp()
    }, { merge: true }).catch(() => {})
    const reportVisibility = () => updatePresence(document.visibilityState === 'visible' ? 'online' : 'away')

    reportVisibility()
    const heartbeat = window.setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) updatePresence('online')
    }, HEARTBEAT_DELAY)
    document.addEventListener('visibilitychange', reportVisibility)
    window.addEventListener('online', reportVisibility)
    window.addEventListener('pagehide', reportVisibility)

    return () => {
      window.clearInterval(heartbeat)
      document.removeEventListener('visibilitychange', reportVisibility)
      window.removeEventListener('online', reportVisibility)
      window.removeEventListener('pagehide', reportVisibility)
    }
  }, [household.id, user.uid])

  useEffect(() => {
    if (!household.id || !partnerId) return undefined
    return onSnapshot(doc(db, 'households', household.id, 'presence', partnerId), (snapshot) => {
      setPartnerStatus(snapshot.exists() ? snapshot.data() : null)
      setClock(Date.now())
    }, () => setPartnerStatus(null))
  }, [household.id, partnerId])

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 30000)
    return () => window.clearInterval(timer)
  }, [])

  const value = useMemo(() => {
    const currentStatus = partnerStatus?.uid === partnerId ? partnerStatus : null
    const lastSeen = currentStatus?.lastSeen?.toDate?.() || null
    const online = currentStatus?.state === 'online' && lastSeen && clock - lastSeen.getTime() < ONLINE_TIMEOUT
    return { partner, online: Boolean(online), lastSeen }
  }, [clock, partner, partnerId, partnerStatus])

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePresence() {
  const context = useContext(PresenceContext)
  if (!context) throw new Error('usePresence doit être utilisé dans PresenceProvider')
  return context
}
