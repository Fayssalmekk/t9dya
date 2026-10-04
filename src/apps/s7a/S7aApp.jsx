import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ShoppingProvider } from '../../context/ShoppingContext'
import { PlatformProvider } from '../../context/PlatformContext'
import Toast from '../../components/Toast'
import { HealthProvider } from './context/HealthContext'
import HealthNavigation from './components/HealthNavigation'

const TodayPage = lazy(() => import('./pages/TodayPage'))
const DiabetesPage = lazy(() => import('./pages/DiabetesPage'))
const MedicationsPage = lazy(() => import('./pages/MedicationsPage'))
const AppointmentsPage = lazy(() => import('./pages/AppointmentsPage'))
const BadHabitsPage = lazy(() => import('./pages/BadHabitsPage'))

function Loading() { return <main className="mx-auto min-h-dvh max-w-2xl px-4 py-6"><div className="h-12 w-52 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" /><div className="mt-8 h-72 animate-pulse rounded-[2rem] bg-slate-200 dark:bg-slate-800" /></main> }

export default function S7aApp() {
  return <PlatformProvider><ShoppingProvider><HealthProvider><div className="min-h-dvh bg-canvas text-ink"><Suspense fallback={<Loading />}><Routes><Route path="today" element={<TodayPage />} /><Route path="diabetes" element={<DiabetesPage />} /><Route path="medications" element={<MedicationsPage />} /><Route path="appointments" element={<AppointmentsPage />} /><Route path="habits" element={<BadHabitsPage />} /><Route path="*" element={<Navigate to="/s7a/today" replace />} /></Routes></Suspense><HealthNavigation /><Toast /></div></HealthProvider></ShoppingProvider></PlatformProvider>
}
