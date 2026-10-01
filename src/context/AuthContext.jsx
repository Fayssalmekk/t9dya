import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth'
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
  const [accountClosed, setAccountClosed] = useState(false)

  useEffect(() => onAuthStateChanged(auth, (nextUser) => {
    setUser(nextUser)
    setProfile(null)
    setHousehold(null)
    setAccountClosed(false)
    setProfileLoading(Boolean(nextUser))
    setHouseholdLoading(false)
    setAuthLoading(false)
  }), [])

  useEffect(() => {
    if (!user) return undefined
    return onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        const nextProfile = { id: snapshot.id, ...snapshot.data() }
        setProfile(nextProfile)
        setAccountClosed(false)
        setHouseholdLoading(Boolean(nextProfile.householdId))
        if (!nextProfile.householdId) setHousehold(null)
        setDataError('')
      } else {
        setProfile(null)
        setHousehold(null)
        setAccountClosed(true)
        setDataError('Ce compte n’est pas autorisé à utiliser cette plateforme.')
      }
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
    accountClosed,
    initializing: authLoading || profileLoading || householdLoading,
    signIn: (email, password) => signInWithEmailAndPassword(auth, email.trim(), password),
    resetPassword: (email) => sendPasswordResetEmail(auth, email.trim()),
    signOut: () => firebaseSignOut(auth)
  }), [accountClosed, authLoading, dataError, household, householdLoading, profile, profileLoading, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth doit être utilisé dans AuthProvider')
  return context
}
