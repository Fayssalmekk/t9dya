import { useMemo, useState } from 'react'
import { Activity, AlertTriangle, ArrowLeft, ArrowRight, CalendarClock, Camera, Check, ChevronDown, ChevronRight, Droplets, ImagePlus, LoaderCircle, PackageSearch, Pill, Save, Sparkles, Syringe, Trash2, Trophy, Utensils, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import HealthHeader from '../components/HealthHeader'
import { WaterEditor, WaterTodayCard } from '../components/WaterTracker'
import { useHealth } from '../context/HealthContext'
import { usePlatform } from '../../../context/PlatformContext'
import { useConfirmDialog } from '../../../context/ConfirmContext'
import { addGlucoseReading, deleteJournalEntry, saveMealAnalysis, setMedicationCheck, setWaterIntake } from '../services/health'
import { estimateMeal } from '../services/ai'
import { prepareMealPhoto } from '../utils/images'
import { localDateKey, todayKey } from '../utils/dates'
import { isMedicationDueOnDate, medicationFrequencyLabel } from '../utils/medicationSchedule'

const TODAY = todayKey
const MS_DAY = 86400000
const timeForDay = (day) => { const now = new Date(); return `${day}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}` }
const timestampKey = (value) => value?.toDate ? localDateKey(value.toDate()) : ''
const mealDraft = (day) => ({ image: '', description: '', name: '', carbs: '', protein: '', carbsMin: '', carbsMax: '', confidence: '', eatenAt: timeForDay(day), assumptions: [] })
const readingDraft = (day) => ({ value: '', unit: 'mg/dL', trend: 'stable', source: 'Libre 2', note: '', recordedAt: timeForDay(day) })

function MacroCard({ icon: Icon, label, value, unit, tone, onClick }) {
  return <button type="button" onClick={onClick} className={`rounded-[1.4rem] p-4 text-left text-white shadow-lg transition active:scale-[.98] ${tone}`}><span className="flex items-center justify-between"><Icon size={20} /><small className="flex items-center gap-0.5 rounded-full bg-white/15 px-2 py-1 text-[9px] font-black">Ajouter <ChevronRight size={11} /></small></span><p className="mt-4 text-[10px] font-black uppercase tracking-wider text-white/70">{label}</p><strong className="mt-1 block text-2xl font-black tabular-nums">{value} <small className="text-sm text-white/75">{unit}</small></strong></button>
}

export default function TodayPage() {
  const { readings, doses, medications, checks, appointments, meals, waterEntries, badHabits, error, healthOwnerId, activeHealthProfile } = useHealth()
  const { notify } = usePlatform()
  const confirm = useConfirmDialog()
  const [day, setDay] = useState(TODAY)
  const [dialog, setDialog] = useState('')
  const [reading, setReading] = useState(() => readingDraft(TODAY))
  const [meal, setMeal] = useState(() => mealDraft(TODAY))
  const [waterDraft, setWaterDraft] = useState(0)
  const [saving, setSaving] = useState('')
  const [analysing, setAnalysing] = useState(false)
  const [deletingId, setDeletingId] = useState('')

  const diabetic = Boolean(activeHealthProfile?.diabetic)
  const dayData = useMemo(() => ({
    readings: diabetic ? readings.filter((item) => timestampKey(item.recordedAt) === day) : [],
    doses: diabetic ? doses.filter((item) => timestampKey(item.takenAt) === day) : [],
    meals: meals.filter((item) => timestampKey(item.eatenAt) === day)
  }), [day, diabetic, doses, meals, readings])
  const dayWater = waterEntries.find((item) => item.date === day)?.amountMl || 0
  const totals = dayData.meals.reduce((result, item) => ({ carbs: result.carbs + (Number(item.carbs) || 0), protein: result.protein + (Number(item.protein) || 0) }), { carbs: 0, protein: 0 })
  const rapidUnits = dayData.doses.filter((item) => item.insulin === 'novorapid').reduce((sum, item) => sum + (Number(item.units) || 0), 0)
  const latestReading = dayData.readings[0]
  const allSupplements = medications.filter((item) => item.kind === 'supplement')
  const supplements = allSupplements.filter((item) => isMedicationDueOnDate(item, day))
  const checked = new Set(checks.filter((item) => item.date === day && item.taken).map((item) => item.medicationId))
  const lowStocks = medications.filter((item) => (diabetic || item.kind !== 'insulin') && item.stockInitialized && item.stock <= item.lowStockThreshold)
  const upcoming = appointments.filter((item) => { const days = Math.ceil((new Date(`${item.date}T12:00:00`) - new Date(`${TODAY}T12:00:00`)) / MS_DAY); return days >= 0 && days <= item.reminderDays }).slice(0, 3)
  const strongestHabit = badHabits.map((item) => ({ ...item, days: Math.max(0, Math.floor((new Date(`${TODAY}T12:00:00`) - new Date(`${item.lastOccurredOn}T12:00:00`)) / MS_DAY)) })).sort((a, b) => b.days - a.days)[0]

  const moveDay = (amount) => { const date = new Date(`${day}T12:00:00`); date.setDate(date.getDate() + amount); const next = localDateKey(date); if (next <= TODAY) setDay(next) }
  const openMeal = () => { setMeal(mealDraft(day)); setDialog('meal') }
  const openReading = () => { if (!diabetic) return; setReading(readingDraft(day)); setDialog('reading') }
  const openWater = () => { setWaterDraft(dayWater); setDialog('water') }
  const closeDialog = () => { if (!saving) setDialog('') }
  const toggle = async (medication) => { try { await setMedicationCheck(healthOwnerId, medication.id, day, !checked.has(medication.id)) } catch { notify('Impossible d’enregistrer la prise.') } }

  const saveReading = async (event) => {
    event.preventDefault(); if (saving || !diabetic) return; setSaving('reading')
    try { await addGlucoseReading(healthOwnerId, reading); setDialog(''); notify('Glycémie enregistrée.') } catch { notify('Enregistrement impossible.') } finally { setSaving('') }
  }
  const analyse = async (selectedImage = meal.image) => {
    if (!selectedImage || analysing) return
    setAnalysing(true)
    try {
      const result = await estimateMeal(selectedImage, meal.description)
      setMeal((value) => ({ ...value, image: selectedImage, name: result.dish_name, carbs: result.estimated_carbs_g, protein: result.estimated_protein_g, carbsMin: result.range_min_g, carbsMax: result.range_max_g, confidence: result.confidence, assumptions: result.assumptions }))
    } catch { notify('Analyse indisponible. Vous pouvez remplir protéines et glucides manuellement.') } finally { setAnalysing(false) }
  }
  const selectMealPhoto = async (file) => {
    if (!file || analysing) return
    let image = ''
    try { image = await prepareMealPhoto(file); setMeal((value) => ({ ...value, image })); await analyse(image) } catch { if (!image) notify('Photo non compatible.') }
  }
  const saveMeal = async (event) => {
    event.preventDefault(); if (saving) return; setSaving('meal')
    try {
      await saveMealAnalysis(healthOwnerId, { ...meal, name: meal.name.trim() || meal.description.trim() || 'Repas', thumb: meal.image })
      setDialog(''); setMeal(mealDraft(day)); notify('Repas enregistré.')
    } catch { notify('Impossible d’enregistrer le repas.') } finally { setSaving('') }
  }
  const saveWater = async (event) => {
    event.preventDefault(); if (saving) return; setSaving('water')
    try { await setWaterIntake(healthOwnerId, day, waterDraft); setDialog(''); notify('Hydratation enregistrée.') } catch { notify('Impossible d’enregistrer l’eau bue.') } finally { setSaving('') }
  }
  const removeJournalEntry = async (item) => {
    const accepted = await confirm({ title: 'Supprimer cette entrée ?', message: `${item.title} sera retiré du journal de cette journée.`, confirmLabel: 'Supprimer' })
    if (!accepted || deletingId) return
    setDeletingId(item.id)
    try { await deleteJournalEntry(healthOwnerId, item.collection, item.id); notify('Entrée supprimée.') } catch { notify('Suppression impossible.') } finally { setDeletingId('') }
  }

  const journal = [
    ...dayData.meals.map((item) => ({ id: item.id, collection: 'mealAnalyses', time: item.eatenAt, icon: '🍽️', title: item.name, text: `${Number(item.protein) || 0} g protéines · ${Number(item.carbs) || 0} g glucides` })),
    ...dayData.readings.map((item) => ({ id: item.id, collection: 'healthReadings', time: item.recordedAt, icon: '🩸', title: `${item.value} ${item.unit}`, text: `${item.source} · ${item.trend}` })),
    ...dayData.doses.map((item) => ({ id: item.id, collection: 'insulinDoses', time: item.takenAt, icon: '💉', title: `${item.units} unités · ${item.insulin === 'novorapid' ? 'NovoRapid' : 'Tresiba'}`, text: item.meal || item.note || 'Dose enregistrée' }))
  ].sort((a, b) => (b.time?.toMillis?.() || 0) - (a.time?.toMillis?.() || 0))

  return <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-28 pt-6 sm:px-6"><HealthHeader title="Aujourd’hui" subtitle="Repas, eau, traitements et suivi personnel" />
    {error && <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700 dark:bg-red-950/30 dark:text-red-200">{error}</p>}
    <section className="mb-5 flex items-center justify-between rounded-2xl bg-surface p-2 shadow-sm"><button type="button" onClick={() => moveDay(-1)} className="grid h-11 w-11 place-items-center rounded-xl bg-canvas" aria-label="Jour précédent"><ArrowLeft /></button><div className="px-2 text-center"><strong className="block capitalize">{day === TODAY ? 'Aujourd’hui' : new Date(`${day}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</strong><small className="text-muted">Journal quotidien</small></div><button type="button" onClick={() => moveDay(1)} disabled={day === TODAY} className="grid h-11 w-11 place-items-center rounded-xl bg-canvas disabled:opacity-30" aria-label="Jour suivant"><ArrowRight /></button></section>

    {diabetic && <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><strong>Journal personnel uniquement.</strong> S7a ne calcule aucune dose et ne remplace pas les consignes de votre professionnel de santé.</p>}
    {day === TODAY && (lowStocks.length > 0 || upcoming.length > 0) && <section className="mb-5 space-y-2">{lowStocks.map((item) => <Link key={item.id} to="/s7a/medications" className="flex items-center gap-3 rounded-2xl bg-orange-50 p-4 text-orange-900 dark:bg-orange-950/30 dark:text-orange-200"><PackageSearch size={21} /><span className="min-w-0 flex-1"><strong className="block">Stock faible · {item.name}</strong><small>{item.stock} {item.unit}{item.stock !== 1 ? 's' : ''} restant{item.stock !== 1 ? 's' : ''}</small></span><ChevronRight /></Link>)}{upcoming.map((item) => <Link key={item.id} to="/s7a/appointments" className="flex items-center gap-3 rounded-2xl bg-violet-50 p-4 text-violet-900 dark:bg-violet-950/30 dark:text-violet-200"><CalendarClock size={21} /><span className="min-w-0 flex-1"><strong className="block">RDV bientôt · {item.doctor}</strong><small>{item.date} à {item.time || 'heure à préciser'}</small></span><ChevronRight /></Link>)}</section>}

    <WaterTodayCard amountMl={dayWater} onClick={openWater} />
    <section className="mt-3 grid grid-cols-2 gap-2"><MacroCard icon={Activity} label="Protéines" value={totals.protein} unit="g" tone="bg-gradient-to-br from-orange-500 to-rose-500" onClick={openMeal} /><MacroCard icon={Utensils} label="Glucides" value={totals.carbs} unit="g" tone="bg-gradient-to-br from-violet-600 to-fuchsia-600" onClick={openMeal} /></section>
    {diabetic && <section className="mt-3 grid grid-cols-2 gap-3"><button type="button" onClick={openReading} className="rounded-[1.5rem] bg-gradient-to-br from-blue-600 to-cyan-500 p-4 text-left text-white shadow-lg"><Droplets size={21} /><p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-white/70">Dernière glycémie</p><strong className="mt-1 block text-xl font-black">{latestReading ? `${latestReading.value} ${latestReading.unit}` : '—'}</strong></button><Link to="/s7a/medications" className="rounded-[1.5rem] bg-gradient-to-br from-orange-500 to-red-500 p-4 text-white shadow-lg"><Syringe size={21} /><p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-white/70">NovoRapid</p><strong className="mt-1 block text-xl font-black">{rapidUnits} u</strong></Link></section>}

    <section className="mt-6"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.16em] text-rose-500">Routine</p><h2 className="text-xl font-black">Traitements du jour</h2></div><Pill className="text-rose-500" /></div><div className="mt-3 space-y-2">{supplements.map((item) => { const done = checked.has(item.id); return <button key={item.id} type="button" onClick={() => toggle(item)} className={`flex min-h-16 w-full items-center gap-3 rounded-2xl p-4 text-left shadow-sm ${done ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100' : 'bg-surface'}`}><span className={`grid h-10 w-10 place-items-center rounded-xl ${done ? 'bg-emerald-500 text-white' : 'bg-canvas text-muted'}`}>{done ? <Check /> : <Pill size={19} />}</span><span className="min-w-0 flex-1"><strong className="block truncate">{item.name}</strong><small className="text-muted">{medicationFrequencyLabel(item)} · {item.reminderTimes?.join(' · ') || 'Sans heure fixe'}</small></span></button> })}{!supplements.length && <Link to="/s7a/medications" className="flex min-h-16 items-center justify-center rounded-2xl border border-dashed border-slate-300 text-sm font-bold text-muted dark:border-slate-700">{allSupplements.length ? 'Aucun traitement prévu ce jour' : 'Ajouter mes traitements'}</Link>}</div></section>

    <section className="mt-6 space-y-3"><div><p className="text-xs font-black uppercase tracking-[.16em] text-violet-500">Journal</p><h2 className="text-xl font-black">Repas et mesures</h2></div>{journal.map((item) => <article key={`${item.collection}-${item.id}`} className="flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm"><span className="text-2xl">{item.icon}</span><span className="min-w-0 flex-1"><strong className="block truncate text-base">{item.title}</strong><small className="block truncate text-muted">{item.time?.toDate?.().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) || 'À l’instant'} · {item.text}</small></span><button type="button" onClick={() => removeJournalEntry(item)} disabled={Boolean(deletingId)} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-muted hover:bg-rose-50 hover:text-rose-500 disabled:opacity-40" aria-label={`Supprimer ${item.title}`}><Trash2 size={17} className={deletingId === item.id ? 'animate-pulse' : ''} /></button></article>)}{!journal.length && <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-muted dark:border-slate-700">Aucun repas ou mesure pour cette journée.</p>}</section>

    {day === TODAY && strongestHabit && <Link to="/s7a/habits" className="mt-5 flex items-center gap-4 rounded-[1.5rem] bg-gradient-to-r from-emerald-500 to-teal-600 p-4 text-white shadow-lg"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15"><Trophy size={23} /></span><span className="min-w-0 flex-1"><small className="font-bold text-white/70">Meilleur compteur actuel</small><strong className="block truncate">{strongestHabit.name}</strong></span><span className="text-right"><strong className="block text-2xl font-black">{strongestHabit.days}</strong><small className="font-bold text-white/75">jour{strongestHabit.days !== 1 ? 's' : ''}</small></span></Link>}
    <p className="mt-6 flex items-start gap-2 rounded-2xl bg-surface p-4 text-xs leading-5 text-muted"><AlertTriangle className="mt-0.5 shrink-0 text-amber-500" size={17} />Ce journal vous aide à suivre vos habitudes ; il ne remplace pas un professionnel de santé ou les services d’urgence.</p>

    {dialog && <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby="daily-dialog-title"><button type="button" onClick={closeDialog} className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" aria-label="Fermer" /><section className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-surface p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]"><header className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-rose-500">Journal du {new Date(`${day}T12:00:00`).toLocaleDateString('fr-FR')}</p><h2 id="daily-dialog-title" className="text-xl font-black">{dialog === 'meal' ? 'Ajouter un repas' : dialog === 'reading' ? 'Nouvelle glycémie' : 'Hydratation'}</h2></div><button type="button" onClick={closeDialog} disabled={Boolean(saving)} className="grid h-11 w-11 place-items-center rounded-xl bg-canvas disabled:opacity-40" aria-label="Fermer"><X /></button></header>
      {dialog === 'water' && <div className="mt-5"><WaterEditor value={waterDraft} onChange={setWaterDraft} onSave={saveWater} saving={saving === 'water'} /></div>}
      {dialog === 'reading' && diabetic && <form onSubmit={saveReading} className="mt-5 space-y-3"><div className="grid grid-cols-[1fr_7rem] gap-2"><input type="number" min="1" max="699" step="0.1" value={reading.value} onChange={(event) => setReading((value) => ({ ...value, value: event.target.value }))} className="field-input text-2xl font-black" placeholder="120" required /><select value={reading.unit} onChange={(event) => setReading((value) => ({ ...value, unit: event.target.value }))} className="field-input"><option>mg/dL</option><option>mmol/L</option></select></div><div className="grid grid-cols-2 gap-2"><select value={reading.trend} onChange={(event) => setReading((value) => ({ ...value, trend: event.target.value }))} className="field-input"><option value="rising">↗ Monte</option><option value="stable">→ Stable</option><option value="falling">↘ Descend</option></select><select value={reading.source} onChange={(event) => setReading((value) => ({ ...value, source: event.target.value }))} className="field-input"><option>Libre 2</option><option>Lecteur capillaire</option></select></div><input type="datetime-local" value={reading.recordedAt} onChange={(event) => setReading((value) => ({ ...value, recordedAt: event.target.value }))} className="field-input" required /><input value={reading.note} onChange={(event) => setReading((value) => ({ ...value, note: event.target.value }))} className="field-input" placeholder="Note facultative" maxLength={300} /><button disabled={saving === 'reading'} className="min-h-12 w-full rounded-xl bg-blue-600 font-black text-white disabled:opacity-60">{saving === 'reading' ? 'Enregistrement…' : 'Enregistrer la glycémie'}</button></form>}
      {dialog === 'meal' && <form onSubmit={saveMeal} className="mt-5 space-y-4">
        <textarea value={meal.description} onChange={(event) => setMeal((value) => ({ ...value, description: event.target.value }))} className="field-input min-h-20 py-3" placeholder="Décrivez si besoin : tajine, deux morceaux de pain, salade…" maxLength={600} />
        {meal.image ? <div className="space-y-3">
          <div className="relative overflow-hidden rounded-2xl bg-canvas"><img src={meal.image} alt="Repas à analyser" className="h-52 w-full object-contain" /><button type="button" onClick={() => setMeal((value) => ({ ...value, image: '' }))} disabled={analysing} className="absolute right-2 top-2 grid h-10 w-10 place-items-center rounded-full bg-slate-950/70 text-white disabled:opacity-40" aria-label="Retirer la photo"><X /></button></div>
          <button type="button" onClick={() => analyse()} disabled={analysing} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 font-black text-white disabled:opacity-70">{analysing ? <><LoaderCircle className="animate-spin" /> Analyse protéines + glucides…</> : <><Sparkles /> Relancer l’analyse</>}</button>
        </div> : <div>
          <p className="mb-2 text-sm font-black">Ajouter une photo <span className="font-normal text-muted">(facultatif)</span></p>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 text-center text-violet-700 transition active:scale-[.98] dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-200"><ImagePlus /><strong className="mt-2 text-sm">Galerie</strong><small className="text-[10px] opacity-75">Choisir une image</small><input type="file" accept="image/*" onChange={(event) => { selectMealPhoto(event.target.files?.[0]); event.target.value = '' }} className="sr-only" /></label>
            <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-center text-rose-700 transition active:scale-[.98] dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200"><Camera /><strong className="mt-2 text-sm">Caméra</strong><small className="text-[10px] opacity-75">Prendre le repas</small><input type="file" accept="image/*" capture="environment" onChange={(event) => { selectMealPhoto(event.target.files?.[0]); event.target.value = '' }} className="sr-only" /></label>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted">La photo remplit automatiquement les protéines et glucides. Vous gardez la main sur les valeurs.</p>
        </div>}
        <label className="block text-sm font-black">Nom du repas<input value={meal.name} onChange={(event) => setMeal((value) => ({ ...value, name: event.target.value }))} className="field-input mt-1" placeholder="Ex. Tajine et pain" maxLength={100} /></label>
        <div className="grid grid-cols-2 gap-2">
          <label className="rounded-2xl bg-orange-50 p-3 text-xs font-black text-orange-900 dark:bg-orange-950/30 dark:text-orange-100">Protéines<input type="number" inputMode="decimal" min="0" max="1000" step="0.1" value={meal.protein} onChange={(event) => setMeal((value) => ({ ...value, protein: event.target.value }))} className="field-input mt-2 text-center text-xl font-black" placeholder="0 g" /></label>
          <label className="rounded-2xl bg-violet-50 p-3 text-xs font-black text-violet-900 dark:bg-violet-950/30 dark:text-violet-100">Glucides<input type="number" inputMode="decimal" min="0" max="1000" step="0.1" value={meal.carbs} onChange={(event) => setMeal((value) => ({ ...value, carbs: event.target.value }))} className="field-input mt-2 text-center text-xl font-black" placeholder="0 g" /></label>
        </div>
        {meal.confidence && <p className="rounded-xl bg-violet-50 p-3 text-xs leading-5 text-violet-800 dark:bg-violet-950/30 dark:text-violet-200"><strong>Estimation photo :</strong> {meal.protein || 0} g de protéines · glucides {meal.carbsMin}–{meal.carbsMax} g · confiance {meal.confidence}. Les deux valeurs restent modifiables.</p>}
        {meal.assumptions.length > 0 && <details className="text-xs text-muted"><summary className="flex cursor-pointer items-center gap-1 font-bold"><ChevronDown size={14} /> Hypothèses de l’estimation</summary><ul className="mt-2 list-disc pl-5">{meal.assumptions.map((item) => <li key={item}>{item}</li>)}</ul></details>}
        <input type="datetime-local" value={meal.eatenAt} onChange={(event) => setMeal((value) => ({ ...value, eatenAt: event.target.value }))} className="field-input" required />
        <button disabled={saving === 'meal' || analysing} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-rose-600 font-black text-white disabled:opacity-60"><Save size={18} />{analysing ? 'Analyse en cours…' : saving === 'meal' ? 'Enregistrement…' : 'Enregistrer le repas'}</button>
      </form>}
    </section></div>}
  </main>
}
