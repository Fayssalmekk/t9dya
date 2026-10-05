import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CarFront, Check, ChevronLeft, ChevronRight, CircleGauge, Clock3, Fuel, History, Minus, Pencil, Plus, ReceiptText, Settings2, ShieldCheck, Trash2, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PlatformProvider, usePlatform } from '../../context/PlatformContext'
import Toast from '../../components/Toast'
import ExpenseSheet from '../budget/components/ExpenseSheet'
import { deleteExpense } from '../../services/budget'
import { archiveCarTask, completeCarTask, deleteCarService, recordMileage, saveCarTask, saveVehicle } from '../../services/car'
import { CAR_CATEGORIES, DEFAULT_VEHICLE, daysUntil, displayDate, formatKm, localDate, money, taskStatus } from './model'
import { DeleteSheet, MileageSheet, ServiceSheet, TaskSheet, VehicleSheet } from './CarSheets'
import useCarData from './useCarData'
import HoldButton from './HoldButton'

const MotionSpan = motion.span
const MotionDiv = motion.div
const navigation = [['dashboard', CircleGauge, 'Tableau de bord'], ['maintenance', Wrench, 'Entretiens'], ['expenses', ReceiptText, 'Dépenses'], ['history', History, 'Carnet']]

function Odometer({ value }) {
  const reduceMotion = useReducedMotion()
  const digits = value === null ? '------' : String(value).padStart(6, '0')
  return <div className="flex min-w-0 items-center justify-center gap-1 sm:gap-1.5" aria-label={value === null ? 'Kilométrage non renseigné' : `${formatKm(value)} kilomètres`}>
    {digits.split('').map((digit, index) => <span key={digits.length - index} aria-hidden="true" className="relative grid h-16 w-[clamp(1rem,4.5vw,2.6rem)] place-items-center overflow-hidden rounded-xl border border-white/10 bg-white/[.07] font-mono text-[clamp(1.1rem,4.8vw,2.4rem)] font-black tabular-nums shadow-inner sm:h-20">
      <AnimatePresence initial={false} mode="popLayout"><MotionSpan key={digit} initial={reduceMotion ? false : { y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reduceMotion ? undefined : { y: -30, opacity: 0 }} transition={{ duration: 0.32, delay: reduceMotion ? 0 : index * 0.025 }}>{digit === '-' ? '—' : digit}</MotionSpan></AnimatePresence>
      <span className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-black/15" />
    </span>)}
  </div>
}

function SmallStat({ icon: Icon, label, value }) {
  return <article className="min-w-0 rounded-2xl border border-slate-100 bg-surface p-4 shadow-sm dark:border-slate-800"><Icon size={18} className="text-emerald-600" /><p className="mt-3 text-[11px] font-bold text-muted">{label}</p><strong className="mt-1 block break-words text-lg font-black tabular-nums">{value}</strong></article>
}

function TaskCard({ task, status, onEdit, onDone, onRemove, canComplete }) {
  const reducedMotion = useReducedMotion()
  const tone = status.due ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200' : status.soon ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200'
  return <article className="rounded-[1.5rem] border border-slate-100 bg-surface p-4 shadow-sm dark:border-slate-800">
    <div className="flex items-start gap-3"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}><Wrench size={20} /></span><div className="min-w-0 flex-1"><h3 className="break-words font-black">{task.name}</h3><p className="mt-1 text-xs text-muted">{task.intervalKm > 0 ? `Tous les ${formatKm(task.intervalKm)} km` : ''}{task.intervalKm > 0 && task.intervalMonths > 0 ? ' ou ' : ''}{task.intervalMonths > 0 ? `${task.intervalMonths} mois` : ''}</p></div><button type="button" onClick={onEdit} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-canvas text-muted" aria-label={`Modifier ${task.name}`}><Pencil size={16} /></button></div>
    <div className="mt-4 flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${tone}`}>{status.due ? 'À faire' : status.soon ? 'Bientôt' : 'Planifié'}</span>{status.nextKm !== null && <strong className="text-lg tabular-nums">{formatKm(status.nextKm)} <small className="text-xs text-muted">km</small></strong>}{status.nextDate && <span className="text-xs font-bold text-muted">{status.nextKm !== null ? 'ou ' : ''}{displayDate(status.nextDate)}</span>}</div>
    {task.intervalKm > 0 && <><div role="progressbar" aria-label={`Progression vers ${task.name}`} aria-valuenow={Math.round(status.progress * 100)} aria-valuemin={0} aria-valuemax={100} className="mt-3 h-2 overflow-hidden rounded-full bg-canvas"><MotionDiv initial={false} animate={{ width: `${status.progress * 100}%` }} transition={{ duration: reducedMotion ? 0 : 0.6 }} className={`h-full rounded-full ${status.due ? 'bg-rose-500' : status.soon ? 'bg-amber-500' : 'bg-emerald-500'}`} /></div><p className="mt-2 text-xs text-muted">{status.remainingKm === null ? 'Renseignez le compteur pour calculer la distance restante.' : status.remainingKm < 0 ? `${formatKm(-status.remainingKm)} km au-delà de l’échéance` : `Encore ${formatKm(status.remainingKm)} km`}</p></>}
    {status.remainingDays !== null && <p className="mt-2 text-xs text-muted">{status.remainingDays < 0 ? `${-status.remainingDays} jours après l’échéance` : `${status.remainingDays} jours avant l’échéance`}</p>}
    {status.nextKm !== null && <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Prochains paliers prévisionnels">{[0, 1, 2].map((step) => <span key={step} className={`rounded-lg px-2 py-1 text-[10px] font-bold tabular-nums ${step === 0 ? tone : 'bg-canvas text-muted'}`}>{formatKm(status.nextKm + step * task.intervalKm)} km</span>)}</div>}
    {task.note && <p className="mt-3 text-xs leading-5 text-muted">{task.note}</p>}
    {status.last && <p className="mt-3 text-[11px] text-muted">Dernier : {displayDate(status.last.performedOn)} · {formatKm(status.last.odometer)} km</p>}
    <div className="mt-4 flex gap-2"><button type="button" disabled={!canComplete} onClick={onDone} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-sm font-black text-white disabled:opacity-40"><Check size={17} />Entretien effectué</button><button type="button" onClick={onRemove} className="grid h-11 w-11 place-items-center rounded-xl bg-canvas text-muted hover:text-rose-600" aria-label={`Supprimer le rappel ${task.name}`}><Trash2 size={17} /></button></div>
  </article>
}

function CarDashboard({ home }) {
  const { household, user } = useAuth()
  const { notify } = usePlatform()
  const data = useCarData(home)
  const [tab, setTab] = useState('dashboard')
  const [sheet, setSheet] = useState(null)
  const [mileageDraft, setMileageDraft] = useState(null)
  const [today, setToday] = useState(localDate)
  const [month, setMonth] = useState(() => localDate().slice(0, 7))
  const [expenseFilter, setExpenseFilter] = useState('all')
  const close = useCallback(() => setSheet(null), [])
  useEffect(() => {
    const refresh = () => setToday(localDate())
    const timer = window.setInterval(refresh, 60000)
    window.addEventListener('focus', refresh)
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh) }
  }, [])

  const vehicle = data.vehicle || DEFAULT_VEHICLE
  const odometer = data.vehicle?.odometer ?? null
  const changeMileage = (direction, step) => setMileageDraft((current) => {
    const base = current ?? { value: odometer, expected: odometer }
    return { ...base, value: Math.max(0, Math.min(2000000, base.value + direction * step)) }
  })
  const activeTasks = data.tasks.filter((task) => task.active)
  const tasks = activeTasks.map((task) => ({ task, status: taskStatus(task, data.services, odometer, today) })).sort((a, b) => Number(b.status.due) - Number(a.status.due) || Number(b.status.soon) - Number(a.status.soon) || (a.status.remainingKm ?? Infinity) - (b.status.remainingKm ?? Infinity))
  const expenses = [...data.expenses].sort((a, b) => b.spentOn.localeCompare(a.spentOn))
  const thisMonth = expenses.filter((expense) => expense.spentOn.startsWith(today.slice(0, 7)))
  const monthExpenses = expenses.filter((expense) => expense.spentOn.startsWith(month) && (expenseFilter === 'all' || expense.carKind === expenseFilter))
  const services = [...data.services].sort((a, b) => b.performedOn.localeCompare(a.performedOn) || b.odometer - a.odometer)
  const fuel = monthExpenses.filter((expense) => expense.carKind === 'fuel' && expense.carLiters > 0)
  const liters = fuel.reduce((sum, expense) => sum + expense.carLiters, 0)
  const upcomingDocs = [['insuranceDate', 'Assurance'], ['inspectionDate', 'Contrôle technique']].map(([key, label]) => ({ label, date: vehicle[key], days: daysUntil(vehicle[key], today) }))
  const ready = !data.loading && !data.error
  const requireVehicle = (next) => setSheet(data.vehicle ? next : { type: 'vehicle' })
  const openExpense = (initialValues = {}) => setSheet({ type: 'expense', initialValues })
  const changeMonth = (delta) => {
    const [year, value] = month.split('-').map(Number)
    setMonth(localDate(new Date(year, value - 1 + delta, 1)).slice(0, 7))
  }
  const taskList = (limit) => tasks.slice(0, limit).map(({ task, status }) => <TaskCard key={task.id} task={task} status={status} canComplete={odometer !== null && ready} onEdit={() => setSheet({ type: 'task', task })} onDone={() => setSheet({ type: 'service', task })} onRemove={() => setSheet({ type: 'delete', kind: 'task', item: task })} />)

  return <main className="mx-auto min-h-dvh max-w-3xl px-4 pb-32 pt-5 text-ink sm:px-6">
    <header className="mb-5 flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.22em] text-emerald-600">Notre garage</p><h1 className="mt-1 text-2xl font-black">{navigation.find(([key]) => key === tab)?.[2]}</h1></div><button type="button" disabled={!ready} onClick={() => setSheet({ type: 'vehicle' })} className="grid h-12 w-12 place-items-center rounded-2xl bg-surface shadow-sm disabled:opacity-40" aria-label="Configurer la voiture"><Settings2 size={21} /></button></header>
    {data.error && <p role="alert" className="mb-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-200">{data.error}</p>}
    {data.loading && !data.error ? <div className="h-80 animate-pulse rounded-[2rem] bg-slate-200 dark:bg-slate-800" aria-label="Chargement du garage" /> : <>
      {tab === 'dashboard' && <>
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-5 text-white shadow-xl sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-emerald-300/10 blur-3xl" />
          <header className="relative flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.25em] text-emerald-300">Votre compagnon de route</p><h2 className="mt-2 text-2xl font-black">{vehicle.name}</h2><p className="mt-1 text-xs text-slate-300">{vehicle.year} · {vehicle.transmission}</p><p className="mt-1 text-xs text-emerald-100/70">{vehicle.color}</p></div><span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-white/10 bg-gradient-to-br from-[#9caa9b] to-[#485b52] shadow-xl"><CarFront size={36} strokeWidth={1.5} /></span></header>
          <div className="relative pb-5 pt-9 text-center"><p className="mb-4 text-[10px] font-black uppercase tracking-[.25em] text-emerald-200/70">Kilométrage actuel</p><div className="flex items-center justify-center gap-2"><HoldButton label="Diminuer le compteur" disabled={!ready || odometer === null || (mileageDraft?.value ?? odometer) <= 0 || !!sheet} onStep={(step) => changeMileage(-1, step)} className="border border-white/15 bg-white/10 text-white active:bg-white/25"><Minus size={19} /></HoldButton><Odometer value={mileageDraft?.value ?? odometer} /><HoldButton label="Augmenter le compteur" disabled={!ready || odometer === null || (mileageDraft?.value ?? odometer) >= 2000000 || !!sheet} onStep={(step) => changeMileage(1, step)} className="border border-white/15 bg-white/10 text-white active:bg-white/25"><Plus size={19} /></HoldButton></div><p className="mt-3 text-[10px] text-white/60">{mileageDraft ? 'Aperçu non enregistré · validez ci-dessous' : 'Maintenez − ou + pour accélérer'}</p><p className="mt-3 text-xs font-bold tracking-[.3em] text-emerald-200">KILOMÈTRES</p></div>
          <div className="relative mb-5 flex items-center justify-center gap-1" aria-hidden="true">{Array.from({ length: 25 }, (_, index) => <span key={index} className={`h-1 flex-1 rounded-full ${index < 15 ? 'bg-emerald-400/70' : 'bg-white/10'}`} />)}</div>
          <button type="button" disabled={!ready} onClick={() => requireVehicle({ type: 'mileage', initialValues: mileageDraft })} className="relative flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-3 font-black text-emerald-950 shadow-lg shadow-emerald-500/20 disabled:opacity-50"><Plus size={20} />{!data.vehicle ? 'Configurer ma Fabia' : odometer === null ? 'Renseigner mon kilométrage' : mileageDraft ? 'Valider ce kilométrage' : 'Mettre à jour le compteur'}</button>
          {mileageDraft && <button type="button" onClick={() => setMileageDraft(null)} className="relative mt-2 min-h-11 w-full text-xs font-bold text-emerald-100">Annuler l’ajustement</button>}
          <p className="relative mt-3 text-center text-[10px] text-white/50">Saisie manuelle · partagé avec {household.name}</p>
        </section>
        <div className="mt-4 grid grid-cols-2 gap-3"><SmallStat icon={ReceiptText} label="Dépenses voiture ce mois" value={money(thisMonth.reduce((sum, expense) => sum + expense.amount, 0))} /><SmallStat icon={Wrench} label="Entretiens à faire / bientôt" value={`${tasks.filter(({ status }) => status.due || status.soon).length} / ${tasks.length}`} /></div>
        {upcomingDocs.some((item) => item.days !== null && item.days <= 30) && <div className="mt-4 space-y-2">{upcomingDocs.filter((item) => item.days !== null && item.days <= 30).map((item) => <button key={item.label} type="button" onClick={() => setSheet({ type: 'vehicle' })} className="flex w-full items-center gap-3 rounded-2xl bg-amber-50 p-4 text-left text-amber-900 dark:bg-amber-950 dark:text-amber-200"><ShieldCheck size={22} /><span><strong className="block text-sm">{item.label} · {item.days < 0 ? 'échéance dépassée' : item.days === 0 ? 'aujourd’hui' : `dans ${item.days} jours`}</strong><small>{displayDate(item.date)} · vérifier / modifier</small></span></button>)}</div>}
        <div className="mb-3 mt-7 flex items-center justify-between gap-3"><h2 className="text-lg font-black">Les prochains checks</h2><button type="button" onClick={() => setTab('maintenance')} className="min-h-11 text-xs font-bold text-emerald-600">Tout voir →</button></div>
        <div className="space-y-3">{taskList(3)}</div>
        {!tasks.length && <EmptyMaintenance onAdd={() => requireVehicle({ type: 'task', task: { name: 'Vidange', intervalKm: 10000 } })} disabled={!ready} />}
        <section className="mt-5 rounded-[1.5rem] bg-surface p-4 shadow-sm"><h2 className="flex items-center gap-2 font-black"><ShieldCheck size={18} className="text-emerald-600" />Papiers & assistance</h2><div className="mt-3 space-y-2">{upcomingDocs.map((item) => <div key={item.label} className="flex justify-between gap-3 text-xs"><span className="text-muted">{item.label}</span><strong>{displayDate(item.date)}</strong></div>)}{vehicle.plate && <p className="rounded-xl bg-canvas p-3 text-center font-mono font-black tracking-wider">{vehicle.plate}</p>}{vehicle.assistancePhone && <a className="mt-3 flex min-h-11 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" href={`tel:${vehicle.assistancePhone.replace(/[^+\d]/g, '')}`}>Appeler l’assistance · {vehicle.assistancePhone}</a>}</div></section>
      </>}

      {tab === 'maintenance' && <>
        <div className="mb-4 rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">Vos échéances se recalculent à partir du dernier entretien enregistré, en kilomètres et/ou en mois. Les intervalles sont les vôtres, à confirmer avec le carnet constructeur.</div>
        <button type="button" disabled={!ready} onClick={() => requireVehicle({ type: 'task' })} className="mb-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 font-black text-white disabled:opacity-40"><Plus size={20} />Ajouter un entretien</button>
        {!tasks.length && <EmptyMaintenance onAdd={() => requireVehicle({ type: 'task', task: { name: 'Vidange', intervalKm: 10000 } })} disabled={!ready} />}
        <div className="space-y-4">{taskList(tasks.length)}</div>
        <h2 className="mb-3 mt-6 text-sm font-black text-muted">Autres suivis à personnaliser</h2><div className="flex flex-wrap gap-2">{['Filtres', 'Pneus', 'Freins', 'Batterie', 'Boîte automatique', 'Essuie-glaces'].map((name) => <button key={name} type="button" disabled={!ready} onClick={() => requireVehicle({ type: 'task', task: { name } })} className="min-h-11 rounded-full border border-slate-200 bg-surface px-4 text-xs font-bold dark:border-slate-800">+ {name}</button>)}</div>
      </>}

      {tab === 'expenses' && <>
        <section className="rounded-[2rem] bg-gradient-to-br from-emerald-600 to-teal-800 p-5 text-white"><p className="text-xs font-bold text-white/70">Dépenses du mois sélectionné{expenseFilter !== 'all' ? ' · filtrées' : ''}</p><strong className="mt-2 block text-4xl font-black tabular-nums">{money(monthExpenses.reduce((sum, expense) => sum + expense.amount, 0))}</strong><button type="button" disabled={!ready} onClick={() => openExpense()} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white font-black text-emerald-800 disabled:opacity-50"><Plus size={18} />Ajouter une dépense voiture</button><p className="mt-3 text-[11px] text-white/75">Un seul enregistrement, visible aussi dans Budget.</p></section>
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-surface p-2"><button type="button" onClick={() => changeMonth(-1)} className="grid h-11 w-11 place-items-center rounded-xl bg-canvas" aria-label="Mois précédent"><ChevronLeft size={20} /></button><label className="min-w-0 flex-1 text-center"><span className="sr-only">Mois des dépenses</span><input type="month" required value={month} onChange={(event) => { if (/^\d{4}-\d{2}$/.test(event.target.value)) setMonth(event.target.value) }} className="w-full min-w-0 bg-transparent text-center font-bold" /></label><button type="button" onClick={() => changeMonth(1)} className="grid h-11 w-11 place-items-center rounded-xl bg-canvas" aria-label="Mois suivant"><ChevronRight size={20} /></button></div>
        <label className="mt-3 block"><span className="sr-only">Filtrer par type de dépense</span><select value={expenseFilter} onChange={(event) => setExpenseFilter(event.target.value)} className="field-input"><option value="all">Toutes les dépenses voiture</option>{CAR_CATEGORIES.map(([key, icon, label]) => <option key={key} value={key}>{icon} {label}</option>)}</select></label>
        {liters > 0 && <div className="mt-3 grid grid-cols-2 gap-3"><SmallStat icon={Fuel} label="Litres renseignés" value={`${liters.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} L`} /><SmallStat icon={Fuel} label="Prix moyen · pleins renseignés" value={`${(fuel.reduce((sum, entry) => sum + entry.amount, 0) / liters).toFixed(2)} DH/L`} /></div>}
        <div className="mt-4 space-y-3">{monthExpenses.map((expense) => <article key={expense.id} className="flex items-start gap-3 rounded-2xl bg-surface p-4 shadow-sm"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-xl dark:bg-emerald-950">{CAR_CATEGORIES.find(([key]) => key === expense.carKind)?.[1] || '🚗'}</span><div className="min-w-0 flex-1"><strong className="block break-words">{expense.reason}</strong><p className="mt-1 text-xs text-muted">{displayDate(expense.spentOn)} · {expense.sourceName}</p>{expense.carOdometer != null && <p className="mt-1 text-xs text-muted">{formatKm(expense.carOdometer)} km{expense.carLiters ? ` · ${expense.carLiters} L` : ''}</p>}{expense.note && <p className="mt-1 text-xs text-muted">{expense.note}</p>}<strong className="mt-2 block text-emerald-700 dark:text-emerald-300">{money(expense.amount)}</strong></div><button type="button" onClick={() => setSheet({ type: 'delete', kind: 'expense', item: expense })} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-canvas text-muted" aria-label={`Supprimer ${expense.reason}`}><Trash2 size={17} /></button></article>)}</div>
        {!monthExpenses.length && <p className="mt-6 rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-muted dark:border-slate-700">Aucune dépense pour ce mois et ce filtre.</p>}
        <Link to="/budget/expenses" className="mt-5 flex min-h-12 items-center justify-center text-sm font-bold text-emerald-600">Ouvrir le journal Budget →</Link>
      </>}

      {tab === 'history' && <>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-black"><Wrench size={20} />Carnet d’entretien</h2>
        <div className="space-y-3">{services.map((entry) => {
          const linked = expenses.filter((expense) => expense.carServiceId === entry.id)
          return <article key={entry.id} className="rounded-2xl bg-surface p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Effectué · {displayDate(entry.performedOn)}</span><h3 className="mt-1 font-black">{entry.taskName}</h3><strong className="mt-1 block text-lg tabular-nums">{formatKm(entry.odometer)} km</strong>{entry.garage && <p className="text-xs text-muted">{entry.garage}</p>}{entry.note && <p className="mt-2 text-xs text-muted">{entry.note}</p>}</div><button type="button" onClick={() => setSheet({ type: 'delete', kind: 'service', item: entry })} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-canvas text-muted" aria-label={`Annuler ${entry.taskName}`}><Trash2 size={17} /></button></div>{linked.length ? <p className="mt-3 rounded-xl bg-canvas p-3 text-xs font-bold">Dépense liée : {money(linked.reduce((sum, expense) => sum + expense.amount, 0))}</p> : <button type="button" onClick={() => openExpense({ reason: entry.taskName, spentOn: entry.performedOn, carKind: 'maintenance', carOdometer: entry.odometer, carServiceId: entry.id })} className="mt-3 min-h-11 rounded-xl bg-emerald-50 px-3 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">+ Saisir le coût dans Budget</button>}</article>
        })}</div>
        {!services.length && <p className="rounded-2xl bg-surface p-5 text-sm text-muted">Vos interventions confirmées apparaîtront ici.</p>}
        <h2 className="mb-3 mt-7 flex items-center gap-2 text-lg font-black"><Clock3 size={20} />Relevés du compteur</h2><p className="mb-3 text-xs text-muted">Les 50 derniers relevés. Les corrections restent visibles.</p>
        <div className="space-y-2">{data.mileage.map((entry) => <article key={entry.id} className="flex items-center justify-between gap-3 rounded-2xl bg-surface p-4"><div><strong className="block font-mono text-lg font-black">{formatKm(entry.value)} km</strong><p className="mt-1 text-xs text-muted">{entry.createdAt?.toDate?.().toLocaleString('fr-FR') || 'Synchronisation…'} · {household.memberProfiles?.[entry.createdBy]?.displayName || 'Membre'}</p>{entry.note && <p className="mt-1 text-xs text-muted">{entry.note}</p>}</div><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${entry.mode === 'correction' ? 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200' : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'}`}>{entry.mode === 'correction' ? 'Correction' : entry.previous === null ? 'Initial' : `+${formatKm(entry.value - entry.previous)} km`}</span></article>)}</div>
        {!data.mileage.length && <p className="rounded-2xl bg-surface p-5 text-sm text-muted">Aucun kilométrage enregistré pour l’instant.</p>}
      </>}
    </>}

    <nav aria-label="Sections Voiture" className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-surface/95 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl dark:border-slate-800"><div className="mx-auto grid max-w-2xl grid-cols-4 gap-1">{navigation.map(([key, Icon, label]) => <button key={key} type="button" onClick={() => setTab(key)} aria-current={tab === key ? 'page' : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-bold transition ${tab === key ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200' : 'text-muted'}`}><Icon size={22} />{label}</button>)}</div></nav>

    {sheet?.type === 'vehicle' && <VehicleSheet vehicle={data.vehicle} onClose={close} onSave={async (values) => { await saveVehicle(home, user.uid, values); notify('Voiture enregistrée pour le foyer') }} />}
    {sheet?.type === 'mileage' && data.vehicle && <MileageSheet vehicle={data.vehicle} initialValues={sheet.initialValues} onClose={close} onSave={async (values) => { await recordMileage(home, user.uid, values); setMileageDraft(null); notify('Compteur mis à jour !') }} />}
    {sheet?.type === 'task' && <TaskSheet task={sheet.task} onClose={close} onSave={async (values) => { await saveCarTask(home, user.uid, values, sheet.task?.id); notify('Entretien planifié') }} />}
    {sheet?.type === 'service' && <ServiceSheet task={sheet.task} odometer={odometer} onClose={close} onSave={async (values) => { await completeCarTask(home, user.uid, sheet.task, values); setTab('history'); notify('Entretien enregistré. Son coût peut être ajouté dans le carnet.') }} />}
    {sheet?.type === 'expense' && <ExpenseSheet initialCategory="car" lockCategory initialValues={sheet.initialValues} envelopes={data.envelopes.filter((envelope) => envelope.active !== false)} salaryMonths={data.salaryMonths} onClose={close} />}
    {sheet?.type === 'delete' && <DeleteSheet kind={sheet.kind} item={sheet.item} onClose={close} onSave={async () => {
      if (sheet.kind === 'expense') await deleteExpense(home, user.uid, sheet.item)
      else if (sheet.kind === 'service') await deleteCarService(home, sheet.item.id)
      else await archiveCarTask(home, sheet.item.id)
      notify(sheet.kind === 'expense' ? 'Dépense supprimée dans les deux espaces' : 'Suppression enregistrée')
    }} />}
  </main>
}

function EmptyMaintenance({ onAdd, disabled }) {
  return <section className="rounded-[1.5rem] border border-dashed border-emerald-300 bg-emerald-50/50 p-5 text-center dark:border-emerald-900 dark:bg-emerald-950/20"><Wrench className="mx-auto text-emerald-600" size={25} /><h3 className="mt-3 font-black">Un carnet qui suit votre rythme</h3><p className="mt-2 text-xs leading-5 text-muted">Ajoutez vos intervalles réels. Exemple à confirmer : une vidange tous les 10 000 km, avec un départ à 0 km, donne 10 000, puis 20 000, 30 000… si vous l’effectuez à ces kilométrages.</p><button type="button" disabled={disabled} onClick={onAdd} className="mt-4 min-h-12 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white disabled:opacity-40">Configurer ma vidange</button></section>
}

export default function CarApp() {
  const { household } = useAuth()
  return <PlatformProvider><CarDashboard key={household.id} home={household.id} /><Toast /></PlatformProvider>
}
