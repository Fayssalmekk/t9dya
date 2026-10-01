import { ChevronLeft, Shirt } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function HwayjHeader({ title, subtitle, backTo }) {
  return <header className="mb-6 flex items-center gap-3"><Link to={backTo || '/'} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface text-muted shadow-sm" aria-label={backTo ? 'Retour' : 'Retour aux applications'}><ChevronLeft size={21} /></Link><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200"><Shirt size={21} /></span><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">Hwayj</p><h1 className="truncate text-2xl font-black">{title}</h1>{subtitle && <p className="truncate text-sm text-muted">{subtitle}</p>}</div></header>
}
