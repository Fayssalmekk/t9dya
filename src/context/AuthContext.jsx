import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../services/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [household, setHousehold] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [householdLoading, setHouseholdLoading] = useState(false)
  const [dataError, setDataError] = useState('')

  useEffect(() => onAuthStateChanged(auth, (nextUser) => {
    setUser(nextUser)
    setProfile(null)
    setHousehold(null)
    setProfileLoading(Boolean(nextUser))
    setHouseholdLoading(false)
    setAuthLoading(false)
  }), [])

  useEffect(() => {
    if (!user) return undefined

    const profileRef = doc(db, 'users', user.uid)

    return onSnapshot(profileRef, async (snapshot) => {
      if (snapshot.exists()) {
        const nextProfile = { id: snapshot.id, ...snapshot.data() }
        setProfile(nextProfile)
        setHouseholdLoading(Boolean(nextProfile.householdId))
        if (!nextProfile.householdId) setHousehold(null)
      } else {
        setProfile(null)
        setHousehold(null)
        setDataError('Ce compte n’est pas autorisé à utiliser ce foyer.')
      }
      if (snapshot.exists()) setDataError('')
      setProfileLoading(false)
    }, () => {
      setDataError('Impossible de charger votre profil. Vérifiez Firestore et ses règles.')
      setProfileLoading(false)
    })
  }, [user])

  useEffect(() => {
    const householdId = profile?.householdId
    if (!user || !householdId) return undefined

    return onSnapshot(doc(db, 'households', householdId), (snapshot) => {
      setHousehold(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null)
      setDataError(snapshot.exists() ? '' : 'Ce foyer est introuvable.')
      setHouseholdLoading(false)
    }, () => {
      setHousehold(null)
      setDataError('Impossible de charger le foyer. Déployez les dernières règles Firestore.')
      setHouseholdLoading(false)
    })
  }, [profile?.householdId, user])

  const value = useMemo(() => ({
    user,
    profile,
    household,
    dataError,
    initializing: authLoading || profileLoading || householdLoading,
    signIn: (email, password) => signInWithEmailAndPassword(auth, email.trim(), password),
    resetPassword: (email) => sendPasswordResetEmail(auth, email.trim()),
    signOut: () => firebaseSignOut(auth)
  }), [authLoading, dataError, household, householdLoading, profile, profileLoading, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth doit être utilisé dans AuthProvider')
  return context
}
