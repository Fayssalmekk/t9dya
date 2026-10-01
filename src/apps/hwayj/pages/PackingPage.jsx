import { Check, Luggage, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import HwayjHeader from '../components/HwayjHeader'
import { useWardrobe } from '../context/WardrobeContext'

export default function PackingPage() {
  const { clothes } = useWardrobe()
  const [days, setDays] = useState(3)
  const [trip, setTrip] = useState('Ville')
  const [season, setSeason] = useState('Été')
  const [list, setList] = useState([])
  const selectedItems = useMemo(() => list.map((entry) => ({ ...entry, item: clothes.find((item) => item.id === entry.id) })).filter((entry) => entry.item), [clothes, list])

  const generate = () => {
    const available = clothes.filter((item) => item.status === 'clean' && (!item.season?.length || item.season.includes(season)))
    const byCategory = (name) => available.filter((item) => item.category === name).sort((a, b) => (a.wearCount || 0) - (b.wearCount || 0))
    const picks = [...byCategory('Hauts').slice(0, Math.min(days, 5)), ...byCategory('Bas').slice(0, Math.max(1, Math.ceil(days / 2))), ...byCategory('Robes').slice(0, Math.ceil(days / 3)), ...byCategory('Vestes').slice(0, season === 'Été' ? 1 : 2), ...byCategory('Chaussures').slice(0, 2), ...byCategory('Accessoires').slice(0, trip === 'Plage' ? 3 : 2)]
    setList([...new Map(picks.map((item) => [item.id, { id: item.id, checked: false }])).values()])
  }

  return <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-32 pt-6 sm:px-6"><HwayjHeader title="Ma valise" subtitle="Une checklist depuis votre dressing" /><section className="rounded-[1.75rem] bg-surface p-5 shadow-card"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-100 text-sky-700"><Luggage size={23} /></span><div><h2 className="font-black">Préparer un voyage</h2><p className="text-xs text-muted">Hwayj privilégie les pièces propres et peu portées.</p></div></div><div className="mt-5 grid grid-cols-3 gap-2"><label className="text-xs font-bold text-muted">Jours<input type="number" min="1" max="30" value={days} onChange={(event) => setDays(Number(event.target.value))} className="field-input mt-2 px-2" /></label><label className="text-xs font-bold text-muted">Voyage<select value={trip} onChange={(event) => setTrip(event.target.value)} className="field-input mt-2 px-2"><option>Ville</option><option>Plage</option><option>Montagne</option><option>Business</option></select></label><label className="text-xs font-bold text-muted">Saison<select value={season} onChange={(event) => setSeason(event.target.value)} className="field-input mt-2 px-2"><option>Printemps</option><option>Été</option><option>Automne</option><option>Hiver</option></select></label></div><button type="button" onClick={generate} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-sky-600 font-black text-white"><RefreshCw size={18} />Générer ma valise</button></section><section className="mt-5 space-y-3">{selectedItems.map(({ id, checked, item }) => <button key={id} type="button" onClick={() => setList((current) => current.map((entry) => entry.id === id ? { ...entry, checked: !entry.checked } : entry))} className={`flex min-h-20 w-full items-center gap-4 rounded-2xl bg-surface p-3 text-left shadow-sm ${checked ? 'opacity-55' : ''}`}><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border-2 ${checked ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 text-transparent'}`}><Check size={20} /></span><img src={item.thumb} alt="" className="h-14 w-14 rounded-xl bg-canvas object-contain" /><span className="min-w-0 flex-1"><strong className={`block truncate ${checked ? 'line-through' : ''}`}>{item.name}</strong><small className="text-muted">{item.category} · {item.colors?.join(', ')}</small></span></button>)}{list.length > 0 && <p className="pt-2 text-center text-sm font-bold text-muted">{list.filter((entry) => entry.checked).length}/{list.length} pièces préparées</p>}{list.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-muted"><span className="text-5xl">🧳</span><p className="mt-3 font-bold">Configurez votre voyage puis générez la checklist.</p></div>}</section></main>
}
