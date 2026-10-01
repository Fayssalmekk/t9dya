import { History, ListChecks, MoreHorizontal, ReceiptText, Search, Settings, WalletCards, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const tabs = [
  { to: '/list', label: 'Liste', icon: ListChecks },
  { to: '/catalog', label: 'Catalogue', icon: Search },
  { to: '/charges', label: 'Charges', icon: ReceiptText },
  { to: '/envelopes', label: 'Enveloppes', icon: WalletCards }
]

export default function BottomNavigation() {
  const location = useLocation()
  const [showMore, setShowMore] = useState(false)
  const moreActive = ['/history', '/settings'].includes(location.pathname)

  return (
    <>
      {showMore && <div className="fixed inset-0 z-40 flex items-end justify-center"><button type="button" onClick={() => setShowMore(false)} className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" aria-label="Fermer le menu" /><div className="relative mb-[calc(5.25rem+env(safe-area-inset-bottom))] w-[calc(100%-2rem)] max-w-md rounded-[1.75rem] bg-surface p-3 shadow-2xl"><div className="flex items-center justify-between px-2 pb-2"><div><strong className="block">Plus d’outils</strong><small className="text-muted">Votre historique et vos réglages</small></div><button type="button" onClick={() => setShowMore(false)} className="grid h-10 w-10 place-items-center rounded-xl bg-canvas" aria-label="Fermer"><X size={18} /></button></div><NavLink to="/history" onClick={() => setShowMore(false)} className="mt-1 flex min-h-16 items-center gap-3 rounded-2xl bg-canvas px-4"><span className="grid h-11 w-11 place-items-center rounded-xl bg-sky-100 text-sky-700"><History size={21} /></span><span><strong className="block">Historique des achats</strong><small className="text-muted">Achats, prix et exports</small></span></NavLink><NavLink to="/settings" onClick={() => setShowMore(false)} className="mt-2 flex min-h-16 items-center gap-3 rounded-2xl bg-canvas px-4"><span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100"><Settings size={21} /></span><span><strong className="block">Réglages</strong><small className="text-muted">Foyer, thème et notifications</small></span></NavLink></div></div>}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-surface/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_30px_-20px_rgba(15,23,42,0.3)] backdrop-blur-xl dark:border-slate-800" aria-label="Navigation principale">
        <div className="mx-auto grid max-w-2xl grid-cols-5">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold transition sm:text-[11px] ${isActive ? 'text-accent-700' : 'text-muted hover:text-ink'}`}>
              {({ isActive }) => <>{isActive && <span className="absolute top-0 h-1 w-7 rounded-full bg-accent-500" />}<Icon size={21} strokeWidth={isActive ? 2.6 : 2} aria-hidden="true" /><span>{label}</span></>}
            </NavLink>
          ))}
          <button type="button" onClick={() => setShowMore(true)} className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold transition sm:text-[11px] ${moreActive ? 'text-accent-700' : 'text-muted'}`} aria-expanded={showMore}>{moreActive && <span className="absolute top-0 h-1 w-7 rounded-full bg-accent-500" />}<MoreHorizontal size={22} strokeWidth={moreActive ? 2.6 : 2} /><span>Plus</span></button>
        </div>
      </nav>
    </>
  )
}
