import { ChefHat, History, ListChecks, Search } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/t9dya/list', label: 'Liste', icon: ListChecks },
  { to: '/t9dya/catalog', label: 'Catalogue', icon: Search },
  { to: '/t9dya/cuisine', label: 'Cuisine', icon: ChefHat },
  { to: '/t9dya/history', label: 'Historique', icon: History }
]

export default function BottomNavigation() {
  return <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-surface/95 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_30px_-20px_rgba(15,23,42,0.3)] backdrop-blur-xl dark:border-slate-800" aria-label="Navigation T9dya"><div className="mx-auto grid max-w-2xl grid-cols-4">{tabs.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={() => { if (to === '/t9dya/list') window.dispatchEvent(new Event('t9dya:list-home')) }} className={({ isActive }) => `relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold transition sm:text-[11px] ${isActive ? 'text-accent-700' : 'text-muted hover:text-ink'}`}>{({ isActive }) => <>{isActive && <span className="absolute top-0 h-1 w-7 rounded-full bg-accent-500" />}<Icon size={20} strokeWidth={isActive ? 2.6 : 2} /><span>{label}</span></>}</NavLink>)}</div></nav>
}
