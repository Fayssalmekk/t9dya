import { ArrowRight, CalendarCheck, ChevronLeft, ChevronRight, Coins, Landmark, Pencil, PiggyBank, Plus, ReceiptText, Save, ShoppingBasket, Sparkles, UserRound, WalletCards } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppHeader from '../../../components/AppHeader'
import { useAuth } from '../../../context/AuthContext'
import { usePlatform } from '../../../context/PlatformContext'
import { useShopping } from '../../../context/ShoppingContext'
import { useHouseholdBudget } from '../../../hooks/useHouseholdBudget'
import { setMonthlySalary } from '../../../services/budget'
import ExpenseSheet from '../components/ExpenseSheet'

const money = (value) => `${Number(value || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} DH`
const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
const categories = {
  food: ['Alimentation', 'bg-orange-500'], transport: ['Transport', 'bg-sky-500'], home: ['Maison', 'bg-violet-500'],
  health: ['Santé', 'bg-rose-500'], leisure: ['Loisirs', 'bg-fuchsia-500'], other: ['Autre', 'bg-slate-500']
}

export default function BudgetOverviewPage() {
  const { household, user } = useAuth()
  const { notify } = usePlatform()
  const { purchases } = useShopping()
  const { charges, payments, envelopes, expenses, movements, salaryMonths, loading, error } = useHouseholdBudget(household, user.uid)
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [adding, setAdding] = useState(false)
  const [editingSalary, setEditingSalary] = useState('')
  const [salaryInput, setSalaryInput] = useState('')
  const [savingSalary, setSavingSalary] = useState(false)
  const key = monthKey(month)
  const members = useMemo(() => (household.members || []).map((uid) => household.memberProfiles?.[uid]).filter(Boolean), [household.memberProfiles, household.members])
  const monthExpenses = useMemo(() => expenses.filter((expense) => expense.spentOn?.startsWith(key)), [expenses, key])
  const monthPayments = useMemo(() => payments.filter((payment) => payment.month === key), [key, payments])
  const monthFunding = useMemo(() => movements.filter((movement) => movement.type === 'deposit' && movement.sourceSalaryId && movement.occurredOn?.startsWith(key)), [key, movements])
  const grocerySpent = purchases.filter((purchase) => {
    const date = purchase.purchasedAt?.toDate?.()
    return date && monthKey(date) === key && Number.isFinite(purchase.price)
  }).reduce((sum, purchase) => sum + Number(purchase.price || 0), 0)
  const groceryOwnerId = household.budget?.grocerySalaryOwnerId || ''
  const envelopeTotal = envelopes.reduce((sum, envelope) => sum + Number(envelope.balance || 0), 0)
  const paidCharges = monthPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  const journalSpent = monthExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
  const memberStats = members.map((member) => {
    const salary = Number(salaryMonths.find((entry) => entry.memberId === member.uid && entry.month === key)?.amount || 0)
    const expensesSpent = monthExpenses.filter((expense) => expense.sourceType === 'salary' && expense.sourceId === member.uid).reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
    const chargesSpent = monthPayments.filter((payment) => payment.salaryOwnerId === member.uid || (!payment.salaryOwnerId && charges.find((charge) => charge.id === payment.chargeId)?.salaryOwnerId === member.uid)).reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    const envelopeFunding = monthFunding.filter((movement) => movement.sourceSalaryId === member.uid).reduce((sum, movement) => sum + Number(movement.amount || 0), 0)
    const groceries = groceryOwnerId === member.uid ? grocerySpent : 0
    const spent = expensesSpent + chargesSpent + envelopeFunding + groceries
    return { ...member, salary, spent, remaining: salary - spent }
  })
  const salaryTotal = memberStats.reduce((sum, member) => sum + member.salary, 0)
  const salaryRemaining = memberStats.reduce((sum, member) => sum + member.remaining, 0)
  const globalAvailable = salaryRemaining + envelopeTotal
  const monthSpent = journalSpent + paidCharges + grocerySpent
  const breakdown = Object.entries(monthExpenses.reduce((result, expense) => {
    result[expense.category || 'other'] = (result[expense.category || 'other'] || 0) + Number(expense.amount || 0)
    return result
  }, {})).sort((first, second) => second[1] - first[1])

  const editSalary = (member) => {
    setEditingSalary(member.uid)
    setSalaryInput(String(member.salary || ''))
  }
  const saveSalary = async (memberId) => {
    setSavingSalary(true)
    try {
      await setMonthlySalary(household.id, memberId, key, salaryInput, user.uid)
      setEditingSalary('')
      notify('Salaire mensuel mis à jour')
    } catch {
      notify('Impossible de modifier ce salaire')
    } finally {
      setSavingSalary(false)
    }
  }

  return <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-28 pt-6 sm:px-6"><AppHeader title="Budget du foyer" subtitle="Salaires, dépenses et projets au même endroit" />
    <div className="mb-4 flex items-center gap-2 rounded-2xl bg-surface p-2 shadow-sm"><button type="button" onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} className="grid h-11 w-11 place-items-center rounded-xl bg-canvas" aria-label="Mois précédent"><ChevronLeft size={20} /></button><button type="button" onClick={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))} className="min-w-0 flex-1 text-center"><small className="block text-[10px] font-black uppercase tracking-widest text-amber-600">Vue mensuelle</small><strong className="block capitalize">{month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</strong></button><button type="button" onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} className="grid h-11 w-11 place-items-center rounded-xl bg-canvas" aria-label="Mois suivant"><ChevronRight size={20} /></button></div>
    {error && <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700 dark:bg-red-950 dark:text-red-200">{error}</p>}
    {loading ? <div className="space-y-4"><div className="h-72 animate-pulse rounded-[2rem] bg-slate-200 dark:bg-slate-800" /><div className="h-32 animate-pulse rounded-[1.5rem] bg-slate-200 dark:bg-slate-800" /></div> : <>
      <section className="relative overflow-hidden rounded-[2rem] bg-[#0d1117] p-5 text-white shadow-2xl shadow-amber-900/20 sm:p-6"><div className="pointer-events-none absolute inset-0 opacity-90 [background:radial-gradient(circle_at_90%_0%,rgba(245,158,11,.38),transparent_36%),radial-gradient(circle_at_0%_100%,rgba(16,185,129,.22),transparent_42%)]" /><div className="relative"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-white/55">Disponible dans le foyer</p><p className={`mt-2 text-4xl font-black tabular-nums sm:text-5xl ${globalAvailable < 0 ? 'text-rose-300' : 'text-amber-300'}`}>{money(globalAvailable)}</p><p className="mt-2 text-xs font-semibold text-white/45">salaires restants + enveloppes cumulées</p></div><span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/10"><Landmark size={27} /></span></div><div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur"><small className="font-bold text-white/50">Reste des salaires</small><strong className={`mt-1 block text-lg tabular-nums ${salaryRemaining < 0 ? 'text-rose-300' : 'text-white'}`}>{money(salaryRemaining)}</strong></div><div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur"><small className="font-bold text-white/50">Enveloppes</small><strong className="mt-1 block text-lg tabular-nums text-emerald-300">{money(envelopeTotal)}</strong></div></div><div className="mt-3 flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs"><span className="text-white/50">Revenus saisis ce mois</span><strong>{money(salaryTotal)}</strong></div></div></section>

      <section className="mt-5"><div className="flex items-end justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-amber-600">Vos revenus</p><h2 className="text-xl font-black">Salaires du mois</h2></div><Coins className="text-amber-500" /></div><div className="mt-3 grid gap-3 sm:grid-cols-2">{memberStats.map((member, index) => <article key={member.uid} className={`rounded-[1.5rem] p-4 text-white shadow-lg ${index % 2 ? 'bg-gradient-to-br from-violet-600 to-indigo-700' : 'bg-gradient-to-br from-amber-500 to-orange-600'}`}><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15"><UserRound size={21} /></span><span className="min-w-0 flex-1"><small className="font-bold text-white/65">Salaire de</small><strong className="block truncate">{member.displayName}</strong></span><button type="button" onClick={() => editSalary(member)} className="grid h-10 w-10 place-items-center rounded-xl bg-white/15" aria-label={`Modifier le salaire de ${member.displayName}`}><Pencil size={16} /></button></div>{editingSalary === member.uid ? <div className="mt-4 flex gap-2"><input type="number" min="0" step="100" value={salaryInput} onChange={(event) => setSalaryInput(event.target.value)} className="min-h-12 min-w-0 flex-1 rounded-xl border-0 bg-white px-3 font-black text-slate-950" /><button type="button" onClick={() => saveSalary(member.uid)} disabled={savingSalary} className="grid h-12 w-12 place-items-center rounded-xl bg-slate-950/70 disabled:opacity-50"><Save size={19} /></button></div> : <><strong className="mt-4 block text-2xl font-black tabular-nums">{money(member.salary)}</strong><div className="mt-3 flex items-end justify-between border-t border-white/15 pt-3"><span><small className="block font-bold text-white/60">Dépensé / réservé</small><strong>{money(member.spent)}</strong></span><span className="text-right"><small className="block font-bold text-white/60">Reste</small><strong className={member.remaining < 0 ? 'text-rose-200' : 'text-emerald-200'}>{money(member.remaining)}</strong></span></div></>}</article>)}</div></section>

      <button type="button" onClick={() => setAdding(true)} className="mt-5 flex min-h-16 w-full items-center gap-3 rounded-[1.5rem] bg-gradient-to-r from-amber-400 to-orange-500 px-4 text-left text-white shadow-lg shadow-orange-500/20"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/20"><Plus size={23} /></span><span className="min-w-0 flex-1"><strong className="block">Ajouter une dépense</strong><small className="text-white/75">Choisir un salaire ou une enveloppe</small></span><ArrowRight size={20} /></button>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><StatLink to="/budget/expenses" icon={ReceiptText} color="bg-orange-50 text-orange-600 dark:bg-orange-950/40" value={money(monthSpent)} label="Sorties ce mois" /><StatLink to="/budget/expenses" icon={Sparkles} color="bg-rose-50 text-rose-600 dark:bg-rose-950/40" value={money(journalSpent)} label="Dépenses saisies" /><StatLink to="/budget/charges" icon={CalendarCheck} color="bg-amber-50 text-amber-600 dark:bg-amber-950/40" value={money(paidCharges)} label="Charges payées" /><StatLink to="/budget/envelopes" icon={PiggyBank} color="bg-violet-50 text-violet-600 dark:bg-violet-950/40" value={money(envelopeTotal)} label="Total enveloppes" /></div>

      <section className="mt-6 rounded-[1.75rem] bg-surface p-5 shadow-card"><div className="flex items-center justify-between"><div><h2 className="text-xl font-black">Où part l’argent ?</h2><p className="mt-1 text-xs font-semibold text-muted">Répartition des dépenses saisies</p></div><WalletCards className="text-amber-500" size={23} /></div>{breakdown.length ? <div className="mt-5 space-y-4">{breakdown.map(([category, amount]) => { const meta = categories[category] || categories.other; const width = journalSpent ? Math.max(5, Math.round(amount / journalSpent * 100)) : 0; return <div key={category}><div className="flex items-center justify-between text-sm"><strong>{meta[0]}</strong><span className="font-black tabular-nums">{money(amount)}</span></div><div className="mt-2 h-2.5 overflow-hidden rounded-full bg-canvas"><span className={`block h-full rounded-full ${meta[1]}`} style={{ width: `${width}%` }} /></div></div> })}</div> : <div className="mt-5 rounded-2xl bg-canvas p-5 text-center"><p className="text-sm font-bold">Aucune dépense pour ce mois</p><p className="mt-1 text-xs text-muted">La répartition apparaîtra dès le premier mouvement.</p></div>}</section>

      <section className="mt-5 overflow-hidden rounded-[1.75rem] bg-surface shadow-card"><div className="flex items-center gap-3 bg-gradient-to-r from-teal-500 to-emerald-500 p-4 text-white"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white/20"><ShoppingBasket size={21} /></span><span className="min-w-0 flex-1"><strong className="block">Achats T9dya</strong><small className="text-white/75">Prélevés sur {household.memberProfiles?.[groceryOwnerId]?.displayName ? `le salaire de ${household.memberProfiles[groceryOwnerId].displayName}` : 'aucun salaire défini'}</small></span><strong className="tabular-nums">{money(grocerySpent)}</strong></div><Link to="/budget/charges" className="flex items-center justify-between p-4 text-sm"><span className="text-muted">Budget courses mensuel</span><strong>{money(household.budget?.monthly)}</strong></Link></section>
    </>}
    {adding && <ExpenseSheet envelopes={envelopes} salaryMonths={salaryMonths} onClose={() => setAdding(false)} />}
  </main>
}

function StatLink({ to, icon: Icon, color, value, label }) {
  return <Link to={to} className="min-w-0 rounded-2xl bg-surface p-3 shadow-sm"><span className={`grid h-9 w-9 place-items-center rounded-xl ${color}`}><Icon size={18} /></span><strong className="mt-3 block truncate text-sm tabular-nums">{value}</strong><small className="mt-0.5 block text-[10px] font-bold leading-4 text-muted">{label}</small></Link>
}
