import { ChevronLeft, Heart, WalletCards, Wifi } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AppHeader({ title, subtitle }) {
  const { profile } = useAuth()
  const location = useLocation()
  const isBudget = location.pathname.startsWith('/budget')
  const AppIcon = isBudget ? WalletCards : Heart
  const initial = profile?.displayName?.charAt(0)?.toUpperCase() || '?'

  return <header className="mb-6 flex items-center justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><Link to="/" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface text-muted shadow-sm" aria-label="Retour aux applications"><ChevronLeft size={21} /></Link><div className="min-w-0"><div className={`mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] ${isBudget ? 'text-amber-600' : 'text-accent-700'}`}><AppIcon size={14} fill={isBudget ? 'none' : 'currentColor'} /> {isBudget ? 'Budget' : 'T9dya'} <Wifi size={13} aria-label="Synchronisé" /></div><h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>{subtitle && <p className="mt-1 truncate text-sm text-muted">{subtitle}</p>}</div></div><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full font-extrabold text-white ${isBudget ? 'bg-amber-500' : 'bg-accent-600'}`} aria-label={`Profil ${profile?.displayName}`}>{initial}</span></header>
}
