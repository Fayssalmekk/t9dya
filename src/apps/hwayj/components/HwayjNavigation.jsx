import { CalendarDays, ChartNoAxesColumn, Luggage, Plus, Shirt, Sparkles } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { useI18n } from '../../../i18n/I18nContext'

const tabs = [
  { to: '/hwayj/closet', label: 'hwayj.closet', icon: Shirt },
  { to: '/hwayj/outfits/new', label: 'hwayj.outfits', icon: Sparkles },
  { to: '/hwayj/calendar', label: 'hwayj.calendar', icon: CalendarDays },
  { to: '/hwayj/insights', label: 'hwayj.insights', icon: ChartNoAxesColumn },
  { to: '/hwayj/packing', label: 'hwayj.packing', icon: Luggage }
]

export default function HwayjNavigation() {
  const { t } = useI18n()
  const { pathname } = useLocation()
  return <>{pathname === '/hwayj/closet' && <NavLink to="/hwayj/add" className="fixed bottom-24 right-5 z-20 grid h-14 w-14 place-items-center rounded-2xl bg-violet-600 text-white shadow-xl sm:right-[calc(50%-21rem)]" aria-label="Ajouter un vêtement"><Plus size={27} /></NavLink>}<nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-surface/95 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl dark:border-slate-800" aria-label="Navigation Hwayj"><div className="mx-auto grid max-w-2xl grid-cols-5">{tabs.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[9px] font-bold sm:text-[10px] ${isActive ? 'text-violet-700 dark:text-violet-300' : 'text-muted'}`}>{({ isActive }) => <>{isActive && <span className="absolute top-0 h-1 w-7 rounded-full bg-violet-500" />}<Icon size={20} /><span>{t(label)}</span></>}</NavLink>)}</div></nav></>
}
