import { lazy } from 'react'
import { Heart, HeartPulse, Home, Shirt } from 'lucide-react'

export const HubPage = lazy(() => import('./hub/HubPage'))
export const HubSettingsPage = lazy(() => import('./hub/HubSettingsPage'))

export const appRegistry = [
  { id: 't9dya', name: 'apps.t9dya.name', description: 'apps.t9dya.description', icon: Heart, accent: 'teal', basePath: '/t9dya', enabled: true, comingSoon: false, component: lazy(() => import('./t9dya/T9dyaApp')) },
  { id: 'hwayj', name: 'apps.hwayj.name', description: 'apps.hwayj.description', icon: Shirt, accent: 'violet', basePath: '/hwayj', enabled: true, comingSoon: false, component: lazy(() => import('./hwayj/HwayjApp')) },
  { id: 'dar', name: 'apps.dar.name', description: 'apps.dar.description', icon: Home, accent: 'amber', basePath: '/dar', enabled: false, comingSoon: true, component: null },
  { id: 's7a', name: 'apps.s7a.name', description: 'apps.s7a.description', icon: HeartPulse, accent: 'rose', basePath: '/s7a', enabled: true, comingSoon: false, component: lazy(() => import('./s7a/S7aApp')) }
]
