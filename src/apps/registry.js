import { lazy } from 'react'
import { Heart, HeartPulse, MapPinned, Shirt, WalletCards } from 'lucide-react'

export const HubPage = lazy(() => import('./hub/HubPage'))
export const HubSettingsPage = lazy(() => import('./hub/HubSettingsPage'))

export const appRegistry = [
  { id: 't9dya', name: 'apps.t9dya.name', description: 'apps.t9dya.description', icon: Heart, accent: 'teal', basePath: '/t9dya', enabled: true, comingSoon: false, component: lazy(() => import('./t9dya/T9dyaApp')) },
  { id: 'budget', name: 'apps.budget.name', description: 'apps.budget.description', icon: WalletCards, accent: 'amber', basePath: '/budget', enabled: true, comingSoon: false, component: lazy(() => import('./budget/BudgetApp')) },
  { id: 'hwayj', name: 'apps.hwayj.name', description: 'apps.hwayj.description', icon: Shirt, accent: 'violet', basePath: '/hwayj', enabled: true, comingSoon: false, component: lazy(() => import('./hwayj/HwayjApp')) },
  { id: 's7a', name: 'apps.s7a.name', description: 'apps.s7a.description', icon: HeartPulse, accent: 'rose', basePath: '/s7a', enabled: true, comingSoon: false, component: lazy(() => import('./s7a/S7aApp')) },
  { id: 'map', name: 'apps.map.name', description: 'apps.map.description', icon: MapPinned, accent: 'sky', basePath: '/map', enabled: true, comingSoon: false, component: lazy(() => import('./map/MapApp')) }
]
