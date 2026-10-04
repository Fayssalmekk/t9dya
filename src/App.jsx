import { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { LockKeyhole, LogOut } from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { appRegistry, HubPage, HubSettingsPage } from './apps/registry'
import AppErrorBoundary from './components/AppErrorBoundary'
import AuthPage from './pages/AuthPage'
import Brand from './components/Brand'
import LoadingScreen from './components/LoadingScreen'
import { I18nProvider } from './i18n/I18nContext'
import NotificationCoordinator from './native/NotificationCoordinator'
import LocationCoordinator from './native/LocationCoordinator'
import PortalTopBar from './components/PortalTopBar'

const legacyRoutes = ['list', 'catalog', 'history']

function AppRoutes() {
  const { user, profile, household, accountClosed, initializing, signOut } = useAuth()
  if (initializing) return <LoadingScreen />
  if (!user) return <Routes><Route path="/auth" element={<AuthPage />} /><Route path="*" element={<Navigate to="/auth" replace />} /></Routes>
  if (accountClosed || !profile) return <ClosedAccountPage onSignOut={signOut} />
  if (!profile.householdId || !household) return <Suspense fallback={<LoadingScreen />}><Routes><Route path="/" element={<HubPage />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></Suspense>
  return <><PortalTopBar /><Suspense fallback={<LoadingScreen />}><Routes>{appRegistry.filter((app) => app.enabled).map(({ id, basePath, component: AppComponent }) => <Route key={id} path={`${basePath}/*`} element={<AppComponent />} />)}{legacyRoutes.map((path) => <Route key={path} path={`/${path}`} element={<Navigate to={`/t9dya/${path}`} replace />} />)}<Route path="/charges" element={<Navigate to="/budget/charges" replace />} /><Route path="/envelopes" element={<Navigate to="/budget/envelopes" replace />} /><Route path="/settings" element={<HubSettingsPage />} /><Route path="/household" element={<Navigate to="/" replace />} /><Route path="/" element={<HubPage />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></Suspense></>
}

function ClosedAccountPage({ onSignOut }) {
  return <main className="grid min-h-dvh place-items-center bg-canvas p-5 text-ink"><section className="w-full max-w-md rounded-card bg-surface p-7 text-center shadow-card"><Brand /><span className="mx-auto mt-8 grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300"><LockKeyhole size={29} /></span><h1 className="mt-5 text-2xl font-black">Accès privé</h1><p className="mt-2 text-sm leading-6 text-muted">Cette plateforme est réservée aux deux comptes autorisés.</p><button type="button" onClick={onSignOut} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 font-extrabold text-white dark:bg-white dark:text-slate-900"><LogOut size={18} />Se déconnecter</button></section></main>
}

export default function App() {
  return <AppErrorBoundary><I18nProvider><AuthProvider><NotificationCoordinator /><LocationCoordinator /><AppRoutes /></AuthProvider></I18nProvider></AppErrorBoundary>
}
