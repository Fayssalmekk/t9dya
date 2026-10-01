import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, CalendarDays, PiggyBank, TrendingUp, Wallet } from 'lucide-react'
import AppHeader from '../components/AppHeader'
import { useAuth } from '../context/AuthContext'
import { useShopping } from '../context/ShoppingContext'
import { setMonthlyBudget } from '../services/shopping'

const chartColors = ['#0d9488', '#f59e0b', '#8b5cf6', '#ef4444', '#0ea5e9', '#f97316', '#22c55e']
const monthKey = (date) => `${date.getFullYear()}-${date.getMonth()}`

export default function BudgetPage() {
  const { household } = useAuth()
  const { purchases, purchasesLoading } = useShopping()
  const [editing, setEditing] = useState(false)
  const [budgetInput, setBudgetInput] = useState(household.budget?.monthly || '')
  const [saving, setSaving] = useState(false)
  const now = useMemo(() => new Date(), [])

  const currentPurchases = useMemo(() => purchases.filter((purchase) => {
    const date = purchase.purchasedAt?.toDate?.()
    return date && monthKey(date) === monthKey(now) && Number.isFinite(purchase.price)
  }), [now, purchases])
  const spent = currentPurchases.reduce((sum, purchase) => sum + purchase.price, 0)
  const budget = Number(household.budget?.monthly || 0)
  const percentage = budget ? Math.round((spent / budget) * 100) : 0
  const remaining = Math.max(0, budget - spent)
  const dailyAverage = spent / Math.max(1, now.getDate())
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const projection = dailyAverage * daysInMonth

  const categoryData = useMemo(() => Object.values(currentPurchases.reduce((groups, purchase) => {
    const key = purchase.categoryName || 'Autres'
    groups[key] ||= { name: key, value: 0 }
    groups[key].value += purchase.price
    return groups
  }, {})).sort((a, b) => b.value - a.value), [currentPurchases])

  const storeData = useMemo(() => Object.values(currentPurchases.reduce((groups, purchase) => {
    const key = purchase.store || 'Autre'
    groups[key] ||= { name: key, total: 0 }
    groups[key].total += purchase.price
    return groups
  }, {})).sort((a, b) => b.total - a.total).slice(0, 6), [currentPurchases])

  const saveBudget = async (event) => {
    event.preventDefault()
    setSaving(true)
    await setMonthlyBudget(household.id, budgetInput)
    setSaving(false)
    setEditing(false)
  }

  const ringColor = percentage >= 100 ? '#ef4444' : percentage >= 75 ? '#f59e0b' : '#0d9488'

  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-28 pt-6 sm:px-6">
      <AppHeader title="Budget" subtitle={now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} />

      <section className="rounded-[1.75rem] bg-surface p-5 shadow-card sm:p-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="relative grid h-44 w-44 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(${ringColor} ${Math.min(percentage, 100) * 3.6}deg, rgb(var(--color-canvas)) 0deg)` }}>
            <div className="grid h-32 w-32 place-items-center rounded-full bg-surface text-center"><div><p className="text-3xl font-black tabular-nums">{percentage}%</p><p className="text-xs font-bold text-muted">du budget</p></div></div>
          </div>
          <div className="w-full flex-1 text-center sm:text-left">
            <p className="text-sm font-bold text-muted">Dépensé ce mois</p><p className="mt-1 text-4xl font-black tabular-nums">{spent.toFixed(2)} <span className="text-lg text-muted">DH</span></p>
            {budget > 0 ? <p className="mt-2 font-semibold text-muted">Il reste <strong className="text-ink">{remaining.toFixed(2)} DH</strong> sur {budget.toFixed(0)} DH</p> : <p className="mt-2 text-sm text-amber-600">Définissez votre budget mensuel pour suivre votre rythme.</p>}
            <button type="button" onClick={() => setEditing((value) => !value)} className="mt-4 min-h-11 rounded-xl bg-accent-50 px-4 text-sm font-extrabold text-accent-700">{budget ? 'Modifier le budget' : 'Définir le budget'}</button>
          </div>
        </div>
        {editing && <form onSubmit={saveBudget} className="mt-5 flex gap-2 rounded-2xl bg-canvas p-3"><label className="flex-1"><span className="sr-only">Budget mensuel</span><input type="number" min="0" step="50" value={budgetInput} onChange={(event) => setBudgetInput(event.target.value)} required placeholder="3000" className="min-h-12 w-full rounded-xl border border-slate-200 bg-surface px-4 font-bold dark:border-slate-700" /></label><button disabled={saving} className="min-h-12 rounded-xl bg-accent-600 px-5 font-bold text-white">{saving ? '…' : 'Enregistrer'}</button></form>}
      </section>

      {percentage >= 75 && budget > 0 && <div className={`mt-4 flex gap-3 rounded-2xl p-4 text-sm font-semibold ${percentage >= 100 ? 'bg-red-50 text-red-700 dark:bg-red-950' : 'bg-amber-50 text-amber-700 dark:bg-amber-950'}`}><AlertTriangle className="shrink-0" size={20} /><span>{percentage >= 100 ? 'Budget dépassé. Regardez les catégories les plus élevées ci-dessous.' : 'Vous avez utilisé plus de 75 % de votre budget mensuel.'}</span></div>}

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Metric icon={CalendarDays} label="Moy./jour" value={`${dailyAverage.toFixed(0)} DH`} />
        <Metric icon={TrendingUp} label="Projection" value={`${projection.toFixed(0)} DH`} />
        <Metric icon={Wallet} label="Achats" value={currentPurchases.length} />
      </div>

      {purchasesLoading ? <div className="mt-6 h-72 animate-pulse rounded-[1.75rem] bg-slate-200 dark:bg-slate-800" /> : currentPurchases.length === 0 ? <section className="mt-6 rounded-[1.75rem] bg-surface p-8 text-center shadow-card"><PiggyBank className="mx-auto text-accent-600" size={48} /><h2 className="mt-4 text-lg font-extrabold">Aucune dépense ce mois-ci</h2><p className="mt-2 text-sm text-muted">Les prix confirmés depuis la liste apparaîtront ici automatiquement.</p></section> : (
        <>
          <section className="mt-6 rounded-[1.75rem] bg-surface p-5 shadow-card"><h2 className="font-extrabold">Dépenses par catégorie</h2><div className="mt-4 h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={90} paddingAngle={3}>{categoryData.map((entry, index) => <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip formatter={(value) => [`${Number(value).toFixed(2)} DH`, 'Dépense']} /></PieChart></ResponsiveContainer></div><div className="grid grid-cols-2 gap-2">{categoryData.slice(0, 6).map((entry, index) => <div key={entry.name} className="flex items-center gap-2 text-xs"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} /><span className="min-w-0 flex-1 truncate text-muted">{entry.name}</span><strong>{entry.value.toFixed(0)}</strong></div>)}</div></section>
          <section className="mt-4 rounded-[1.75rem] bg-surface p-5 shadow-card"><h2 className="font-extrabold">Par magasin</h2><div className="mt-5 h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={storeData} margin={{ left: -20 }}><CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip formatter={(value) => [`${Number(value).toFixed(2)} DH`, 'Total']} /><Bar dataKey="total" fill="#0d9488" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div></section>
        </>
      )}
    </main>
  )
}

function Metric({ icon: Icon, label, value }) {
  return <div className="rounded-2xl bg-surface p-3 text-center shadow-sm"><Icon className="mx-auto text-accent-600" size={19} /><strong className="mt-2 block truncate text-sm">{value}</strong><span className="mt-1 block text-[10px] font-bold uppercase text-muted">{label}</span></div>
}
