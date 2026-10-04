import { AlertTriangle, CalendarClock, Check, ChevronRight, Droplets, PackageSearch, Pill, Syringe, Trophy, Utensils } from 'lucide-react'
import { Link } from 'react-router-dom'
import HealthHeader from '../components/HealthHeader'
import { WaterTodayCard } from '../components/WaterTracker'
import { useHealth } from '../context/HealthContext'
import { usePlatform } from '../../../context/PlatformContext'
import { setMedicationCheck } from '../services/health'
import { localDateKey, todayKey } from '../utils/dates'
import { isMedicationDueOnDate, medicationFrequencyLabel } from '../utils/medicationSchedule'

const TODAY = todayKey
const MS_DAY = 86400000

export default function TodayPage() {
  const { readings, doses, medications, checks, appointments, meals, waterEntries, badHabits, error, healthOwnerId, activeHealthProfile } = useHealth()
  const { notify } = usePlatform()
  const allSupplements = medications.filter((item) => item.kind === 'supplement')
  const supplements = allSupplements.filter((item) => isMedicationDueOnDate(item, TODAY))
  const checked = new Set(checks.filter((item) => item.date === TODAY && item.taken).map((item) => item.medicationId))
  const lowStocks = medications.filter((item) => item.stockInitialized && item.stock <= item.lowStockThreshold)
  const upcoming = appointments.filter((item) => { const days = Math.ceil((new Date(`${item.date}T12:00:00`) - new Date(`${TODAY}T12:00:00`)) / MS_DAY); return days >= 0 && days <= item.reminderDays }).slice(0, 3)
  const todayDoses = doses.filter((item) => {
    const takenAt = item.takenAt?.toDate?.()
    return takenAt ? localDateKey(takenAt) === TODAY : false
  })
  const latest = readings[0]
  const rapidUnitsToday = todayDoses.filter((item) => item.insulin === 'novorapid').reduce((sum, item) => sum + (Number(item.units) || 0), 0)
  const carbsToday = meals.filter((item) => { const eatenAt = item.eatenAt?.toDate?.(); return eatenAt ? localDateKey(eatenAt) === TODAY : false }).reduce((sum, item) => sum + (Number(item.carbs) || 0), 0)
  const waterToday = waterEntries.find((item) => item.date === TODAY)?.amountMl || 0
  const strongestHabit = badHabits.map((item) => ({ ...item, days: Math.max(0, Math.floor((new Date(`${TODAY}T12:00:00`) - new Date(`${item.lastOccurredOn}T12:00:00`)) / MS_DAY)) })).sort((a, b) => b.days - a.days)[0]
  const toggle = async (medication) => { try { await setMedicationCheck(healthOwnerId, medication.id, TODAY, !checked.has(medication.id)) } catch { notify('Impossible d’enregistrer la prise.') } }

  return <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-28 pt-6 sm:px-6"><HealthHeader title="Aujourd’hui" subtitle="Votre journée santé en un coup d’œil" />
    {activeHealthProfile?.diabetic && <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><strong>Suivi personnel uniquement.</strong> En cas de symptômes ou de valeur inattendue, suivez les consignes de votre professionnel de santé et confirmez au lecteur glycémique si nécessaire.</div>}
    {error && <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700 dark:bg-red-950/30 dark:text-red-200">{error}</p>}
    {(lowStocks.length > 0 || upcoming.length > 0) && <section className="mb-5 space-y-2">{lowStocks.map((item) => <Link key={item.id} to={item.kind === 'insulin' ? '/s7a/diabetes' : '/s7a/medications'} className="flex items-center gap-3 rounded-2xl bg-orange-50 p-4 text-orange-900 dark:bg-orange-950/30 dark:text-orange-200"><PackageSearch size={21} /><span className="min-w-0 flex-1"><strong className="block">Stock faible · {item.name}</strong><small>{item.stock} {item.unit}{item.stock !== 1 ? 's' : ''} restant{item.stock !== 1 ? 's' : ''}</small></span><ChevronRight /></Link>)}{upcoming.map((item) => <Link key={item.id} to="/s7a/appointments" className="flex items-center gap-3 rounded-2xl bg-violet-50 p-4 text-violet-900 dark:bg-violet-950/30 dark:text-violet-200"><CalendarClock size={21} /><span className="min-w-0 flex-1"><strong className="block">RDV bientôt · {item.doctor}</strong><small>{item.date} à {item.time || 'heure à préciser'}</small></span><ChevronRight /></Link>)}</section>}
    {activeHealthProfile?.diabetic && <><WaterTodayCard amountMl={waterToday} /><section className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3"><Link to="/s7a/diabetes" className="rounded-[1.5rem] bg-gradient-to-br from-rose-500 to-red-600 p-4 text-white shadow-lg"><Droplets size={22} /><p className="mt-5 text-[11px] font-bold text-white/70">Dernière glycémie</p><strong className="mt-1 block text-xl font-black">{latest ? `${latest.value} ${latest.unit}` : '—'}</strong></Link><Link to="/s7a/diabetes" className="rounded-[1.5rem] bg-gradient-to-br from-orange-500 to-rose-500 p-4 text-white shadow-lg"><Syringe size={22} /><p className="mt-5 text-[11px] font-bold text-white/70">NovoRapid aujourd’hui</p><strong className="mt-1 block text-xl font-black">{rapidUnitsToday} u</strong></Link><Link to="/s7a/diabetes" className="col-span-2 rounded-[1.5rem] bg-gradient-to-br from-violet-600 to-fuchsia-500 p-4 text-white shadow-lg sm:col-span-1"><Utensils size={22} /><p className="mt-5 text-[11px] font-bold text-white/70">Glucides aujourd’hui</p><strong className="mt-1 block text-xl font-black">{carbsToday} g</strong></Link></section></>}
    {strongestHabit && <Link to="/s7a/habits" className="mt-4 flex items-center gap-4 rounded-[1.5rem] bg-gradient-to-r from-emerald-500 to-teal-600 p-4 text-white shadow-lg"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15"><Trophy size={23} /></span><span className="min-w-0 flex-1"><small className="font-bold text-white/70">Meilleur compteur actuel</small><strong className="block truncate">{strongestHabit.name}</strong></span><span className="text-right"><strong className="block text-2xl font-black">{strongestHabit.days}</strong><small className="font-bold text-white/75">jour{strongestHabit.days !== 1 ? 's' : ''}</small></span></Link>}
    <section className="mt-6"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.16em] text-rose-500">Routine</p><h2 className="text-xl font-black">Traitements du jour</h2></div><Pill className="text-rose-500" /></div><div className="mt-3 space-y-2">{supplements.map((item) => { const done = checked.has(item.id); return <button key={item.id} type="button" onClick={() => toggle(item)} className={`flex min-h-16 w-full items-center gap-3 rounded-2xl p-4 text-left shadow-sm ${done ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100' : 'bg-surface'}`}><span className={`grid h-10 w-10 place-items-center rounded-xl ${done ? 'bg-emerald-500 text-white' : 'bg-canvas text-muted'}`}>{done ? <Check /> : <Pill size={19} />}</span><span className="min-w-0 flex-1"><strong className="block truncate">{item.name}</strong><small className="text-muted">{medicationFrequencyLabel(item)} · {item.reminderTimes?.join(' · ') || 'Sans heure fixe'}</small></span></button> })}{!supplements.length && <Link to="/s7a/medications" className="flex min-h-16 items-center justify-center rounded-2xl border border-dashed border-slate-300 text-sm font-bold text-muted dark:border-slate-700">{allSupplements.length ? 'Aucun traitement prévu aujourd’hui' : 'Ajouter mes traitements'}</Link>}</div></section>
    <p className="mt-6 flex items-start gap-2 rounded-2xl bg-surface p-4 text-xs leading-5 text-muted"><AlertTriangle className="mt-0.5 shrink-0 text-amber-500" size={17} />L’application conserve votre journal santé mais ne remplace pas les conseils médicaux ou les services d’urgence.</p>
  </main>
}
