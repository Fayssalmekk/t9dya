import { LayoutDashboard, PiggyBank, ReceiptText, WalletCards } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/budget/overview', label: 'Vue globale', icon: LayoutDashboard },
  { to: '/budget/expenses', label: 'Dépenses', icon: ReceiptText },
  { to: '/budget/charges', label: 'Charges', icon: WalletCards },
  { to: '/budget/envelopes', label: 'Enveloppes', icon: PiggyBank }
]

export default function BudgetNavigation() {
  return <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-amber-100/80 bg-surface/95 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_30px_-20px_rgba(120,53,15,0.35)] backdrop-blur-xl dark:border-amber-950" aria-label="Navigation Budget"><div className="mx-auto grid max-w-2xl grid-cols-4">{tabs.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-center text-[9px] font-bold transition sm:text-[11px] ${isActive ? 'text-amber-600' : 'text-muted hover:text-ink'}`}>{({ isActive }) => <>{isActive && <span className="absolute top-0 h-1 w-8 rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />}<Icon size={20} strokeWidth={isActive ? 2.7 : 2} /><span>{label}</span></>}</NavLink>)}</div></nav>
}
