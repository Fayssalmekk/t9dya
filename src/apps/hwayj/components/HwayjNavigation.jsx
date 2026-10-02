import { Layers3, Plus, Shirt, Sparkles } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useWardrobe } from '../context/WardrobeContext'

const tabs = [
  { to: '/hwayj/closet', label: 'Dressing', icon: Shirt, active: (path) => path.startsWith('/hwayj/closet') || path.startsWith('/hwayj/item/') || path === '/hwayj/add' },
  { to: '/hwayj/outfits/new', label: 'Tenue', icon: Sparkles, active: (path) => path === '/hwayj/outfits/new' },
  { to: '/hwayj/outfits', label: 'Outfits', icon: Layers3, active: (path) => path === '/hwayj/outfits' || (/^\/hwayj\/outfits\/[^/]+$/.test(path) && path !== '/hwayj/outfits/new') },
]

export default function HwayjNavigation() {
  const { pathname } = useLocation()
  const { isOwnWardrobe } = useWardrobe()
  return <>{isOwnWardrobe && pathname === '/hwayj/closet' && <Link to="/hwayj/add" className="fixed bottom-24 right-5 z-20 grid h-14 w-14 place-items-center rounded-2xl bg-violet-600 text-white shadow-xl sm:right-[calc(50%-21rem)]" aria-label="Ajouter un vêtement"><Plus size={27} /></Link>}<nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-surface/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl dark:border-slate-800" aria-label="Navigation Hwayj"><div className="mx-auto grid max-w-md grid-cols-3 gap-1">{tabs.map(({ to, label, icon: Icon, active }) => { const selected = active(pathname); return <Link key={to} to={to} className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold ${selected ? 'text-violet-700 dark:text-violet-300' : 'text-muted'}`}>{selected && <span className="absolute top-0 h-1 w-8 rounded-full bg-violet-500" />}<Icon size={21} /><span>{label}</span></Link> })}</div></nav></>
}
