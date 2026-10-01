import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import HouseholdPage from './pages/HouseholdPage'
import LoadingScreen from './components/LoadingScreen'
import PlatformShell from './components/PlatformShell'
import { ShoppingProvider } from './context/ShoppingContext'
import AppErrorBoundary from './components/AppErrorBoundary'
import Brand from './components/Brand'
import { LockKeyhole, LogOut } from 'lucide-react'

function AppRoutes() {
  const { user, profile, household, dataError, initializing, signOut } = useAuth()

  if (initializing) return <LoadingScreen />

  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    )
  }

  if (!profile && dataError === 'Ce compte n’est pas autorisé à utiliser ce foyer.') {
    return <ClosedAccountPage onSignOut={signOut} />
  }

  if (!profile?.householdId || !household) {
    return (
      <Routes>
        <Route path="/household" element={<HouseholdPage />} />
        <Route path="*" element={<Navigate to="/household" replace />} />
      </Routes>
    )
  }

  return <ShoppingProvider><PlatformShell /></ShoppingProvider>
}

function ClosedAccountPage({ onSignOut }) {
  return <main className="grid min-h-dvh place-items-center bg-canvas p-5 text-ink"><section className="w-full max-w-md rounded-card bg-surface p-7 text-center shadow-card"><Brand /><span className="mx-auto mt-8 grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300"><LockKeyhole size={29} /></span><h1 className="mt-5 text-2xl font-black">Accès privé</h1><p className="mt-2 text-sm leading-6 text-muted">T9dya est réservée aux deux comptes déjà enregistrés dans ce foyer. La création de nouveaux comptes est fermée.</p><button type="button" onClick={onSignOut} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 font-extrabold text-white dark:bg-white dark:text-slate-900"><LogOut size={18} />Se déconnecter</button></section></main>
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </AppErrorBoundary>
  )
}
