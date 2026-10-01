import { Archive, Check, PiggyBank, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { archiveEnvelope, createEnvelope, updateEnvelope } from '../services/budget'
import CuteEnvelope from './CuteEnvelope'

const icons = ['🐷', '✨', '🛡️', '🏡', '🚗', '✈️', '🎁', '👶', '❤️', '📚', '💍', '💰']
const colors = [
  { id: 'teal', hex: '#14b8a6' },
  { id: 'rose', hex: '#fb7185' },
  { id: 'violet', hex: '#8b5cf6' },
  { id: 'amber', hex: '#f59e0b' },
  { id: 'sky', hex: '#0ea5e9' },
  { id: 'emerald', hex: '#10b981' }
]

export default function EnvelopeSheet({ envelope, onClose }) {
  const { household, user } = useAuth()
  const [form, setForm] = useState({
    name: envelope?.name || '',
    icon: envelope?.icon || '🐷',
    color: envelope?.color || 'teal',
    target: envelope?.target || ''
  })
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (envelope) await updateEnvelope(household.id, envelope.id, form)
      else await createEnvelope(household.id, user.uid, form)
      onClose()
    } catch {
      setError('Impossible d’enregistrer cette enveloppe.')
      setSaving(false)
    }
  }

  const remove = async () => {
    if (Number(envelope.balance) > 0) {
      setError('Retirez d’abord le solde de cette enveloppe avant de la supprimer.')
      return
    }
    setSaving(true)
    await archiveEnvelope(household.id, envelope.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby="envelope-sheet-title">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]" aria-label="Fermer" />
      <form onSubmit={submit} className="relative max-h-[94dvh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-surface px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="flex items-center gap-3"><CuteEnvelope icon={form.icon} color={form.color} small /><div className="min-w-0 flex-1"><h2 id="envelope-sheet-title" className="text-xl font-extrabold">{envelope ? 'Modifier l’enveloppe' : 'Nouvelle enveloppe'}</h2><p className="text-sm text-muted">Votre argent, votre objectif</p></div><button type="button" onClick={onClose} className="grid min-h-11 min-w-11 place-items-center rounded-xl bg-canvas" aria-label="Fermer"><X size={19} /></button></div>

        <label className="mt-6 block"><span className="mb-2 block text-sm font-bold">Nom de l’enveloppe *</span><input autoFocus required maxLength={50} value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="Ex. Vacances" className="field-input" /></label>
        <label className="mt-4 block"><span className="mb-2 block text-sm font-bold">Objectif <span className="font-normal text-muted">(facultatif)</span></span><div className="relative"><input type="number" min="0" step="50" inputMode="decimal" value={form.target} onChange={(event) => update('target', event.target.value)} placeholder="10 000" className="field-input pr-14" /><span className="absolute right-4 top-3.5 text-sm font-bold text-muted">DH</span></div></label>

        <fieldset className="mt-5"><legend className="text-sm font-bold">Petite icône</legend><div className="mt-3 grid grid-cols-6 gap-2">{icons.map((icon) => <button key={icon} type="button" onClick={() => update('icon', icon)} className={`relative grid aspect-square place-items-center rounded-xl text-xl ${form.icon === icon ? 'bg-accent-100 ring-2 ring-accent-500' : 'bg-canvas'}`} aria-label={`Choisir ${icon}`} aria-pressed={form.icon === icon}>{icon}{form.icon === icon && <Check className="absolute -right-1 -top-1 rounded-full bg-accent-600 p-0.5 text-white" size={15} />}</button>)}</div></fieldset>
        <fieldset className="mt-5"><legend className="text-sm font-bold">Couleur</legend><div className="mt-3 flex gap-3">{colors.map((color) => <button key={color.id} type="button" onClick={() => update('color', color.id)} className={`grid h-11 w-11 place-items-center rounded-full ${form.color === color.id ? 'ring-2 ring-offset-2 ring-offset-surface' : ''}`} style={{ backgroundColor: color.hex, '--tw-ring-color': color.hex }} aria-label={`Couleur ${color.id}`} aria-pressed={form.color === color.id}>{form.color === color.id && <Check className="text-white" size={18} />}</button>)}</div></fieldset>

        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700 dark:bg-red-950 dark:text-red-200" role="alert">{error}</p>}
        <button type="submit" disabled={saving} className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-accent-600 font-extrabold text-white disabled:opacity-60"><PiggyBank size={20} />{saving ? 'Enregistrement…' : 'Enregistrer l’enveloppe'}</button>
        {envelope && (!confirmDelete ? <button type="button" onClick={() => setConfirmDelete(true)} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-red-600"><Archive size={17} />Supprimer l’enveloppe</button> : <div className="mt-3 rounded-2xl bg-red-50 p-3 dark:bg-red-950"><p className="text-sm font-semibold text-red-700 dark:text-red-200">Confirmer la suppression ? L’historique sera conservé.</p><div className="mt-3 flex gap-2"><button type="button" onClick={() => setConfirmDelete(false)} className="min-h-11 flex-1 rounded-xl bg-surface font-bold">Annuler</button><button type="button" onClick={remove} disabled={saving} className="min-h-11 flex-1 rounded-xl bg-red-600 font-bold text-white">Supprimer</button></div></div>)}
      </form>
    </div>
  )
}
