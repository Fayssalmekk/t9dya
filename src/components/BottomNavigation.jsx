import { BarChart3, History, ListChecks, Search, Settings } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/list', label: 'Liste', icon: ListChecks },
  { to: '/catalog', label: 'Catalogue', icon: Search },
  { to: '/budget', label: 'Budget', icon: BarChart3 },
  { to: '/history', label: 'Historique', icon: History },
  { to: '/settings', label: 'Réglages', icon: Settings }
]

export default function BottomNavigation() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-surface/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_30px_-20px_rgba(15,23,42,0.3)] backdrop-blur-xl dark:border-slate-800" aria-label="Navigation principale">
      <div className="mx-auto grid max-w-2xl grid-cols-5">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold transition ${isActive ? 'text-accent-700' : 'text-muted hover:text-ink'}`}>
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute top-0 h-1 w-7 rounded-full bg-accent-500" />}
                <Icon size={21} strokeWidth={isActive ? 2.6 : 2} aria-hidden="true" />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
