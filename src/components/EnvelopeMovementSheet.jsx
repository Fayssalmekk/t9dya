import { ArrowDownLeft, ArrowUpRight, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { addEnvelopeMovement } from '../services/budget'
import CuteEnvelope from './CuteEnvelope'

export default function EnvelopeMovementSheet({ envelope, initialType = 'deposit', onClose }) {
  const { household, user } = useAuth()
  const [type, setType] = useState(initialType)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const withdrawal = type === 'withdrawal'

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await addEnvelopeMovement(household.id, envelope, user.uid, { type, amount, note })
      onClose()
    } catch (caughtError) {
      setError(caughtError.message === 'INSUFFICIENT_BALANCE' ? 'Le montant dépasse le solde disponible.' : 'Impossible d’enregistrer ce mouvement.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby="movement-title">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]" aria-label="Fermer" />
      <form onSubmit={submit} className="relative w-full max-w-lg rounded-t-[2rem] bg-surface px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="flex items-center gap-3"><CuteEnvelope icon={envelope.icon} color={envelope.color} small /><div className="min-w-0 flex-1"><h2 id="movement-title" className="truncate text-xl font-extrabold">{envelope.name}</h2><p className="text-sm text-muted">Solde : {Number(envelope.balance || 0).toLocaleString('fr-FR')} DH</p></div><button type="button" onClick={onClose} className="grid min-h-11 min-w-11 place-items-center rounded-xl bg-canvas" aria-label="Fermer"><X size={19} /></button></div>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-canvas p-1.5"><button type="button" onClick={() => setType('deposit')} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl text-sm font-extrabold ${!withdrawal ? 'bg-emerald-500 text-white shadow-sm' : 'text-muted'}`}><ArrowDownLeft size={18} />Alimenter</button><button type="button" onClick={() => setType('withdrawal')} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl text-sm font-extrabold ${withdrawal ? 'bg-rose-500 text-white shadow-sm' : 'text-muted'}`}><ArrowUpRight size={18} />Retirer</button></div>
        <label className="mt-5 block"><span className="mb-2 block text-sm font-bold">Montant *</span><div className="relative"><input autoFocus required type="number" min="0.01" max={withdrawal ? envelope.balance : undefined} step="0.01" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0" className="field-input pr-14 text-2xl font-black tabular-nums" /><span className="absolute right-4 top-4 font-bold text-muted">DH</span></div></label>
        <div className="mt-3 flex gap-2">{[100, 200, 500, 1000].map((value) => <button key={value} type="button" onClick={() => setAmount(String(value))} className="min-h-10 flex-1 rounded-xl bg-canvas text-xs font-extrabold">{value}</button>)}</div>
        <label className="mt-5 block"><span className="mb-2 block text-sm font-bold">Note <span className="font-normal text-muted">(facultatif)</span></span><input maxLength={100} value={note} onChange={(event) => setNote(event.target.value)} placeholder={withdrawal ? 'Ex. Paiement laser' : 'Ex. Prime du mois'} className="field-input" /></label>
        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700 dark:bg-red-950 dark:text-red-200" role="alert">{error}</p>}
        <button type="submit" disabled={saving} className={`mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl font-extrabold text-white disabled:opacity-60 ${withdrawal ? 'bg-rose-500' : 'bg-emerald-500'}`}>{withdrawal ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}{saving ? 'Enregistrement…' : withdrawal ? 'Confirmer le retrait' : 'Ajouter à l’enveloppe'}</button>
      </form>
    </div>
  )
}
