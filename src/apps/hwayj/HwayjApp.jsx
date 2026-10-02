import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { PlatformProvider } from '../../context/PlatformContext'
import Toast from '../../components/Toast'
import { WardrobeProvider } from './context/WardrobeContext'
import HwayjNavigation from './components/HwayjNavigation'

const ClosetPage = lazy(() => import('./pages/ClosetPage'))
const AddItemPage = lazy(() => import('./pages/AddItemPage'))
const ItemDetailPage = lazy(() => import('./pages/ItemDetailPage'))
const OutfitsPage = lazy(() => import('./pages/OutfitsPage'))
const OutfitBuilderPage = lazy(() => import('./pages/OutfitBuilderPage'))

function Loading() {
  return <main className="mx-auto min-h-dvh max-w-2xl px-4 py-6"><div className="h-12 w-52 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" /><div className="mt-8 grid grid-cols-2 gap-3"><div className="h-64 animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800" /><div className="h-64 animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800" /></div></main>
}

export default function HwayjApp() {
  return <PlatformProvider><WardrobeProvider><div className="min-h-dvh bg-canvas text-ink"><Suspense fallback={<Loading />}><Routes><Route path="closet" element={<ClosetPage />} /><Route path="add" element={<AddItemPage />} /><Route path="item/:itemId" element={<ItemDetailPage />} /><Route path="outfits" element={<OutfitsPage />} /><Route path="outfits/new" element={<OutfitBuilderPage />} /><Route path="outfits/:outfitId" element={<OutfitBuilderPage />} /><Route path="*" element={<Navigate to="/hwayj/closet" replace />} /></Routes></Suspense><HwayjNavigation /><Toast /></div></WardrobeProvider></PlatformProvider>
}
