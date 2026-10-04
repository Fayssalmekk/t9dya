import { UserRound, WalletCards, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { usePlatform } from '../../../context/PlatformContext'
import { createExpense } from '../../../services/budget'

const todayKey = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

const categories = [
  ['food', '🍽️', 'Alimentation'], ['transport', '🚗', 'Transport'], ['home', '🏠', 'Maison'],
  ['health', '🩺', 'Santé'], ['leisure', '✨', 'Loisirs'], ['other', '🧾', 'Autre']
]

export default function ExpenseSheet({ envelopes, salaryMonths = [], onClose }) {
  const { household, user } = useAuth()
  const { notify } = usePlatform()
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [category, setCategory] = useState('food')
  const [spentOn, setSpentOn] = useState(todayKey)
  const [source, setSource] = useState(() => `salary:${user.uid}`)
  const [saving, setSaving] = useState(false)
  const selectedEnvelope = useMemo(() => envelopes.find((item) => item.id === source), [envelopes, source])
  const selectedSalaryId = source.startsWith('salary:') ? source.slice(7) : ''
  const members = useMemo(() => (household.members || []).map((uid) => household.memberProfiles?.[uid]).filter(Boolean), [household.memberProfiles, household.members])
  const selectedMember = members.find((member) => member.uid === selectedSalaryId)
  const salaryForDate = (memberId) => salaryMonths.find((entry) => entry.memberId === memberId && entry.month === spentOn.slice(0, 7))?.amount || 0

  const save = async (event) => {
    event.preventDefault()
    const sourceData = selectedEnvelope
      ? { sourceType: 'envelope', sourceId: selectedEnvelope.id, sourceName: selectedEnvelope.name, sourceIcon: selectedEnvelope.icon }
      : { sourceType: 'salary', sourceId: selectedSalaryId, sourceName: `Salaire de ${selectedMember?.displayName || 'membre'}`, sourceIcon: '👤' }
    setSaving(true)
    try {
      await createExpense(household.id, user.uid, { amount, reason, note, category, spentOn, ...sourceData })
      notify('Dépense ajoutée au journal')
      onClose()
    } catch (error) {
      notify(error.message === 'INSUFFICIENT_BALANCE' ? 'Cette enveloppe ne contient pas assez d’argent' : 'Impossible d’ajouter cette dépense')
    } finally {
      setSaving(false)
    }
  }

  return <div className="fixed inset-0 z-50 flex items-end justify-center"><button type="button" onClick={onClose} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" aria-label="Fermer" /><section className="relative max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] bg-surface p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:mb-4 sm:rounded-[2rem]"><div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700" /><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">Nouveau mouvement</p><h2 className="mt-1 text-2xl font-black">Qu’est-ce qui est sorti ?</h2></div><button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-xl bg-canvas" aria-label="Fermer"><X size={19} /></button></div><form onSubmit={save} className="mt-5 space-y-5"><label className="block"><span className="mb-2 block text-xs font-extrabold text-muted">Montant</span><span className="flex items-center rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 p-1"><input required min="0.01" step="0.01" inputMode="decimal" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0" className="min-h-16 min-w-0 flex-1 rounded-[0.8rem] border-0 bg-white px-4 text-3xl font-black text-slate-950 outline-none" /><strong className="px-4 text-white">DH</strong></span></label><label className="block"><span className="mb-2 block text-xs font-extrabold text-muted">Pourquoi ?</span><input required maxLength="120" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ex. Café avec Salma" className="field-input" /></label><div><span className="mb-2 block text-xs font-extrabold text-muted">Catégorie</span><div className="grid grid-cols-3 gap-2">{categories.map(([value, icon, label]) => <button key={value} type="button" onClick={() => setCategory(value)} className={`min-h-16 rounded-2xl border p-2 text-center text-xs font-extrabold transition ${category === value ? 'border-amber-400 bg-amber-50 text-amber-800 ring-2 ring-amber-300/40 dark:bg-amber-950/40 dark:text-amber-200' : 'border-slate-200 bg-canvas text-muted dark:border-slate-700'}`}><span className="mb-1 block text-xl">{icon}</span>{label}</button>)}</div></div><div><span className="mb-2 block text-xs font-extrabold text-muted">Depuis quel argent ?</span><div className="grid grid-cols-2 gap-2">{members.map((member) => <SourceButton key={member.uid} active={source === `salary:${member.uid}`} onClick={() => setSource(`salary:${member.uid}`)} icon={UserRound} label={`Salaire · ${member.displayName}`} detail={`${Number(salaryForDate(member.uid)).toLocaleString('fr-FR')} DH ce mois`} />)}{envelopes.map((envelope) => <SourceButton key={envelope.id} active={source === envelope.id} onClick={() => setSource(envelope.id)} icon={WalletCards} emoji={envelope.icon} label={envelope.name} detail={`${Number(envelope.balance || 0).toLocaleString('fr-FR')} DH cumulés`} />)}</div></div><label className="block"><span className="mb-2 block text-xs font-extrabold text-muted">Date</span><input required type="date" value={spentOn} onChange={(event) => setSpentOn(event.target.value)} className="field-input" /></label><label className="block"><span className="mb-2 block text-xs font-extrabold text-muted">Petite note <span className="font-medium">(facultatif)</span></span><textarea rows="2" maxLength="240" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Un détail utile à retenir…" className="field-input py-3" /></label><button disabled={saving || (!selectedEnvelope && !selectedSalaryId)} className="min-h-14 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-base font-black text-white shadow-lg shadow-orange-500/20 disabled:opacity-50">{saving ? 'Enregistrement…' : 'Ajouter la dépense'}</button></form></section></div>
}

function SourceButton({ active, onClick, icon: Icon, emoji, label, detail }) {
  return <button type="button" onClick={onClick} className={`flex min-h-16 items-center gap-2 rounded-2xl border p-3 text-left transition ${active ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-300/40 dark:bg-amber-950/40' : 'border-slate-200 bg-canvas dark:border-slate-700'}`}><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${active ? 'bg-amber-500 text-white' : 'bg-surface text-muted'}`}>{emoji || <Icon size={18} />}</span><span className="min-w-0"><strong className="block truncate text-xs">{label}</strong><small className="block truncate text-[10px] text-muted">{detail}</small></span></button>
}
