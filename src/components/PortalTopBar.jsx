import { Heart, HeartPulse, Home, MapPinned, Shirt, UserRound, WalletCards } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const apps = [
  { path: '/t9dya', label: 'T9dya', icon: Heart, tone: 'bg-teal-500', soft: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-200' },
  { path: '/budget', label: 'Budget', icon: WalletCards, tone: 'bg-amber-500', soft: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-200' },
  { path: '/hwayj', label: 'Hwayj', icon: Shirt, tone: 'bg-violet-600', soft: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-200' },
  { path: '/s7a', label: 'S7a', icon: HeartPulse, tone: 'bg-rose-500', soft: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-200' },
  { path: '/map', label: 'Carte', icon: MapPinned, tone: 'bg-sky-600', soft: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-200' }
]

export default function PortalTopBar() {
  const { pathname } = useLocation()
  const { profile } = useAuth()
  const app = apps.find((entry) => pathname.startsWith(entry.path))
  if (!app) return null
  const AppIcon = app.icon
  const initial = profile?.displayName?.charAt(0)?.toUpperCase() || '?'

  return <nav className="portal-top-bar sticky z-40 border-b border-slate-200/70 bg-surface/90 px-3 py-2 text-ink shadow-[0_8px_30px_-22px_rgba(15,23,42,.65)] backdrop-blur-xl dark:border-slate-800/80" aria-label="Navigation rapide">
    <div className="mx-auto flex min-h-12 w-full max-w-2xl items-center gap-2">
      <Link to="/" className="flex min-h-11 items-center gap-2 rounded-2xl bg-canvas px-3 font-black text-muted transition active:scale-95" aria-label="Retour au Hub"><Home size={19} /><span className="hidden text-xs sm:inline">Hub</span></Link>
      <div className={`mx-auto flex min-h-10 items-center gap-2 rounded-full px-3 text-xs font-black ${app.soft}`}><span className={`grid h-7 w-7 place-items-center rounded-full text-white ${app.tone}`}><AppIcon size={15} /></span>{app.label}</div>
      <Link to="/settings" className="flex min-h-11 items-center gap-2 rounded-2xl bg-canvas py-1 pl-1 pr-2 transition active:scale-95" aria-label={`Ouvrir le profil de ${profile?.displayName || 'mon profil'}`}><span className={`grid h-9 w-9 place-items-center rounded-xl font-black text-white ${app.tone}`}>{initial}</span><span className="hidden max-w-24 truncate text-xs font-black sm:block">{profile?.displayName || 'Profil'}</span><UserRound className="text-muted sm:hidden" size={16} /></Link>
    </div>
  </nav>
}
