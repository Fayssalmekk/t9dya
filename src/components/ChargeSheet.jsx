import { Archive, Check, ReceiptText, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { archiveCharge, createCharge, updateCharge } from '../services/budget'

const icons = ['🧾', '🏠', '🚗', '💳', '💧', '📶', '⚡', '📱', '👨🏻', '👩🏻', '👶', '🎓', '❤️']

export default function ChargeSheet({ charge, onClose }) {
  const { household, user } = useAuth()
  const members = (household.members || []).map((uid) => household.memberProfiles?.[uid]).filter(Boolean)
  const [form, setForm] = useState({ name: charge?.name || '', amount: charge?.amount || '', icon: charge?.icon || '🧾', dueDay: charge?.dueDay || 1, salaryOwnerId: charge?.salaryOwnerId || user.uid })
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (charge) await updateCharge(household.id, charge.id, form)
      else await createCharge(household.id, user.uid, form)
      onClose()
    } catch {
      setError('Impossible d’enregistrer cette charge.')
      setSaving(false)
    }
  }

  const remove = async () => {
    setSaving(true)
    await archiveCharge(household.id, charge.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby="charge-sheet-title">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]" aria-label="Fermer" />
      <form onSubmit={submit} className="relative max-h-[94dvh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-surface px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="flex items-center gap-3"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-3xl">{form.icon}</span><div className="min-w-0 flex-1"><h2 id="charge-sheet-title" className="text-xl font-extrabold">{charge ? 'Modifier la charge' : 'Nouvelle charge'}</h2><p className="text-sm text-muted">Répétée chaque mois</p></div><button type="button" onClick={onClose} className="grid min-h-11 min-w-11 place-items-center rounded-xl bg-canvas" aria-label="Fermer"><X size={19} /></button></div>
        <label className="mt-6 block"><span className="mb-2 block text-sm font-bold">Nom *</span><input required maxLength={50} value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="Ex. Électricité" className="field-input" /></label>
        <div className="mt-4 grid grid-cols-[1.4fr_1fr] gap-3"><label><span className="mb-2 block text-sm font-bold">Montant mensuel *</span><div className="relative"><input required type="number" min="0" step="1" inputMode="decimal" value={form.amount} onChange={(event) => update('amount', event.target.value)} className="field-input pr-12" /><span className="absolute right-3 top-3.5 text-sm font-bold text-muted">DH</span></div></label><label><span className="mb-2 block text-sm font-bold">Jour prévu</span><input type="number" min="1" max="31" value={form.dueDay} onChange={(event) => update('dueDay', event.target.value)} className="field-input" /></label></div>
        <label className="mt-4 block"><span className="mb-2 block text-sm font-bold">Prélevée sur quel salaire ?</span><select required value={form.salaryOwnerId} onChange={(event) => update('salaryOwnerId', event.target.value)} className="field-input"><option value="">Choisir un salaire</option>{members.map((member) => <option key={member.uid} value={member.uid}>Salaire de {member.displayName}</option>)}</select></label>
        <fieldset className="mt-5"><legend className="text-sm font-bold">Icône</legend><div className="mt-3 grid grid-cols-6 gap-2">{icons.map((icon) => <button key={icon} type="button" onClick={() => update('icon', icon)} className={`relative grid aspect-square place-items-center rounded-xl text-xl ${form.icon === icon ? 'bg-amber-100 ring-2 ring-amber-500' : 'bg-canvas'}`} aria-label={`Choisir ${icon}`} aria-pressed={form.icon === icon}>{icon}{form.icon === icon && <Check className="absolute -right-1 -top-1 rounded-full bg-amber-500 p-0.5 text-white" size={15} />}</button>)}</div></fieldset>
        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700 dark:bg-red-950 dark:text-red-200" role="alert">{error}</p>}
        <button type="submit" disabled={saving} className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 font-extrabold text-white dark:bg-white dark:text-slate-900"><ReceiptText size={20} />{saving ? 'Enregistrement…' : 'Enregistrer la charge'}</button>
        {charge && (!confirmDelete ? <button type="button" onClick={() => setConfirmDelete(true)} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-red-600"><Archive size={17} />Supprimer la charge</button> : <div className="mt-3 rounded-2xl bg-red-50 p-3 dark:bg-red-950"><p className="text-sm font-semibold text-red-700 dark:text-red-200">La charge disparaîtra des prochains mois. Continuer ?</p><div className="mt-3 flex gap-2"><button type="button" onClick={() => setConfirmDelete(false)} className="min-h-11 flex-1 rounded-xl bg-surface font-bold">Annuler</button><button type="button" onClick={remove} disabled={saving} className="min-h-11 flex-1 rounded-xl bg-red-600 font-bold text-white">Supprimer</button></div></div>)}
      </form>
    </div>
  )
}
