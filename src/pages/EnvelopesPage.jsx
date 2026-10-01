import { ArrowDownLeft, ArrowUpRight, Pencil, PiggyBank, Plus, Target } from 'lucide-react'
import { useState } from 'react'
import AppHeader from '../components/AppHeader'
import CuteEnvelope from '../components/CuteEnvelope'
import EnvelopeMovementSheet from '../components/EnvelopeMovementSheet'
import EnvelopeSheet from '../components/EnvelopeSheet'
import { useAuth } from '../context/AuthContext'
import { useHouseholdBudget } from '../hooks/useHouseholdBudget'

const money = (value) => `${Number(value || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} DH`

export default function EnvelopesPage() {
  const { household, user } = useAuth()
  const { envelopes, movements, loading, error } = useHouseholdBudget(household, user.uid)
  const [showNew, setShowNew] = useState(false)
  const [editing, setEditing] = useState(null)
  const [movement, setMovement] = useState(null)
  const total = envelopes.reduce((sum, envelope) => sum + Number(envelope.balance || 0), 0)

  const openMovement = (envelope, type) => setMovement({ envelope, type })

  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-28 pt-6 sm:px-6">
      <AppHeader title="Enveloppes" subtitle="L’argent réservé à vos projets" />

      {error && <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700 dark:bg-red-950 dark:text-red-200">{error}</p>}
      {loading ? <div className="space-y-3"><div className="h-44 animate-pulse rounded-[1.75rem] bg-slate-200 dark:bg-slate-800" /><div className="h-52 animate-pulse rounded-[1.75rem] bg-slate-200 dark:bg-slate-800" /></div> : <>
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 via-fuchsia-600 to-rose-500 p-5 text-white shadow-xl shadow-violet-500/20 sm:p-6"><span className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10" /><div className="relative flex items-start justify-between"><div><p className="text-sm font-bold text-white/70">Dans toutes les enveloppes</p><p className="mt-2 text-4xl font-black tabular-nums sm:text-5xl">{money(total)}</p><p className="mt-3 text-xs font-semibold text-white/70">{envelopes.length} enveloppe{envelopes.length > 1 ? 's' : ''} partagée{envelopes.length > 1 ? 's' : ''} entre vous deux</p></div><PiggyBank size={52} strokeWidth={1.5} className="text-white/70" /></div></section>

        <div className="mt-6 flex items-end justify-between gap-3"><div><h2 className="text-xl font-black">Vos enveloppes</h2><p className="mt-1 text-xs font-semibold text-muted">Ajoutez ou retirez de l’argent en un geste</p></div><button type="button" onClick={() => setShowNew(true)} className="flex min-h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-extrabold text-white"><Plus size={18} />Créer</button></div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">{envelopes.map((envelope) => {
          const target = Number(envelope.target || 0)
          const progress = target ? Math.round((Number(envelope.balance || 0) / target) * 100) : 0
          return <article key={envelope.id} className="relative overflow-hidden rounded-[1.75rem] bg-surface p-4 shadow-card"><button type="button" onClick={() => setEditing(envelope)} className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-xl bg-canvas text-muted" aria-label={`Modifier ${envelope.name}`}><Pencil size={16} /></button><CuteEnvelope icon={envelope.icon} color={envelope.color} /><h3 className="mt-3 pr-10 text-lg font-black">{envelope.name}</h3><p className="mt-1 text-3xl font-black tabular-nums">{money(envelope.balance)}</p>{target > 0 ? <div className="mt-4"><div className="flex justify-between text-[11px] font-bold text-muted"><span>Objectif {money(target)}</span><span>{Math.min(progress, 100)}%</span></div><div className="mt-1.5 h-2 overflow-hidden rounded-full bg-canvas"><span className="block h-full rounded-full bg-violet-500" style={{ width: `${Math.min(progress, 100)}%` }} /></div></div> : <p className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-muted"><Target size={14} />Pas d’objectif obligatoire</p>}<div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => openMovement(envelope, 'deposit')} className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 text-xs font-extrabold text-white"><ArrowDownLeft size={18} />Ajouter</button><button type="button" onClick={() => openMovement(envelope, 'withdrawal')} disabled={Number(envelope.balance) <= 0} className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-rose-500 text-xs font-extrabold text-white disabled:opacity-35"><ArrowUpRight size={18} />Retirer</button></div></article>
        })}</div>

        {envelopes.length === 0 && <div className="mt-4 rounded-[1.75rem] bg-surface p-8 text-center shadow-card"><div className="flex justify-center"><CuteEnvelope icon="💰" color="violet" /></div><h2 className="mt-4 text-lg font-black">Créez votre première enveloppe</h2><p className="mt-2 text-sm leading-6 text-muted">Épargne, laser, assurance ou voyage : séparez facilement l’argent de chaque projet.</p><button type="button" onClick={() => setShowNew(true)} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-violet-600 px-5 font-extrabold text-white"><Plus size={18} />Créer une enveloppe</button></div>}

        {movements.length > 0 && <section className="mt-7"><div><h2 className="text-xl font-black">Mouvements récents</h2><p className="mt-1 text-xs font-semibold text-muted">Chaque ajout et retrait reste visible</p></div><div className="mt-3 overflow-hidden rounded-[1.5rem] bg-surface shadow-card">{movements.slice(0, 15).map((item, index) => {
          const deposit = item.type === 'deposit'
          const author = household.memberProfiles?.[item.createdBy]?.displayName || 'Membre'
          return <div key={item.id} className={`flex items-center gap-3 p-4 ${index ? 'border-t border-slate-100 dark:border-slate-800' : ''}`}><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${deposit ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950' : 'bg-rose-50 text-rose-600 dark:bg-rose-950'}`}>{deposit ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">{item.envelopeIcon} {item.envelopeName}</p><p className="mt-0.5 truncate text-xs text-muted">{item.note || (deposit ? 'Argent ajouté' : 'Argent retiré')} · {author}</p></div><div className="text-right"><strong className={`block text-sm tabular-nums ${deposit ? 'text-emerald-600' : 'text-rose-600'}`}>{deposit ? '+' : '−'}{money(item.amount)}</strong><small className="text-[10px] text-muted">{item.createdAt?.toDate?.().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) || 'maintenant'}</small></div></div>
        })}</div></section>}
      </>}

      {(showNew || editing) && <EnvelopeSheet envelope={editing} onClose={() => { setShowNew(false); setEditing(null) }} />}
      {movement && <EnvelopeMovementSheet envelope={movement.envelope} initialType={movement.type} onClose={() => setMovement(null)} />}
    </main>
  )
}
