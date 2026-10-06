import { useState } from 'react'
import { CalendarCheck, CalendarDays, Check, Clock3, MapPin, Plus, Stethoscope, Trash2, X } from 'lucide-react'
import { useConfirmDialog } from '../../../context/ConfirmContext'
import { usePlatform } from '../../../context/PlatformContext'
import HealthHeader from '../components/HealthHeader'
import { useHealth } from '../context/HealthContext'
import { completeAppointment, createAppointment, deleteAppointment } from '../services/health'
import { todayKey } from '../utils/dates'

const TODAY = todayKey
const EMPTY_FORM = {
  doctor: '',
  specialty: '',
  location: '',
  date: TODAY,
  time: '09:00',
  recurrenceMonths: 0,
  reminderDays: 7,
  note: ''
}

function daysUntil(date) {
  return Math.ceil((new Date(`${date}T12:00:00`) - new Date(`${TODAY}T12:00:00`)) / 86400000)
}

function appointmentStatus(item) {
  const days = daysUntil(item.date)
  if (days < 0) return { label: 'Passé', className: 'bg-slate-100 text-slate-500 dark:bg-slate-800' }
  if (days === 0) return { label: "Aujourd’hui", className: 'bg-rose-500 text-white' }
  if (days === 1) return { label: 'Demain', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' }
  return { label: `Dans ${days} jours`, className: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300' }
}

export default function AppointmentsPage() {
  const { appointments, healthOwnerId } = useHealth()
  const { notify } = usePlatform()
  const confirm = useConfirmDialog()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState('')

  const save = async (event) => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      await createAppointment(healthOwnerId, form)
      setForm(EMPTY_FORM)
      setShowForm(false)
      notify('Rendez-vous ajouté.')
    } catch {
      notify('Impossible d’ajouter le rendez-vous.')
    } finally {
      setSaving(false)
    }
  }

  const complete = async (item) => {
    if (busyId) return
    setBusyId(item.id)
    try {
      await completeAppointment(healthOwnerId, item)
      notify(item.recurrenceMonths ? 'Prochain rendez-vous planifié.' : 'Rendez-vous terminé.')
    } catch {
      notify('Impossible de terminer ce rendez-vous.')
    } finally {
      setBusyId('')
    }
  }

  const remove = async (item) => {
    const accepted = await confirm({
      title: 'Supprimer ce rendez-vous ?',
      message: `Le rendez-vous avec ${item.doctor} sera supprimé définitivement.`,
      confirmLabel: 'Supprimer'
    })
    if (!accepted || busyId) return
    setBusyId(item.id)
    try {
      await deleteAppointment(healthOwnerId, item.id)
      notify('Rendez-vous supprimé.')
    } catch {
      notify('Suppression impossible.')
    } finally {
      setBusyId('')
    }
  }

  const sortedAppointments = [...appointments].sort((left, right) => left.date.localeCompare(right.date))

  return <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-28 pt-6 sm:px-6">
    <HealthHeader title="Rendez-vous" subtitle="Consultations et prochains rappels" />

    <section className="rounded-[1.75rem] bg-gradient-to-br from-violet-600 to-fuchsia-500 p-5 text-white shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <span>
          <small className="font-bold text-white/75">À venir</small>
          <strong className="mt-1 block text-3xl font-black">{appointments.filter((item) => daysUntil(item.date) >= 0).length}</strong>
          <span className="text-sm text-white/85">rendez-vous planifié{appointments.length > 1 ? 's' : ''}</span>
        </span>
        <span className="grid h-16 w-16 place-items-center rounded-3xl bg-white/15"><CalendarDays size={31} /></span>
      </div>
    </section>

    <button type="button" onClick={() => setShowForm(true)} className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 font-black text-white dark:bg-white dark:text-slate-900">
      <Plus /> Ajouter un rendez-vous
    </button>

    <section className="mt-5 space-y-3">
      {sortedAppointments.map((item) => {
        const status = appointmentStatus(item)
        const pending = busyId === item.id
        return <article key={item.id} className="rounded-[1.5rem] bg-surface p-4 shadow-card">
          <div className="flex items-start gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300"><Stethoscope /></span>
            <span className="min-w-0 flex-1">
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${status.className}`}>{status.label}</span>
              <strong className="mt-2 block truncate text-lg">{item.doctor}</strong>
              {item.specialty && <small className="block text-muted">{item.specialty}</small>}
            </span>
            <button type="button" onClick={() => remove(item)} disabled={Boolean(busyId)} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-rose-50 hover:text-rose-500 disabled:opacity-40 dark:hover:bg-rose-950/30" aria-label={`Supprimer le rendez-vous avec ${item.doctor}`}>
              <Trash2 size={18} className={pending ? 'animate-pulse' : ''} />
            </button>
          </div>
          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <span className="flex items-center gap-2 rounded-xl bg-canvas px-3 py-2.5 font-bold"><CalendarDays size={17} className="text-violet-500" />{new Date(`${item.date}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' })}</span>
            <span className="flex items-center gap-2 rounded-xl bg-canvas px-3 py-2.5 font-bold"><Clock3 size={17} className="text-violet-500" />{item.time || 'Heure à préciser'}</span>
          </div>
          {item.location && <p className="mt-2 flex items-center gap-2 text-sm text-muted"><MapPin size={16} />{item.location}</p>}
          {item.note && <p className="mt-3 rounded-xl bg-canvas px-3 py-2 text-sm text-muted">{item.note}</p>}
          <button type="button" onClick={() => complete(item)} disabled={Boolean(busyId)} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 px-3 font-black text-emerald-700 disabled:opacity-40 dark:bg-emerald-950/30 dark:text-emerald-300">
            <Check size={19} /> {pending ? 'Mise à jour…' : item.recurrenceMonths ? 'Terminé · programmer le prochain' : 'Marquer comme terminé'}
          </button>
        </article>
      })}
      {!sortedAppointments.length && <div className="rounded-[2rem] border border-dashed border-slate-300 py-14 text-center dark:border-slate-700">
        <CalendarCheck className="mx-auto text-violet-400" size={40} />
        <h2 className="mt-3 text-xl font-black">Aucun rendez-vous</h2>
        <p className="mx-auto mt-1 max-w-xs text-sm text-muted">Ajoutez votre prochaine consultation pour ne plus l’oublier.</p>
      </div>}
    </section>

    {showForm && <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby="appointment-form-title">
      <button type="button" onClick={() => !saving && setShowForm(false)} className="absolute inset-0 bg-slate-950/50" aria-label="Fermer" />
      <form onSubmit={save} className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-surface p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-xs font-black uppercase tracking-[.18em] text-violet-500">Planifier</p><h2 id="appointment-form-title" className="text-xl font-black">Nouveau rendez-vous</h2></div>
          <button type="button" onClick={() => setShowForm(false)} disabled={saving} className="grid h-11 w-11 place-items-center rounded-xl bg-canvas disabled:opacity-40" aria-label="Fermer"><X /></button>
        </div>
        <label className="mt-5 block text-sm font-black">Médecin ou établissement<input value={form.doctor} onChange={(event) => setForm((value) => ({ ...value, doctor: event.target.value }))} className="field-input mt-2" placeholder="Ex. Dr Alaoui" maxLength={100} required /></label>
        <label className="mt-3 block text-sm font-black">Spécialité<input value={form.specialty} onChange={(event) => setForm((value) => ({ ...value, specialty: event.target.value }))} className="field-input mt-2" placeholder="Ex. Endocrinologue" maxLength={100} /></label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-black">Date<input type="date" min={TODAY} value={form.date} onChange={(event) => setForm((value) => ({ ...value, date: event.target.value }))} className="field-input mt-2" required /></label>
          <label className="text-sm font-black">Heure<input type="time" value={form.time} onChange={(event) => setForm((value) => ({ ...value, time: event.target.value }))} className="field-input mt-2" /></label>
        </div>
        <label className="mt-3 block text-sm font-black">Lieu<input value={form.location} onChange={(event) => setForm((value) => ({ ...value, location: event.target.value }))} className="field-input mt-2" placeholder="Cabinet, hôpital…" maxLength={160} /></label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-black">Répétition<select value={form.recurrenceMonths} onChange={(event) => setForm((value) => ({ ...value, recurrenceMonths: Number(event.target.value) }))} className="field-input mt-2"><option value="0">Une seule fois</option><option value="1">Chaque mois</option><option value="3">Tous les 3 mois</option><option value="6">Tous les 6 mois</option><option value="12">Chaque année</option></select></label>
          <label className="text-sm font-black">Rappel<select value={form.reminderDays} onChange={(event) => setForm((value) => ({ ...value, reminderDays: Number(event.target.value) }))} className="field-input mt-2"><option value="1">1 jour avant</option><option value="3">3 jours avant</option><option value="7">7 jours avant</option><option value="14">14 jours avant</option></select></label>
        </div>
        <label className="mt-3 block text-sm font-black">Note<textarea value={form.note} onChange={(event) => setForm((value) => ({ ...value, note: event.target.value }))} className="field-input mt-2 min-h-24 resize-none" placeholder="Documents à apporter, consignes…" maxLength={400} /></label>
        <button disabled={saving} className="mt-5 min-h-12 w-full rounded-xl bg-violet-600 px-4 font-black text-white disabled:opacity-60">{saving ? 'Ajout en cours…' : 'Ajouter le rendez-vous'}</button>
      </form>
    </div>}
  </main>
}
