import { useEffect, useRef, useState } from 'react'
import { Check, Minus, Pill, Plus, Trash2, X } from 'lucide-react'
import HealthHeader from '../components/HealthHeader'
import TreatmentCelebration from '../components/TreatmentCelebration'
import { useHealth } from '../context/HealthContext'
import { usePlatform } from '../../../context/PlatformContext'
import { adjustMedicationStock, createMedication, deleteMedication, setMedicationCheck } from '../services/health'
import { todayKey } from '../utils/dates'
import { isMedicationDueOnDate, medicationFrequencyLabel, MEDICATION_FREQUENCIES, nextMedicationDueDate } from '../utils/medicationSchedule'

const TODAY = todayKey

export default function MedicationsPage() {
  const { medications, checks, healthOwnerId } = useHealth()
  const { notify } = usePlatform()
  const [showForm, setShowForm] = useState(false)
  const [celebration, setCelebration] = useState(null)
  const celebrationTimer = useRef(null)
  useEffect(() => () => window.clearTimeout(celebrationTimer.current), [])
  const emptyForm = () => ({ name: '', stock: 1, lowStockThreshold: 1, unit: 'boîte', reminderTimes: ['09:00'], frequencyDays: 1, startsOn: TODAY, color: 'blue' })
  const [form, setForm] = useState(emptyForm)
  const supplements = medications.filter((item) => item.kind === 'supplement')
  const dueSupplements = supplements.filter((item) => isMedicationDueOnDate(item, TODAY))
  const checked = new Set(checks.filter((item) => item.date === TODAY && item.taken).map((item) => item.medicationId))
  const completedCount = dueSupplements.filter((item) => checked.has(item.id)).length
  const save = async (event) => { event.preventDefault(); try { await createMedication(healthOwnerId, form); setShowForm(false); setForm(emptyForm()); notify('Traitement ajouté.') } catch { notify('Impossible d’ajouter ce traitement.') } }
  const toggle = async (item) => {
    const taking = !checked.has(item.id)
    try {
      await setMedicationCheck(healthOwnerId, item.id, TODAY, taking)
      if (taking) {
        setCelebration({ name: item.name, complete: completedCount + 1 >= dueSupplements.length })
        window.clearTimeout(celebrationTimer.current)
        celebrationTimer.current = window.setTimeout(() => setCelebration(null), 1800)
      }
    } catch { notify('Prise non enregistrée.') }
  }

  return <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-28 pt-6 sm:px-6"><HealthHeader title="Traitements" subtitle="Compléments, médicaments et fréquences" />
    <TreatmentCelebration celebration={celebration} />
    <section className={`rounded-[1.75rem] bg-gradient-to-br from-rose-500 to-pink-500 p-5 text-white shadow-lg transition-all duration-500 ${celebration?.complete ? 'scale-[1.02] shadow-rose-300' : ''}`}><p className="text-sm font-bold text-white/75">Routine du {new Date(`${TODAY}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p><div className="mt-2 flex items-end justify-between"><strong className="text-3xl font-black">{completedCount}/{dueSupplements.length}</strong><span className="text-sm">prises prévues</span></div><div className="mt-3 h-3 overflow-hidden rounded-full bg-white/20 shadow-inner"><div className="h-full rounded-full bg-white transition-[width] duration-700 ease-out" style={{ width: `${dueSupplements.length ? completedCount / dueSupplements.length * 100 : 0}%` }} /></div>{dueSupplements.length > 0 && completedCount === dueSupplements.length && <p className="mt-3 text-center text-sm font-black">Journée complétée · Excellent ! 🎉</p>}{!dueSupplements.length && <p className="mt-3 text-center text-sm font-bold text-white/80">Aucune prise prévue aujourd’hui</p>}</section>
    <button type="button" onClick={() => setShowForm(true)} className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 font-black text-white dark:bg-white dark:text-slate-900"><Plus /> Ajouter un traitement</button>
    <section className="mt-5 space-y-3">{supplements.map((item) => { const done = checked.has(item.id); const due = isMedicationDueOnDate(item, TODAY); const nextDue = !due && nextMedicationDueDate(item); return <article key={item.id} className={`rounded-[1.5rem] bg-surface p-4 shadow-card transition-all duration-500 ${done ? 'ring-2 ring-emerald-300 dark:ring-emerald-800' : ''}`}><div className="flex items-center gap-3"><span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl transition-all duration-500 ${done ? 'rotate-[360deg] bg-emerald-500 text-white' : 'bg-rose-50 text-rose-500 dark:bg-rose-950/30'}`}>{done ? <Check /> : <Pill />}</span><span className="min-w-0 flex-1"><strong className="block truncate text-lg">{item.name}</strong><small className="block text-muted">{medicationFrequencyLabel(item)} · {item.reminderTimes?.join(' · ') || 'Sans heure fixe'}</small>{nextDue && <small className="block text-rose-500">Prochaine prise le {nextDue.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</small>}</span><button type="button" onClick={() => { if (window.confirm(`Supprimer ${item.name} ?`)) deleteMedication(healthOwnerId, item.id).catch(() => notify('Suppression impossible.')) }} className="grid h-10 w-10 place-items-center text-muted"><Trash2 size={17} /></button></div>{due && <button type="button" onClick={() => toggle(item)} className={`mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl font-black transition-all duration-300 ${done ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100 dark:shadow-none' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-300'}`}>{done ? <><Check size={19} /> Pris aujourd’hui · toucher pour annuler</> : <><Plus size={19} /> Marquer comme pris</>}</button>}<div className="mt-3 flex items-center rounded-xl bg-canvas p-1"><button type="button" onClick={() => adjustMedicationStock(healthOwnerId, item.id, -1).catch(() => notify('Le stock ne peut pas être négatif.'))} disabled={item.stock <= 0} className="grid h-10 w-10 place-items-center disabled:opacity-30"><Minus size={17} /></button><span className="flex-1 text-center text-sm font-black">Stock : {item.stock} {item.unit}{item.stock !== 1 ? 's' : ''}</span><button type="button" onClick={() => adjustMedicationStock(healthOwnerId, item.id, 1).catch(() => notify('Stock non modifié.'))} className="grid h-10 w-10 place-items-center"><Plus size={17} /></button></div></article> })}{!supplements.length && <div className="rounded-[2rem] border border-dashed border-slate-300 py-14 text-center dark:border-slate-700"><Pill className="mx-auto text-rose-400" size={38} /><h2 className="mt-3 text-xl font-black">Aucun complément</h2><p className="mt-1 text-sm text-muted">Ajoutez vitamine D, Ferplex, Supradyn ou votre traitement.</p></div>}</section>
    {showForm && <div className="fixed inset-0 z-50 flex items-end justify-center"><button type="button" onClick={() => setShowForm(false)} className="absolute inset-0 bg-slate-950/50" aria-label="Fermer" /><form onSubmit={save} className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-surface p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]"><div className="flex items-center justify-between"><h2 className="text-xl font-black">Nouveau traitement</h2><button type="button" onClick={() => setShowForm(false)}><X /></button></div><label className="mt-5 block text-sm font-black">Nom<input value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} className="field-input mt-2" placeholder="Ex. Vitamine D" maxLength={100} required /></label><div className="mt-3 grid grid-cols-2 gap-2"><label className="text-sm font-black">Stock<input type="number" min="0" value={form.stock} onChange={(event) => setForm((value) => ({ ...value, stock: event.target.value }))} className="field-input mt-2" /></label><label className="text-sm font-black">Unité<select value={form.unit} onChange={(event) => setForm((value) => ({ ...value, unit: event.target.value }))} className="field-input mt-2"><option>boîte</option><option>flacon</option><option>plaquette</option><option>comprimé</option><option>sachet</option></select></label></div><label className="mt-3 block text-sm font-black">Fréquence<select value={form.frequencyDays} onChange={(event) => setForm((value) => ({ ...value, frequencyDays: Number(event.target.value) }))} className="field-input mt-2">{MEDICATION_FREQUENCIES.map((days) => <option key={days} value={days}>{medicationFrequencyLabel({ frequencyDays: days })}</option>)}</select></label><label className="mt-3 block text-sm font-black">Heure du rappel<input type="time" value={form.reminderTimes[0]} onChange={(event) => setForm((value) => ({ ...value, reminderTimes: [event.target.value] }))} className="field-input mt-2" /></label><button className="mt-5 min-h-12 w-full rounded-xl bg-rose-500 font-black text-white">Ajouter à ma routine</button></form></div>}
  </main>
}
