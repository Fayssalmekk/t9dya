import { lazy } from 'react'
import { Heart, Home, Shirt, Sparkles } from 'lucide-react'

export const HubPage = lazy(() => import('./hub/HubPage'))

export const appRegistry = [
  { id: 't9dya', name: 'apps.t9dya.name', description: 'apps.t9dya.description', icon: Heart, accent: 'teal', basePath: '/t9dya', enabled: true, comingSoon: false, component: lazy(() => import('./t9dya/T9dyaApp')) },
  { id: 'hwayj', name: 'apps.hwayj.name', description: 'apps.hwayj.description', icon: Shirt, accent: 'violet', basePath: '/hwayj', enabled: true, comingSoon: false, component: lazy(() => import('./hwayj/HwayjApp')) },
  { id: 'dar', name: 'apps.dar.name', description: 'apps.dar.description', icon: Home, accent: 'amber', basePath: '/dar', enabled: false, comingSoon: true, component: null },
  { id: 'moments', name: 'apps.moments.name', description: 'apps.moments.description', icon: Sparkles, accent: 'rose', basePath: '/moments', enabled: false, comingSoon: true, component: null }
]
