import { Ban, CalendarDays, Check, Plus, RotateCcw, ShieldCheck, Trash2, Trophy, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import HealthHeader from '../components/HealthHeader'
import { useHealth } from '../context/HealthContext'
import { usePlatform } from '../../../context/PlatformContext'
import { createBadHabit, deleteBadHabit, recordBadHabitOccurrence } from '../services/health'
import { todayKey } from '../utils/dates'

const DAY_MS = 86400000
const categories = [
  { value: 'soda', label: 'Boissons gazeuses', emoji: '🥤', tone: 'from-cyan-500 to-blue-600' },
  { value: 'sugar', label: 'Sucre / grignotage', emoji: '🍬', tone: 'from-pink-500 to-rose-600' },
  { value: 'smoking', label: 'Tabac', emoji: '🚭', tone: 'from-slate-500 to-slate-700' },
  { value: 'screen', label: 'Trop d’écran', emoji: '📱', tone: 'from-violet-500 to-indigo-600' },
  { value: 'sleep', label: 'Se coucher tard', emoji: '🌙', tone: 'from-indigo-500 to-slate-700' },
  { value: 'other', label: 'Autre habitude', emoji: '⚡', tone: 'from-amber-500 to-orange-600' }
]

const emptyForm = () => ({ name: '', category: 'soda', note: '', lastOccurredOn: todayKey, goalDays: 30 })

function daysBetween(from, to = todayKey) {
  const start = new Date(`${from}T12:00:00`)
  const end = new Date(`${to}T12:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  return Math.max(0, Math.floor((end - start) / DAY_MS))
}

function friendlyDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function BadHabitsPage() {
  const { badHabits, healthOwnerId } = useHealth()
  const { notify } = usePlatform()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [relapseHabit, setRelapseHabit] = useState(null)
  const [relapseDate, setRelapseDate] = useState(todayKey)
  const [saving, setSaving] = useState(false)
  const sortedHabits = useMemo(() => [...badHabits].sort((a, b) => daysBetween(b.lastOccurredOn) - daysBetween(a.lastOccurredOn)), [badHabits])
  const totalDays = badHabits.reduce((sum, habit) => sum + daysBetween(habit.lastOccurredOn), 0)

  const addHabit = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      await createBadHabit(healthOwnerId, form)
      setForm(emptyForm())
      setShowForm(false)
      notify('Habitude ajoutée. Le compteur commence maintenant.')
    } catch {
      notify('Impossible d’ajouter cette habitude. Déployez les règles Firebase.')
    } finally {
      setSaving(false)
    }
  }

  const saveRelapse = async (event) => {
    event.preventDefault()
    if (!relapseHabit) return
    setSaving(true)
    try {
      const completedStreak = daysBetween(relapseHabit.lastOccurredOn, relapseDate)
      await recordBadHabitOccurrence(healthOwnerId, relapseHabit, relapseDate, completedStreak)
      setRelapseHabit(null)
      notify('Date enregistrée. Un nouveau départ commence ici.')
    } catch {
      notify('Impossible de mettre le compteur à jour.')
    } finally {
      setSaving(false)
    }
  }

  return <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-28 pt-6 sm:px-6">
    <HealthHeader title="Mauvaises habitudes" subtitle="Voir le chemin parcouru, sans culpabiliser" />

    <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-5 text-white shadow-xl">
      <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10" />
      <div className="relative flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-white/70">Tous les petits progrès comptent</p><strong className="mt-2 block text-4xl font-black">{totalDays}</strong><p className="text-sm font-bold text-white/80">jours gagnés au total</p></div><span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15"><ShieldCheck size={29} /></span></div>
      <button type="button" onClick={() => setShowForm(true)} className="relative mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white font-black text-emerald-700 shadow-lg"><Plus size={19} />Ajouter une habitude</button>
    </section>

    <section className="mt-5 space-y-4">{sortedHabits.map((habit) => {
      const category = categories.find((entry) => entry.value === habit.category) || categories.at(-1)
      const days = daysBetween(habit.lastOccurredOn)
      const goal = Number(habit.goalDays) || 30
      const progress = Math.min(100, Math.round(days / goal * 100))
      const record = Math.max(days, Number(habit.bestStreakDays) || 0)
      return <article key={habit.id} className="overflow-hidden rounded-[1.75rem] bg-surface shadow-card">
        <div className={`bg-gradient-to-r ${category.tone} p-4 text-white`}><div className="flex items-center gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/20 text-2xl">{category.emoji}</span><span className="min-w-0 flex-1"><small className="font-bold text-white/70">{category.label}</small><strong className="block truncate text-lg">{habit.name}</strong></span><button type="button" onClick={() => { if (window.confirm(`Supprimer le suivi « ${habit.name} » ?`)) deleteBadHabit(healthOwnerId, habit.id).catch(() => notify('Suppression impossible.')) }} className="grid h-10 w-10 place-items-center rounded-xl bg-black/10" aria-label={`Supprimer ${habit.name}`}><Trash2 size={17} /></button></div></div>
        <div className="p-4"><div className="flex items-center gap-4"><div className="grid h-24 w-24 shrink-0 place-items-center rounded-full p-2" style={{ background: `conic-gradient(rgb(16 185 129) ${progress}%, rgb(226 232 240) ${progress}% 100%)` }}><span className="grid h-full w-full place-items-center rounded-full bg-surface text-center"><span><strong className="block text-3xl font-black text-emerald-600">{days}</strong><small className="font-bold text-muted">jour{days !== 1 ? 's' : ''}</small></span></span></div><div className="min-w-0 flex-1"><p className="flex items-center gap-2 text-xs font-bold text-muted"><CalendarDays size={15} />Dernière fois</p><strong className="mt-1 block">{friendlyDate(habit.lastOccurredOn)}</strong><p className="mt-3 flex items-center gap-2 text-xs font-bold text-amber-600"><Trophy size={15} />Record : {record} jour{record !== 1 ? 's' : ''}</p><p className="mt-1 text-xs text-muted">Objectif : {goal} jours · {progress}%</p></div></div>
          {habit.note && <p className="mt-4 rounded-xl bg-canvas px-3 py-2 text-sm leading-5 text-muted">{habit.note}</p>}
          {days >= goal ? <p className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-3 text-sm font-black text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"><Check size={18} />Objectif atteint — continue comme ça !</p> : <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} /></div>}
          <button type="button" onClick={() => { setRelapseHabit(habit); setRelapseDate(todayKey) }} className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-canvas text-sm font-black text-muted"><RotateCcw size={17} />Enregistrer une nouvelle fois</button>
        </div>
      </article>
    })}{!sortedHabits.length && <div className="rounded-[2rem] border border-dashed border-emerald-300 py-14 text-center dark:border-emerald-900"><Ban className="mx-auto text-emerald-500" size={42} /><h2 className="mt-3 text-xl font-black">Commence ton premier compteur</h2><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted">Soda, grignotage, tabac ou écrans tard le soir : ajoute ce que tu veux réduire.</p></div>}</section>

    {showForm && <HabitForm form={form} setForm={setForm} saving={saving} onClose={() => setShowForm(false)} onSubmit={addHabit} />}
    {relapseHabit && <RelapseForm habit={relapseHabit} date={relapseDate} setDate={setRelapseDate} saving={saving} onClose={() => setRelapseHabit(null)} onSubmit={saveRelapse} />}
  </main>
}

function HabitForm({ form, setForm, saving, onClose, onSubmit }) {
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  return <div className="fixed inset-0 z-50 flex items-end justify-center"><button type="button" onClick={onClose} className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" aria-label="Fermer" /><form onSubmit={onSubmit} className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-surface p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Nouveau départ</p><h2 className="text-xl font-black">Habitude à réduire</h2></div><button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl bg-canvas"><X /></button></div><label className="mt-5 block text-sm font-black">Nom<input value={form.name} onChange={(event) => update('name', event.target.value)} className="field-input mt-2" placeholder="Ex. Boire du Coca" maxLength={100} required /></label><label className="mt-3 block text-sm font-black">Type<select value={form.category} onChange={(event) => update('category', event.target.value)} className="field-input mt-2">{categories.map((item) => <option key={item.value} value={item.value}>{item.emoji} {item.label}</option>)}</select></label><div className="mt-3 grid grid-cols-2 gap-3"><label className="text-sm font-black">Dernière fois<input type="date" max={todayKey} value={form.lastOccurredOn} onChange={(event) => update('lastOccurredOn', event.target.value)} className="field-input mt-2" required /></label><label className="text-sm font-black">Premier objectif<select value={form.goalDays} onChange={(event) => update('goalDays', Number(event.target.value))} className="field-input mt-2"><option value="7">7 jours</option><option value="14">14 jours</option><option value="30">30 jours</option><option value="60">60 jours</option><option value="90">90 jours</option><option value="180">180 jours</option><option value="365">1 an</option></select></label></div><label className="mt-3 block text-sm font-black">Pourquoi je veux arrêter <span className="font-semibold text-muted">· facultatif</span><textarea value={form.note} onChange={(event) => update('note', event.target.value)} className="field-input mt-2 min-h-24 py-3" placeholder="Ex. Mieux dormir et avoir plus d’énergie…" maxLength={500} /></label><button disabled={saving} className="mt-5 min-h-13 w-full rounded-xl bg-emerald-600 font-black text-white disabled:opacity-50">{saving ? 'Enregistrement…' : 'Démarrer mon compteur'}</button></form></div>
}

function RelapseForm({ habit, date, setDate, saving, onClose, onSubmit }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center"><button type="button" onClick={onClose} className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" aria-label="Fermer" /><form onSubmit={onSubmit} className="relative w-full max-w-lg rounded-t-[2rem] bg-surface p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Sans jugement</p><h2 className="text-xl font-black">Nouvelle fois · {habit.name}</h2><p className="mt-1 text-sm text-muted">Ton meilleur parcours restera enregistré.</p></div><button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-canvas"><X /></button></div><label className="mt-5 block text-sm font-black">Quand ?<input type="date" min={habit.lastOccurredOn} max={todayKey} value={date} onChange={(event) => setDate(event.target.value)} className="field-input mt-2" required /></label><button disabled={saving} className="mt-5 min-h-13 w-full rounded-xl bg-amber-500 font-black text-white disabled:opacity-50">{saving ? 'Enregistrement…' : 'Enregistrer et repartir'}</button></form></div>
}
