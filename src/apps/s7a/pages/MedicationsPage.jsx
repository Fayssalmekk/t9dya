import { useEffect, useRef, useState } from 'react'
import { Check, Minus, Pill, Plus, Trash2, X } from 'lucide-react'
import { useConfirmDialog } from '../../../context/ConfirmContext'
import { usePlatform } from '../../../context/PlatformContext'
import HealthHeader from '../components/HealthHeader'
import DoseEntrySheet from '../components/DoseEntrySheet'
import InsulinCard from '../components/InsulinCard'
import TreatmentCelebration from '../components/TreatmentCelebration'
import { useHealth } from '../context/HealthContext'
import { useAuth } from '../../../context/AuthContext'
import { useShopping } from '../../../context/ShoppingContext'
import { addShoppingItem } from '../../../services/shopping'
import { addInsulinDose, adjustMedicationStock, createMedication, deleteMedication, setMedicationCheck, updateMedication } from '../services/health'
import { localDateKey, todayKey } from '../utils/dates'
import { isMedicationDueOnDate, medicationFrequencyLabel, MEDICATION_FREQUENCIES, nextMedicationDueDate } from '../utils/medicationSchedule'

const TODAY = todayKey
const nowLocal = () => { const date = new Date(); return `${localDateKey(date)}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}` }
const createEmptyForm = () => ({
  name: '',
  stock: 1,
  lowStockThreshold: 1,
  unit: 'boîte',
  reminderTimes: ['09:00'],
  frequencyDays: 1,
  startsOn: TODAY,
  color: 'blue'
})

