import { CalendarCheck, Check, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { usePlatform } from '../../../context/PlatformContext'
import HwayjHeader from '../components/HwayjHeader'
import { useWardrobe } from '../context/WardrobeContext'
import { assignOutfit, markPlannedOutfitWorn, removeOutfitPlan } from '../services/wardrobe'

const today = new Date().toISOString().slice(0, 10)

export default function CalendarPage() {
  const { user } = useAuth()
  const { outfits, plans, clothes } = useWardrobe()
  const { notify } = usePlatform()
  const [date, setDate] = useState(today)
  const [outfitId, setOutfitId] = useState('')
  const sortedPlans = useMemo(() => [...plans].sort((a, b) => a.date.localeCompare(b.date)), [plans])
  const add = async () => { if (!outfitId) return; await assignOutfit(user.uid, date, outfitId); notify('Tenue planifiée') }

  return <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-32 pt-6 sm:px-6"><HwayjHeader title="Calendrier" subtitle="Planifiez sans réfléchir le matin" /><section className="rounded-[1.75rem] bg-surface p-5 shadow-card"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-violet-700"><CalendarCheck size={23} /></span><div><h2 className="font-black">Planifier une tenue</h2><p className="text-xs text-muted">Une tenue par date</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><input type="date" min={today} value={date} onChange={(event) => setDate(event.target.value)} className="field-input" /><select value={outfitId} onChange={(event) => setOutfitId(event.target.value)} className="field-input"><option value="">Choisir une tenue</option>{outfits.map((outfit) => <option key={outfit.id} value={outfit.id}>{outfit.name}</option>)}</select></div><button type="button" onClick={add} disabled={!outfitId} className="mt-3 min-h-12 w-full rounded-xl bg-violet-600 font-black text-white disabled:opacity-50">Ajouter au calendrier</button></section><section className="mt-6 space-y-3">{sortedPlans.map((plan) => { const outfit = outfits.find((entry) => entry.id === plan.outfitId); if (!outfit) return null; return <article key={plan.id} className={`rounded-[1.5rem] bg-surface p-4 shadow-sm ${plan.worn ? 'opacity-65' : ''}`}><div className="flex items-center gap-4"><div className="w-16 shrink-0 text-center"><strong className="block text-xl">{new Date(`${plan.date}T12:00:00`).toLocaleDateString('fr-FR', { day: '2-digit' })}</strong><small className="uppercase text-muted">{new Date(`${plan.date}T12:00:00`).toLocaleDateString('fr-FR', { month: 'short' })}</small></div><div className="flex min-w-0 flex-1 items-center -space-x-3">{outfit.items?.slice(0, 3).map((entry) => { const item = clothes.find((value) => value.id === entry.itemId); return item ? <img key={entry.itemId} src={item.thumb} alt="" className="h-12 w-12 rounded-full border-2 border-surface bg-canvas object-contain" /> : null })}</div><div className="min-w-0 flex-1"><strong className="block truncate">{outfit.name}</strong><small className="text-muted">{plan.worn ? 'Portée ✓' : outfit.occasion}</small></div></div><div className="mt-3 flex gap-2">{!plan.worn && <button type="button" onClick={async () => { await markPlannedOutfitWorn(user.uid, plan.date, outfit); notify('Tenue marquée comme portée') }} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-violet-100 text-sm font-black text-violet-700"><Check size={17} />Je l’ai portée</button>}<button type="button" onClick={() => removeOutfitPlan(user.uid, plan.date)} className="grid h-11 w-11 place-items-center rounded-xl bg-red-50 text-red-600" aria-label="Retirer"><Trash2 size={17} /></button></div></article>})}{sortedPlans.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-muted"><span className="text-5xl">📅</span><p className="mt-3 font-bold">Aucune tenue planifiée.</p></div>}</section></main>
}
