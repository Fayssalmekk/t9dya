import { Heart, Wifi } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { usePresence } from '../context/PresenceContext'

export default function AppHeader({ title, subtitle }) {
  const { profile } = useAuth()
  const { partner, online, lastSeen } = usePresence()
  const initial = profile?.displayName?.charAt(0)?.toUpperCase() || '?'
  const partnerInitial = partner?.displayName?.charAt(0)?.toUpperCase() || '?'
  const lastSeenLabel = lastSeen
    ? `Vu ${lastSeen.toLocaleDateString('fr-FR') === new Date().toLocaleDateString('fr-FR') ? `à ${lastSeen.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : lastSeen.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
    : 'Hors ligne'

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
        {partner && <div className="flex h-11 items-center gap-2 rounded-full bg-surface py-1 pl-1.5 pr-2.5 shadow-sm" aria-label={`${partner.displayName} est ${online ? 'en ligne' : lastSeenLabel}`}><span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet-100 text-xs font-black text-violet-700 dark:bg-violet-950 dark:text-violet-200">{partnerInitial}<span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface ${online ? 'bg-emerald-500' : 'bg-slate-400'}`} /></span><span className="hidden max-w-20 leading-tight min-[390px]:block"><strong className="block truncate text-[11px]">{partner.displayName}</strong><small className={`block whitespace-nowrap text-[9px] font-bold ${online ? 'text-emerald-600' : 'text-muted'}`}>{online ? 'En ligne' : lastSeenLabel}</small></span></div>}
        <span className="grid h-11 w-11 place-items-center rounded-full bg-accent-600 font-extrabold text-white" aria-label={`Profil ${profile?.displayName}`}>{initial}</span>
      </div>
    </header>
  )
}
