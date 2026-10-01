import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth'
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
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
        await setDoc(profileRef, {
          uid: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || 'Membre',
          email: user.email || '',
          householdId: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      }
      setDataError('')
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
    signUp: async (name, email, password) => {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password)
      const displayName = name.trim()
      await updateProfile(credential.user, { displayName })
      await setDoc(doc(db, 'users', credential.user.uid), {
        uid: credential.user.uid,
        displayName,
        email: credential.user.email,
        householdId: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      return credential.user
    },
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
