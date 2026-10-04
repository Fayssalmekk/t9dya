import { useMemo, useState } from 'react'
import { CalendarCheck, Check, ChevronLeft, ChevronRight, Pencil, Plus, ReceiptText, ShoppingBasket } from 'lucide-react'
import AppHeader from '../components/AppHeader'
import ChargeSheet from '../components/ChargeSheet'
import { useAuth } from '../context/AuthContext'
import { usePlatform } from '../context/PlatformContext'
import { useShopping } from '../context/ShoppingContext'
import { useHouseholdBudget } from '../hooks/useHouseholdBudget'
import { markChargePaid, setGrocerySalaryOwner, unmarkChargePaid } from '../services/budget'
import { setMonthlyBudget } from '../services/shopping'

const money = (value) => `${Number(value || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} DH`
const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

export default function ChargesPage() {
  const { household, user } = useAuth()
  const { notify } = usePlatform()
  const { purchases } = useShopping()
  const { charges, payments, loading, error } = useHouseholdBudget(household, user.uid)
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [showNew, setShowNew] = useState(false)
  const [editing, setEditing] = useState(null)
  const [editingGroceries, setEditingGroceries] = useState(false)
  const [groceryInput, setGroceryInput] = useState(household.budget?.monthly || '')
  const [busy, setBusy] = useState('')
  const [saving, setSaving] = useState(false)
  const members = (household.members || []).map((uid) => household.memberProfiles?.[uid]).filter(Boolean)
  const key = monthKey(month)
  const monthPayments = useMemo(() => payments.filter((payment) => payment.month === key), [key, payments])
  const paidByCharge = useMemo(() => new Map(monthPayments.map((payment) => [payment.chargeId, payment])), [monthPayments])
  const groceryBudget = Number(household.budget?.monthly || 0)
  const grocerySpent = purchases.filter((purchase) => {
    const date = purchase.purchasedAt?.toDate?.()
    return date && monthKey(date) === key && Number.isFinite(purchase.price)
  }).reduce((total, purchase) => total + purchase.price, 0)
  const chargesTotal = charges.reduce((total, charge) => total + Number(charge.amount || 0), 0)
  const plannedTotal = chargesTotal + groceryBudget
  const paidTotal = monthPayments.reduce((total, payment) => total + Number(payment.amount || 0), 0) + grocerySpent
  const remaining = plannedTotal - paidTotal
  const paidCount = charges.filter((charge) => paidByCharge.has(charge.id)).length
  const groceryProgress = groceryBudget ? Math.round((grocerySpent / groceryBudget) * 100) : 0

  const shiftMonth = (offset) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1))

  const togglePaid = async (charge) => {
    setBusy(charge.id)
    try {
      if (paidByCharge.has(charge.id)) {
        await unmarkChargePaid(household.id, charge.id, key)
        notify(`${charge.name} remise à payer`)
      } else {
        await markChargePaid(household.id, charge, key, user.uid)
        notify(`${charge.name} marquée comme payée`)
      }
    } catch {
      notify('Impossible de modifier cette charge')
    } finally {
      setBusy('')
    }
  }

  const saveGroceryBudget = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      await setMonthlyBudget(household.id, groceryInput)
      setEditingGroceries(false)
      notify('Budget T9dya mis à jour')
    } catch {
      notify('Impossible de modifier le budget T9dya')
    } finally {
      setSaving(false)
    }
  }

  const changeGroceryOwner = async (memberId) => {
    try {
      await setGrocerySalaryOwner(household.id, memberId)
      notify('Salaire T9dya mis à jour')
    } catch {
      notify('Impossible de modifier la source T9dya')
    }
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-28 pt-6 sm:px-6">
      <AppHeader title="Charges" subtitle="Vos paiements qui reviennent chaque mois" />

      <div className="flex items-center gap-2 rounded-2xl bg-surface p-2 shadow-sm"><button type="button" onClick={() => shiftMonth(-1)} className="grid h-11 w-11 place-items-center rounded-xl bg-canvas" aria-label="Mois précédent"><ChevronLeft size={20} /></button><button type="button" onClick={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))} className="min-w-0 flex-1 text-center"><small className="block text-[10px] font-black uppercase tracking-widest text-amber-600">Mois affiché</small><strong className="mt-0.5 block capitalize">{month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</strong></button><button type="button" onClick={() => shiftMonth(1)} className="grid h-11 w-11 place-items-center rounded-xl bg-canvas" aria-label="Mois suivant"><ChevronRight size={20} /></button></div>

      {error && <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700 dark:bg-red-950 dark:text-red-200">{error}</p>}
      {loading ? <div className="mt-5 space-y-3"><div className="h-40 animate-pulse rounded-[1.75rem] bg-slate-200 dark:bg-slate-800" /><div className="h-20 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" /></div> : <>
        <section className="mt-5 overflow-hidden rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-xl dark:bg-slate-900"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-white/60">Total prévu ce mois</p><p className="mt-1 text-4xl font-black tabular-nums">{money(plannedTotal)}</p></div><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10"><ReceiptText size={24} /></span></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-white/10 p-3"><small className="font-bold text-white/55">Déjà payé</small><strong className="mt-1 block text-lg tabular-nums text-emerald-300">{money(paidTotal)}</strong></div><div className="rounded-2xl bg-white/10 p-3"><small className="font-bold text-white/55">Reste à payer</small><strong className={`mt-1 block text-lg tabular-nums ${remaining < 0 ? 'text-rose-300' : ''}`}>{money(Math.max(remaining, 0))}</strong></div></div></section>

        <section className="mt-4 rounded-[1.5rem] bg-gradient-to-br from-teal-500 to-emerald-600 p-4 text-white shadow-lg shadow-teal-600/15"><div className="flex items-center gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/20 text-2xl">🛒</span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-widest text-white/70">Calcul automatique</p><h2 className="font-black">T9dya</h2></div><strong className="text-lg tabular-nums">{money(groceryBudget)}</strong></div><p className="mt-1 text-xs text-white/75">{money(grocerySpent)} utilisés selon les achats enregistrés</p></div></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20"><span className="block h-full rounded-full bg-white" style={{ width: `${Math.min(groceryProgress, 100)}%` }} /></div><label className="mt-3 block text-xs font-extrabold text-white/80">Prélever les courses sur<select value={household.budget?.grocerySalaryOwnerId || ''} onChange={(event) => changeGroceryOwner(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-white/20 bg-white px-3 font-bold text-slate-900"><option value="">Choisir un salaire</option>{members.map((member) => <option key={member.uid} value={member.uid}>Salaire de {member.displayName}</option>)}</select></label><button type="button" onClick={() => setEditingGroceries((current) => !current)} className="mt-3 text-xs font-extrabold underline decoration-white/50 underline-offset-4">Modifier le budget courses</button>{editingGroceries && <form onSubmit={saveGroceryBudget} className="mt-3 flex gap-2 rounded-xl bg-white/15 p-2"><input required type="number" min="0" step="50" value={groceryInput} onChange={(event) => setGroceryInput(event.target.value)} className="min-h-11 min-w-0 flex-1 rounded-lg border-0 bg-white px-3 font-bold text-slate-900" aria-label="Budget T9dya" /><button disabled={saving} className="rounded-lg bg-slate-950 px-4 text-sm font-extrabold">{saving ? '…' : 'Valider'}</button></form>}</section>

        <div className="mt-6 flex items-center justify-between"><div><h2 className="text-xl font-black">Charges fixes</h2><p className="mt-1 text-xs font-semibold text-muted">{paidCount} sur {charges.length} payées ce mois</p></div><button type="button" onClick={() => setShowNew(true)} className="flex min-h-11 items-center gap-2 rounded-xl bg-amber-500 px-4 text-sm font-extrabold text-white"><Plus size={18} />Ajouter</button></div>

        <div className="mt-3 space-y-3">{charges.map((charge) => {
          const paid = paidByCharge.has(charge.id)
          const salaryName = household.memberProfiles?.[charge.salaryOwnerId]?.displayName
          return <article key={charge.id} className={`flex items-center gap-3 rounded-2xl p-3.5 transition ${paid ? 'bg-emerald-50 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:ring-emerald-900' : 'bg-surface shadow-sm'}`}><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-canvas text-2xl">{charge.icon}</span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className={`truncate font-extrabold ${paid ? 'text-muted line-through' : ''}`}>{charge.name}</h3>{Number(charge.amount) === 0 && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black uppercase text-amber-700">À définir</span>}</div><p className="mt-1 text-xs text-muted">Le {charge.dueDay} · {salaryName ? `salaire de ${salaryName}` : 'salaire à choisir'}</p><strong className="mt-1 block tabular-nums">{money(charge.amount)}</strong></div><button type="button" onClick={() => setEditing(charge)} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-muted" aria-label={`Modifier ${charge.name}`}><Pencil size={17} /></button><button type="button" onClick={() => togglePaid(charge)} disabled={busy === charge.id || Number(charge.amount) <= 0 || !charge.salaryOwnerId} className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border-2 disabled:opacity-40 ${paid ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 bg-surface text-slate-300 dark:border-slate-700'}`} aria-label={paid ? `Marquer ${charge.name} non payée` : `Marquer ${charge.name} payée`}>{paid ? <Check size={22} strokeWidth={3} /> : <CalendarCheck size={20} />}</button></article>
        })}</div>

        {charges.length === 0 && <div className="mt-4 rounded-[1.5rem] bg-surface p-8 text-center shadow-card"><ShoppingBasket className="mx-auto text-amber-500" size={42} /><h2 className="mt-3 font-black">Aucune charge fixe</h2><p className="mt-2 text-sm text-muted">Ajoutez le loyer, le crédit ou toute dépense qui revient chaque mois.</p></div>}
      </>}

      {(showNew || editing) && <ChargeSheet charge={editing} onClose={() => { setShowNew(false); setEditing(null) }} />}
    </main>
  )
}
