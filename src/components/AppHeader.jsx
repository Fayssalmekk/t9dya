import { Heart, WalletCards, Wifi } from 'lucide-react'
import { useLocation } from 'react-router-dom'

export default function AppHeader({ title, subtitle }) {
  const location = useLocation()
  const isBudget = location.pathname.startsWith('/budget')
  const AppIcon = isBudget ? WalletCards : Heart

  return <header className="mb-6"><div className={`mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] ${isBudget ? 'text-amber-600' : 'text-accent-700'}`}><AppIcon size={14} fill={isBudget ? 'none' : 'currentColor'} /> {isBudget ? 'Budget' : 'T9dya'} <Wifi size={13} aria-label="Synchronisé" /></div><h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>{subtitle && <p className="mt-1 truncate text-sm text-muted">{subtitle}</p>}</header>
}
