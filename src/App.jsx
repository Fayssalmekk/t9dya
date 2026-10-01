import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import HouseholdPage from './pages/HouseholdPage'
import LoadingScreen from './components/LoadingScreen'
import PlatformShell from './components/PlatformShell'
import { ShoppingProvider } from './context/ShoppingContext'
import AppErrorBoundary from './components/AppErrorBoundary'

function AppRoutes() {
  const { user, profile, household, initializing } = useAuth()

  if (initializing) return <LoadingScreen />

  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    )
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

export default function App() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </AppErrorBoundary>
  )
}