export default function MedicationsPage() {
  const { medications, checks, doses, healthOwnerId, activeHealthProfile } = useHealth()
  const { user, household } = useAuth()
  const { lists, allItems } = useShopping()
  const { notify } = usePlatform()
  const confirm = useConfirmDialog()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(createEmptyForm)
  const [saving, setSaving] = useState(false)
  const [busyAction, setBusyAction] = useState('')
  const [celebration, setCelebration] = useState(null)
  const [dose, setDose] = useState({ insulin: 'novorapid', units: 1, meal: '', note: '', takenAt: nowLocal() })
  const [doseOpen, setDoseOpen] = useState(false)
  const [savingDose, setSavingDose] = useState(false)
  const [targetListId, setTargetListId] = useState('')
  const celebrationTimer = useRef(null)

  useEffect(() => () => window.clearTimeout(celebrationTimer.current), [])

  const supplements = medications.filter((item) => item.kind === 'supplement')
  const insulins = medications.filter((item) => item.kind === 'insulin')
  const activeLists = lists.filter((list) => list.status !== 'completed')
  const dueSupplements = supplements.filter((item) => isMedicationDueOnDate(item, TODAY))
  const checked = new Set(checks.filter((item) => item.date === TODAY && item.taken).map((item) => item.medicationId))
  const completedCount = dueSupplements.filter((item) => checked.has(item.id)).length

  const openDose = (insulin) => {
    setDose({ insulin, units: 1, meal: '', note: '', takenAt: nowLocal() })
    setDoseOpen(true)
  }

  const saveDose = async (event) => {
    event.preventDefault()
    if (savingDose) return
    setSavingDose(true)
    try {
      await addInsulinDose(healthOwnerId, dose)
      setDoseOpen(false)
      notify('Dose réellement prise enregistrée.')
    } catch {
      notify('Impossible d’enregistrer la dose.')
    } finally {
      setSavingDose(false)
    }
  }

  const addInsulinToT9dya = async (medication) => {
    const listId = activeLists.length === 1 ? activeLists[0].id : targetListId
    if (!listId) return notify(activeLists.length ? 'Choisissez une liste T9dya.' : 'Créez d’abord une liste dans T9dya.')
    const product = { id: `pharmacy-${medication.id}`, name: medication.name, altName: '', brand: '', format: '', category: 'pharmacie', categoryName: 'Pharmacie & Santé', emoji: '💉', defaultPrice: 0, unit: medication.unit }
    const duplicate = allItems.find((item) => item.listId === listId && item.productId === product.id)
    try {
      if (!duplicate) await addShoppingItem(household.id, listId, product, user, { quantity: 1, unit: medication.unit, note: 'Stock faible · S7a ya s7a' }, null)
      await updateMedication(healthOwnerId, medication.id, { shoppingAdded: true })
      notify(duplicate ? `${medication.name} est déjà dans cette liste.` : `${medication.name} ajouté à T9dya.`)
    } catch { notify('Ajout à T9dya impossible.') }
  }

  const save = async (event) => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      await createMedication(healthOwnerId, form)
      setShowForm(false)
      setForm(createEmptyForm())
      notify('Traitement ajouté.')
    } catch {
      notify('Impossible d’ajouter ce traitement.')
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (item) => {
    const actionKey = `check:${item.id}`
    if (busyAction) return
    setBusyAction(actionKey)
    const taking = !checked.has(item.id)
    try {
      await setMedicationCheck(healthOwnerId, item.id, TODAY, taking)
      if (taking) {
        setCelebration({ name: item.name, complete: completedCount + 1 >= dueSupplements.length })
        window.clearTimeout(celebrationTimer.current)
        celebrationTimer.current = window.setTimeout(() => setCelebration(null), 1800)
      }
    } catch {
      notify('Prise non enregistrée.')
    } finally {
      setBusyAction('')
    }
  }

  const changeStock = async (item, amount) => {
    const actionKey = `stock:${item.id}`
    if (busyAction || (amount < 0 && item.stock <= 0)) return
    setBusyAction(actionKey)
    try {
      await adjustMedicationStock(healthOwnerId, item.id, amount)
    } catch {
      notify(amount < 0 ? 'Le stock ne peut pas être négatif.' : 'Stock non modifié.')
    } finally {
      setBusyAction('')
    }
  }

  const remove = async (item) => {
    const accepted = await confirm({
      title: 'Supprimer ce traitement ?',
      message: `${item.name}, son stock et ses rappels seront supprimés.`,
      confirmLabel: 'Supprimer'
    })
    if (!accepted || busyAction) return
    setBusyAction(`delete:${item.id}`)
    try {
      await deleteMedication(healthOwnerId, item.id)
      notify('Traitement supprimé.')
    } catch {
      notify('Suppression impossible.')
    } finally {
      setBusyAction('')
    }
  }

  return <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-28 pt-6 sm:px-6">
    {doseOpen && <DoseEntrySheet dose={dose} setDose={setDose} onClose={() => setDoseOpen(false)} onSubmit={saveDose} saving={savingDose} />}
    <HealthHeader title="Traitements" subtitle={activeHealthProfile?.diabetic ? 'Insuline, médicaments et compléments' : 'Médicaments, compléments et fréquences'} />
    <TreatmentCelebration celebration={celebration} />

    {activeHealthProfile?.diabetic && <section className="mb-6"><div className="mb-3"><p className="text-xs font-black uppercase tracking-[.18em] text-orange-500">Insuline</p><h2 className="text-2xl font-black">Mes traitements injectables</h2><p className="mt-1 text-sm text-muted">Enregistrez uniquement une dose réellement prise et gérez le stock des stylos.</p></div><div className="grid gap-4">{insulins.map((item) => {
      const todayDoses = doses.filter((entry) => entry.insulin === item.insulin && localDateKey(entry.takenAt?.toDate?.() || new Date(0)) === TODAY)
      const baseline = item.stockUpdatedAt?.toMillis?.() || item.createdAt?.toMillis?.() || 0
      const usedUnits = doses.filter((entry) => entry.insulin === item.insulin && (entry.takenAt?.toMillis?.() || 0) >= baseline).reduce((sum, entry) => sum + (Number(entry.units) || 0), 0)
      return <InsulinCard key={item.id} medication={item} todayCount={todayDoses.length} todayUnits={todayDoses.reduce((sum, entry) => sum + (Number(entry.units) || 0), 0)} remainingUnits={Math.max(0, (Number(item.stock) || 0) * 300 - usedUnits)} onDecrease={() => adjustMedicationStock(healthOwnerId, item.id, -1).catch(() => notify('Stock non modifié.'))} onIncrease={() => adjustMedicationStock(healthOwnerId, item.id, 1).catch(() => notify('Stock non modifié.'))} onInject={() => openDose(item.insulin)} onAddToShopping={() => addInsulinToT9dya(item)} lowStockContent={activeLists.length > 1 ? <select value={targetListId} onChange={(event) => setTargetListId(event.target.value)} className="mt-2 h-10 w-full rounded-lg border bg-white px-2 text-sm text-slate-900"><option value="">Choisir une liste</option>{activeLists.map((list) => <option key={list.id} value={list.id}>{list.title}</option>)}</select> : null} />
    })}</div><p className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">S7a enregistre votre décision ; elle ne calcule et ne recommande jamais une dose d’insuline.</p></section>}

    <section className={`rounded-[1.75rem] bg-gradient-to-br from-rose-500 to-pink-500 p-5 text-white shadow-lg transition-all duration-500 ${celebration?.complete ? 'scale-[1.02] shadow-rose-300' : ''}`}>
      <p className="text-sm font-bold text-white/75">Routine du {new Date(`${TODAY}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
      <div className="mt-2 flex items-end justify-between"><strong className="text-3xl font-black">{completedCount}/{dueSupplements.length}</strong><span className="text-sm">prises prévues</span></div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/20 shadow-inner"><div className="h-full rounded-full bg-white transition-[width] duration-700 ease-out" style={{ width: `${dueSupplements.length ? completedCount / dueSupplements.length * 100 : 0}%` }} /></div>
      {dueSupplements.length > 0 && completedCount === dueSupplements.length && <p className="mt-3 text-center text-sm font-black">Journée complétée · Excellent ! 🎉</p>}
      {!dueSupplements.length && <p className="mt-3 text-center text-sm font-bold text-white/80">Aucune prise prévue aujourd’hui</p>}
    </section>

    <button type="button" onClick={() => setShowForm(true)} className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 font-black text-white dark:bg-white dark:text-slate-900"><Plus /> Ajouter un médicament ou complément</button>

    <section className="mt-5 space-y-3">
      {supplements.map((item) => {
        const done = checked.has(item.id)
        const due = isMedicationDueOnDate(item, TODAY)
        const nextDue = !due && nextMedicationDueDate(item)
        const pending = busyAction.endsWith(`:${item.id}`)
        return <article key={item.id} className={`rounded-[1.5rem] bg-surface p-4 shadow-card transition-all duration-500 ${done ? 'ring-2 ring-emerald-300 dark:ring-emerald-800' : ''}`}>
          <div className="flex items-center gap-3">
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl transition-all duration-500 ${done ? 'rotate-[360deg] bg-emerald-500 text-white' : 'bg-rose-50 text-rose-500 dark:bg-rose-950/30'}`}>{done ? <Check /> : <Pill />}</span>
            <span className="min-w-0 flex-1"><strong className="block truncate text-lg">{item.name}</strong><small className="block text-muted">{medicationFrequencyLabel(item)} · {item.reminderTimes?.join(' · ') || 'Sans heure fixe'}</small>{nextDue && <small className="block text-rose-500">Prochaine prise le {nextDue.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</small>}</span>
            <button type="button" onClick={() => remove(item)} disabled={Boolean(busyAction)} className="grid h-11 w-11 place-items-center rounded-xl text-muted transition hover:bg-rose-50 hover:text-rose-500 disabled:opacity-40 dark:hover:bg-rose-950/30" aria-label={`Supprimer ${item.name}`}><Trash2 size={18} className={busyAction === `delete:${item.id}` ? 'animate-pulse' : ''} /></button>
          </div>
          {due && <button type="button" onClick={() => toggle(item)} disabled={Boolean(busyAction)} className={`mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-3 font-black transition-all duration-300 disabled:opacity-50 ${done ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100 dark:shadow-none' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-300'}`}>{busyAction === `check:${item.id}` ? 'Enregistrement…' : done ? <><Check size={19} /> Pris aujourd’hui · toucher pour annuler</> : <><Plus size={19} /> Marquer comme pris</>}</button>}
          <div className="mt-3 flex items-center rounded-xl bg-canvas p-1">
            <button type="button" onClick={() => changeStock(item, -1)} disabled={Boolean(busyAction) || item.stock <= 0} className="grid h-11 w-11 place-items-center rounded-lg disabled:opacity-30" aria-label={`Retirer une unité du stock de ${item.name}`}><Minus size={17} /></button>
            <span className="flex-1 text-center text-sm font-black">{pending && busyAction.startsWith('stock:') ? 'Mise à jour…' : `Stock : ${item.stock} ${item.unit}${item.stock !== 1 ? 's' : ''}`}</span>
            <button type="button" onClick={() => changeStock(item, 1)} disabled={Boolean(busyAction)} className="grid h-11 w-11 place-items-center rounded-lg disabled:opacity-30" aria-label={`Ajouter une unité au stock de ${item.name}`}><Plus size={17} /></button>
          </div>
        </article>
      })}
      {!supplements.length && <div className="rounded-[2rem] border border-dashed border-slate-300 py-14 text-center dark:border-slate-700"><Pill className="mx-auto text-rose-400" size={38} /><h2 className="mt-3 text-xl font-black">Aucun complément</h2><p className="mx-auto mt-1 max-w-xs text-sm text-muted">Ajoutez vitamine D, Ferplex, Supradyn ou votre traitement.</p></div>}
    </section>

    {showForm && <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby="medication-form-title">
      <button type="button" onClick={() => !saving && setShowForm(false)} className="absolute inset-0 bg-slate-950/50" aria-label="Fermer" />
      <form onSubmit={save} className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-surface p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.18em] text-rose-500">Ma routine</p><h2 id="medication-form-title" className="text-xl font-black">Nouveau traitement</h2></div><button type="button" onClick={() => setShowForm(false)} disabled={saving} className="grid h-11 w-11 place-items-center rounded-xl bg-canvas disabled:opacity-40" aria-label="Fermer"><X /></button></div>
        <label className="mt-5 block text-sm font-black">Nom<input value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} className="field-input mt-2" placeholder="Ex. Vitamine D" maxLength={100} required /></label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-black">Stock<input type="number" min="0" max="9999" value={form.stock} onChange={(event) => setForm((value) => ({ ...value, stock: event.target.value }))} className="field-input mt-2" required /></label>
          <label className="text-sm font-black">Unité<select value={form.unit} onChange={(event) => setForm((value) => ({ ...value, unit: event.target.value }))} className="field-input mt-2"><option>boîte</option><option>flacon</option><option>plaquette</option><option>comprimé</option><option>sachet</option></select></label>
        </div>
        <label className="mt-3 block text-sm font-black">Fréquence<select value={form.frequencyDays} onChange={(event) => setForm((value) => ({ ...value, frequencyDays: Number(event.target.value) }))} className="field-input mt-2">{MEDICATION_FREQUENCIES.map((days) => <option key={days} value={days}>{medicationFrequencyLabel({ frequencyDays: days })}</option>)}</select></label>
        <label className="mt-3 block text-sm font-black">Heure du rappel<input type="time" value={form.reminderTimes[0]} onChange={(event) => setForm((value) => ({ ...value, reminderTimes: [event.target.value] }))} className="field-input mt-2" /></label>
        <button disabled={saving} className="mt-5 min-h-12 w-full rounded-xl bg-rose-500 px-4 font-black text-white disabled:opacity-60">{saving ? 'Ajout en cours…' : 'Ajouter à ma routine'}</button>
      </form>
    </div>}
  </main>
}
