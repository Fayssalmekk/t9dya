import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Toast from '../../components/Toast'
import { PlatformProvider } from '../../context/PlatformContext'
import { ShoppingProvider } from '../../context/ShoppingContext'
import BudgetNavigation from './components/BudgetNavigation'

const OverviewPage = lazy(() => import('./pages/BudgetOverviewPage'))
const ExpensesPage = lazy(() => import('./pages/ExpensesPage'))
const ChargesPage = lazy(() => import('../../pages/ChargesPage'))
const EnvelopesPage = lazy(() => import('../../pages/EnvelopesPage'))

function Loading() {
  return <main className="mx-auto min-h-dvh max-w-2xl px-4 py-6"><div className="h-12 w-52 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" /><div className="mt-8 h-72 animate-pulse rounded-[2rem] bg-slate-200 dark:bg-slate-800" /></main>
}

export default function BudgetApp() {
  return <PlatformProvider><ShoppingProvider><div className="min-h-dvh bg-canvas text-ink"><Suspense fallback={<Loading />}><Routes><Route path="overview" element={<OverviewPage />} /><Route path="expenses" element={<ExpensesPage />} /><Route path="charges" element={<ChargesPage />} /><Route path="envelopes" element={<EnvelopesPage />} /><Route path="*" element={<Navigate to="/budget/overview" replace />} /></Routes></Suspense><BudgetNavigation /><Toast /></div></ShoppingProvider></PlatformProvider>
}
