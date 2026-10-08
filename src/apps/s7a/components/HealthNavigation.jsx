import { Ban, CalendarDays, HeartPulse, Pill } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

const tabs = [
  { to: '/s7a/today', label: 'Aujourd’hui', icon: HeartPulse },
  { to: '/s7a/medications', label: 'Traitements', icon: Pill },
  { to: '/s7a/appointments', label: 'Rendez-vous', icon: CalendarDays },
  { to: '/s7a/habits', label: 'Habitudes', icon: Ban }
]

export default function HealthNavigation() {
  const { pathname } = useLocation()
  return <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-surface/95 px-1 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl dark:border-slate-800" aria-label="Navigation santé"><div className="mx-auto grid max-w-2xl grid-cols-4">{tabs.map(({ to, label, icon: Icon }) => { const active = pathname.startsWith(to); return <Link key={to} to={to} className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[9px] font-bold sm:text-[10px] ${active ? 'text-rose-600 dark:text-rose-300' : 'text-muted'}`}>{active && <span className="absolute top-0 h-1 w-8 rounded-full bg-rose-500" />}<Icon size={20} /><span>{label}</span></Link> })}</div></nav>
}
