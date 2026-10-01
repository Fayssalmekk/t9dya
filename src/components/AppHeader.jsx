import { Heart, Wifi } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function AppHeader({ title, subtitle }) {
  const { profile } = useAuth()
  const initial = profile?.displayName?.charAt(0)?.toUpperCase() || '?'

  return (
    <header className="mb-6 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-accent-700">
          <Heart size={14} fill="currentColor" /> T9dya <Wifi size={13} aria-label="Synchronisé" />
        </div>
        <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 truncate text-sm text-muted">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-accent-600 font-extrabold text-white" aria-label={`Profil ${profile?.displayName}`}>{initial}</span>
      </div>
    </header>
  )
}
