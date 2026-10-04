import { ChevronLeft, ChevronRight, Plus, ReceiptText, Sparkles, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import AppHeader from '../../../components/AppHeader'
import { useAuth } from '../../../context/AuthContext'
import { usePlatform } from '../../../context/PlatformContext'
import { useHouseholdBudget } from '../../../hooks/useHouseholdBudget'
import { deleteExpense } from '../../../services/budget'
import ExpenseSheet from '../components/ExpenseSheet'

const money = (value) => `${Number(value || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} DH`
const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
const todayKey = () => {
  const now = new Date()
  return `${monthKey(now)}-${String(now.getDate()).padStart(2, '0')}`
}
const categoryMeta = {
  food: ['🍽️', 'Alimentation', 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-200'],
  transport: ['🚗', 'Transport', 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-200'],
  home: ['🏠', 'Maison', 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-200'],
  health: ['🩺', 'Santé', 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200'],
  leisure: ['✨', 'Loisirs', 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-200'],
  other: ['🧾', 'Autre', 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200']
}

export default function ExpensesPage() {
  const { household, user } = useAuth()
  const { notify } = usePlatform()
  const { expenses, envelopes, salaryMonths, loading, error } = useHouseholdBudget(household, user.uid)
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [adding, setAdding] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const key = monthKey(month)
  const visible = useMemo(() => expenses.filter((expense) => expense.spentOn?.startsWith(key)), [expenses, key])
  const grouped = useMemo(() => Object.entries(visible.reduce((result, expense) => {
    const date = expense.spentOn || 'Sans date'
    result[date] = [...(result[date] || []), expense]
    return result
  }, {})).sort(([first], [second]) => second.localeCompare(first)), [visible])
  const total = visible.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
  const todayTotal = expenses.filter((expense) => expense.spentOn === todayKey()).reduce((sum, expense) => sum + Number(expense.amount || 0), 0)

  const remove = async () => {
    setDeleting(true)
    try {
      await deleteExpense(household.id, user.uid, pendingDelete)
      notify(pendingDelete.sourceType === 'envelope' ? 'Dépense supprimée et enveloppe recréditée' : 'Dépense supprimée')
      setPendingDelete(null)
    } catch {
      notify('Impossible de supprimer cette dépense')
    } finally {
      setDeleting(false)
    }
  }

  return <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-28 pt-6 sm:px-6"><AppHeader title="Dépenses" subtitle="Le fil vivant de votre argent" /><section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 p-5 text-white shadow-xl shadow-orange-500/20"><span className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/15" /><span className="absolute -bottom-16 left-20 h-36 w-36 rounded-full bg-yellow-200/15" /><div className="relative"><div className="flex items-start justify-between"><div><p className="text-sm font-bold text-white/75">Dépensé aujourd’hui</p><p className="mt-1 text-4xl font-black tabular-nums">{money(todayTotal)}</p></div><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20"><Sparkles size={23} /></span></div><div className="mt-5 flex items-center justify-between rounded-2xl bg-white/15 p-3 backdrop-blur"><span><small className="block font-bold text-white/70">Total du mois</small><strong className="text-lg tabular-nums">{money(total)}</strong></span><button type="button" onClick={() => setAdding(true)} className="flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-orange-600 shadow-lg"><Plus size={18} />Ajouter</button></div></div></section><div className="mt-4 flex items-center gap-2 rounded-2xl bg-surface p-2 shadow-sm"><button type="button" onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} className="grid h-11 w-11 place-items-center rounded-xl bg-canvas" aria-label="Mois précédent"><ChevronLeft size={20} /></button><button type="button" onClick={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))} className="min-w-0 flex-1 text-center"><small className="block text-[10px] font-black uppercase tracking-widest text-amber-600">Journal du mois</small><strong className="block capitalize">{month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</strong></button><button type="button" onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} className="grid h-11 w-11 place-items-center rounded-xl bg-canvas" aria-label="Mois suivant"><ChevronRight size={20} /></button></div>{error && <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700 dark:bg-red-950 dark:text-red-200">{error}</p>}{loading ? <div className="mt-5 space-y-3"><div className="h-24 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" /><div className="h-24 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" /></div> : grouped.length ? <div className="mt-6 space-y-6">{grouped.map(([date, items]) => <section key={date}><div className="mb-2 flex items-end justify-between px-1"><h2 className="font-black capitalize">{date === todayKey() ? 'Aujourd’hui' : new Date(`${date}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</h2><strong className="text-sm tabular-nums text-muted">{money(items.reduce((sum, item) => sum + Number(item.amount || 0), 0))}</strong></div><div className="overflow-hidden rounded-[1.5rem] bg-surface shadow-card">{items.map((expense, index) => { const meta = categoryMeta[expense.category] || categoryMeta.other; return <article key={expense.id} className={`flex items-center gap-3 p-4 ${index ? 'border-t border-slate-100 dark:border-slate-800' : ''}`}><span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-xl ${meta[2]}`}>{meta[0]}</span><div className="min-w-0 flex-1"><h3 className="truncate font-extrabold">{expense.reason}</h3><p className="mt-1 truncate text-xs text-muted">{expense.sourceIcon} {expense.sourceName} · {meta[1]}</p>{expense.note && <p className="mt-1 truncate text-[11px] text-muted/80">{expense.note}</p>}</div><div className="text-right"><strong className="block tabular-nums text-rose-600">−{money(expense.amount)}</strong><button type="button" onClick={() => setPendingDelete(expense)} className="mt-1 inline-grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label={`Supprimer ${expense.reason}`}><Trash2 size={15} /></button></div></article> })}</div></section>)}</div> : <section className="mt-6 rounded-[1.75rem] border border-dashed border-amber-300 bg-amber-50/60 p-8 text-center dark:border-amber-900 dark:bg-amber-950/20"><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white text-amber-500 shadow-sm dark:bg-slate-900"><ReceiptText size={30} /></span><h2 className="mt-4 text-lg font-black">Une page encore toute propre</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">Ajoutez votre première dépense et voyez immédiatement d’où vient l’argent.</p><button type="button" onClick={() => setAdding(true)} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-amber-500 px-5 font-black text-white"><Plus size={18} />Ajouter une dépense</button></section>}{adding && <ExpenseSheet envelopes={envelopes} salaryMonths={salaryMonths} onClose={() => setAdding(false)} />}{pendingDelete && <div className="fixed inset-0 z-50 grid place-items-center p-5"><button type="button" onClick={() => setPendingDelete(null)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" aria-label="Annuler" /><section className="relative w-full max-w-sm rounded-[1.75rem] bg-surface p-5 text-center shadow-2xl"><button type="button" onClick={() => setPendingDelete(null)} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-xl bg-canvas" aria-label="Fermer"><X size={17} /></button><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950"><Trash2 size={24} /></span><h2 className="mt-4 text-xl font-black">Supprimer cette dépense ?</h2><p className="mt-2 text-sm leading-6 text-muted">{pendingDelete.sourceType === 'envelope' ? `Les ${money(pendingDelete.amount)} seront remis dans l’enveloppe ${pendingDelete.sourceName}.` : 'Elle disparaîtra du journal mensuel.'}</p><div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={() => setPendingDelete(null)} className="min-h-12 rounded-xl bg-canvas font-extrabold">Garder</button><button type="button" onClick={remove} disabled={deleting} className="min-h-12 rounded-xl bg-rose-600 font-extrabold text-white disabled:opacity-50">{deleting ? 'Suppression…' : 'Supprimer'}</button></div></section></div>}</main>
}
