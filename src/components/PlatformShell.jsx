import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { lazy, Suspense } from 'react'
import BottomNavigation from './BottomNavigation'
import Toast from './Toast'
import { PlatformProvider } from '../context/PlatformContext'
import { useShopping } from '../context/ShoppingContext'

const AddProductSheet = lazy(() => import('./AddProductSheet'))
const ListPage = lazy(() => import('../pages/ListPage'))
const CatalogPage = lazy(() => import('../pages/CatalogPage'))
const ChargesPage = lazy(() => import('../pages/ChargesPage'))
const EnvelopesPage = lazy(() => import('../pages/EnvelopesPage'))
const HistoryPage = lazy(() => import('../pages/HistoryPage'))
const SettingsPage = lazy(() => import('../pages/SettingsPage'))

function PageFallback() {
  return <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-28 pt-6"><div className="h-9 w-40 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" /><div className="mt-7 h-44 animate-pulse rounded-[1.75rem] bg-slate-200 dark:bg-slate-800" /><div className="mt-4 h-28 animate-pulse rounded-[1.75rem] bg-slate-200 dark:bg-slate-800" /></main>
}

function PlatformContent() {
  const location = useLocation()
  const navigate = useNavigate()
  const { incomingRequest } = useShopping()
  const showFab = location.pathname === '/t9dya/list' || location.pathname === '/t9dya'

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="list" element={<ListPage />} />
          <Route path="catalog" element={<CatalogPage />} />
          <Route path="charges" element={<ChargesPage />} />
          <Route path="envelopes" element={<EnvelopesPage />} />
          <Route path="budget" element={<Navigate to="/t9dya/charges" replace />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/t9dya/list" replace />} />
        </Routes>
      </Suspense>
      {incomingRequest && location.pathname !== '/t9dya/list' && <button type="button" onClick={() => navigate('/t9dya/list')} className="fixed left-1/2 top-4 z-40 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-2xl bg-amber-400 p-4 text-left text-slate-950 shadow-2xl"><span className="text-2xl">🛒</span><span className="min-w-0 flex-1"><strong className="block">Course demandée</strong><small className="block truncate">{incomingRequest.title} vous attend</small></span><span className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-extrabold text-white">Voir</span></button>}
      {showFab && (
        <button type="button" onClick={() => navigate('/t9dya/catalog')} className="fixed bottom-24 right-5 z-20 grid h-14 w-14 place-items-center rounded-2xl bg-accent-600 text-white shadow-[0_12px_30px_-8px_rgba(13,148,136,0.75)] transition hover:-translate-y-0.5 hover:bg-accent-700 active:scale-95 sm:right-[calc(50%-21rem)]" aria-label="Ajouter un produit">
          <Plus size={27} strokeWidth={2.5} />
        </button>
      )}
      <Suspense fallback={null}><AddProductSheet /></Suspense>
      <Toast />
      <BottomNavigation />
    </div>
  )
}

export default function PlatformShell() {
  return <PlatformProvider><PlatformContent /></PlatformProvider>
}
