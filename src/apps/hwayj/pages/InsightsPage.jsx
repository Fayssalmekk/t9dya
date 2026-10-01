import { AlertCircle, BarChart3, Palette, Repeat2 } from 'lucide-react'
import { useMemo } from 'react'
import { ColorSwatch } from '../components/ColorPicker'
import HwayjHeader from '../components/HwayjHeader'
import { useWardrobe } from '../context/WardrobeContext'

const DAY_IN_MS = 86_400_000
const DORMANT_CUTOFF_MS = Date.now() - 90 * DAY_IN_MS

export default function InsightsPage() {
  const { clothes } = useWardrobe()
  const totalWears = clothes.reduce((sum, item) => sum + (item.wearCount || 0), 0)
  const mostWorn = [...clothes].sort((a, b) => (b.wearCount || 0) - (a.wearCount || 0)).slice(0, 5)
  const dormant = clothes.filter((item) => !item.lastWornAt || item.lastWornAt.toMillis() < DORMANT_CUTOFF_MS)
  const colors = useMemo(() => Object.entries(clothes.flatMap((item) => item.colors || []).reduce((result, color) => ({ ...result, [color]: (result[color] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1]).slice(0, 8), [clothes])
  const trackedValue = clothes.reduce((sum, item) => sum + (Number(item.price) || 0), 0)

  return <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-32 pt-6 sm:px-6"><HwayjHeader title="Insights" subtitle="Comprendre et mieux porter votre dressing" /><section className="grid grid-cols-2 gap-3"><Metric icon={BarChart3} label="Pièces" value={clothes.length} tone="violet" /><Metric icon={Repeat2} label="Total de ports" value={totalWears} tone="emerald" /><Metric icon={AlertCircle} label="Inactives 90 j" value={dormant.length} tone="amber" /><Metric icon={Palette} label="Valeur suivie" value={`${trackedValue.toFixed(0)} DH`} tone="sky" /></section><section className="mt-5 rounded-[1.75rem] bg-surface p-5 shadow-card"><h2 className="font-black">Les plus portés</h2><div className="mt-4 space-y-3">{mostWorn.map((item, index) => <div key={item.id} className="flex items-center gap-3"><span className="w-5 text-sm font-black text-muted">{index + 1}</span><img src={item.thumb} alt="" className="h-12 w-12 rounded-xl bg-canvas object-contain" /><div className="min-w-0 flex-1"><strong className="block truncate text-sm">{item.name}</strong><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><span className="block h-full rounded-full bg-violet-500" style={{ width: `${Math.max(6, (item.wearCount || 0) / Math.max(1, mostWorn[0]?.wearCount || 1) * 100)}%` }} /></div></div><strong className="text-sm">{item.wearCount || 0}×</strong></div>)}{!clothes.length && <p className="text-sm text-muted">Les statistiques apparaîtront après vos premiers ajouts.</p>}</div></section><section className="mt-5 rounded-[1.75rem] bg-surface p-5 shadow-card"><h2 className="font-black">Palette du dressing</h2><div className="mt-4 flex flex-wrap gap-2">{colors.map(([color, count]) => <span key={color} className="inline-flex items-center gap-2 rounded-full bg-canvas px-3 py-2 text-sm font-bold"><ColorSwatch colors={[color]} className="h-5 w-5" />{color} · {count}</span>)}{!colors.length && <p className="text-sm text-muted">Ajoutez des couleurs à vos vêtements.</p>}</div></section><section className="mt-5 rounded-[1.75rem] bg-amber-50 p-5 dark:bg-amber-950/50"><h2 className="font-black text-amber-900 dark:text-amber-100">À redécouvrir</h2><p className="mt-1 text-sm text-amber-800 dark:text-amber-200">{dormant.length} pièce{dormant.length > 1 ? 's' : ''} jamais portée{dormant.length > 1 ? 's' : ''} ou oubliée{dormant.length > 1 ? 's' : ''} depuis 90 jours.</p><div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto">{dormant.slice(0, 8).map((item) => <img key={item.id} src={item.thumb} alt={item.name} title={item.name} className="h-20 w-20 shrink-0 rounded-2xl bg-white object-contain p-1 dark:bg-slate-900" />)}</div></section></main>
}

function Metric({ icon: Icon, label, value, tone }) {
  const tones = { violet: 'bg-violet-100 text-violet-700', emerald: 'bg-emerald-100 text-emerald-700', amber: 'bg-amber-100 text-amber-700', sky: 'bg-sky-100 text-sky-700' }
  return <article className="rounded-[1.5rem] bg-surface p-4 shadow-sm"><span className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}><Icon size={20} /></span><strong className="mt-4 block text-2xl">{value}</strong><small className="text-muted">{label}</small></article>
}
