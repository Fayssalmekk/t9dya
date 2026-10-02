import { Droplets, Minus, Plus, Save } from 'lucide-react'

export const WATER_GOAL_ML = 2000

const clampWater = (value) => Math.min(WATER_GOAL_ML, Math.max(0, Number(value) || 0))

export function WaterGauge({ amountMl = 0, size = 'large' }) {
  const safeAmount = clampWater(amountMl)
  const percent = safeAmount / WATER_GOAL_ML * 100
  const compact = size === 'small'

  return <div className={`water-glass relative shrink-0 overflow-hidden border-white/70 bg-white/20 shadow-xl ${compact ? 'h-28 w-20 rounded-[1.5rem] border-[3px]' : 'h-44 w-32 rounded-[2.25rem] border-4'}`}>
    <div className="water-liquid absolute inset-x-0 bottom-0 transition-[height] duration-700 ease-out" style={{ height: `${percent}%` }}>
      <span className="water-wave water-wave-one" />
      <span className="water-wave water-wave-two" />
      <span className="absolute inset-0 bg-gradient-to-t from-blue-600/40 via-cyan-400/25 to-sky-200/20" />
      <span className="water-bubble left-[22%] h-2 w-2" />
      <span className="water-bubble left-[68%] h-3 w-3 [animation-delay:1.1s]" />
      <span className="water-bubble left-[46%] h-1.5 w-1.5 [animation-delay:2.2s]" />
    </div>
    <div className="absolute inset-0 z-10 grid place-items-center text-center text-white drop-shadow-md">
      <div><Droplets className="mx-auto opacity-90" size={compact ? 18 : 25} /><strong className={`mt-1 block font-black ${compact ? 'text-lg' : 'text-2xl'}`}>{(safeAmount / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} L</strong></div>
    </div>
  </div>
}

export function WaterEditor({ value, onChange, onSave, saving = false }) {
  const safeAmount = clampWater(value)
  const percent = safeAmount / WATER_GOAL_ML * 100
  const message = percent >= 100 ? 'Objectif atteint, belle hydratation !' : percent >= 75 ? 'Presque arrivé, encore un petit effort.' : percent >= 40 ? 'Très bon rythme, continue comme ça.' : percent > 0 ? 'Chaque verre compte.' : 'Faites glisser pour commencer.'
  const adjust = (amount) => onChange(clampWater(safeAmount + amount))

  return <form onSubmit={onSave} className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-sky-500 via-cyan-500 to-blue-700 p-5 text-white shadow-xl">
    <div className="relative flex items-center justify-between gap-5">
      <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/10 blur-sm" />
      <div className="min-w-0 flex-1"><p className="text-xs font-black uppercase tracking-[.2em] text-white/70">Hydratation</p><h3 className="mt-2 text-3xl font-black">{safeAmount.toLocaleString('fr-FR')} ml</h3><p className="mt-1 text-sm font-bold text-white/75">sur 2 litres pour cette journée</p><p className="mt-5 max-w-[12rem] text-sm leading-5 text-white/90">{message}</p></div>
      <WaterGauge amountMl={safeAmount} />
    </div>
    <div className="mt-6 rounded-2xl bg-slate-950/15 p-4 backdrop-blur-sm">
      <div className="mb-2 flex justify-between text-[11px] font-black uppercase tracking-wider text-white/70"><span>0 L</span><span>{Math.round(percent)} %</span><span>2 L</span></div>
      <input type="range" min="0" max={WATER_GOAL_ML} step="100" value={safeAmount} onChange={(event) => onChange(Number(event.target.value))} className="water-range w-full" style={{ '--water-progress': `${percent}%` }} aria-label="Quantité d’eau bue aujourd’hui" />
      <div className="mt-4 grid grid-cols-[1fr_1.5fr_1fr] gap-2">
        <button type="button" onClick={() => adjust(-250)} disabled={safeAmount === 0} className="flex min-h-12 items-center justify-center gap-1 rounded-xl bg-white/15 font-black disabled:opacity-35"><Minus size={18} />250</button>
        <button type="submit" disabled={saving} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white font-black text-blue-700 shadow-lg disabled:opacity-60"><Save size={18} />{saving ? 'Sauvegarde…' : 'Enregistrer'}</button>
        <button type="button" onClick={() => adjust(250)} disabled={safeAmount === WATER_GOAL_ML} className="flex min-h-12 items-center justify-center gap-1 rounded-xl bg-white/15 font-black disabled:opacity-35"><Plus size={18} />250</button>
      </div>
    </div>
  </form>
}

export function WaterTodayCard({ amountMl = 0 }) {
  const safeAmount = clampWater(amountMl)
  const percent = safeAmount / WATER_GOAL_ML * 100
  return <section className="relative mt-4 overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-sky-500 via-cyan-500 to-blue-700 p-5 text-white shadow-lg">
    <span className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-white/10" />
    <span className="pointer-events-none absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-blue-950/10" />
    <div className="relative flex items-center gap-4"><WaterGauge amountMl={safeAmount} size="small" /><div className="min-w-0 flex-1"><p className="text-xs font-black uppercase tracking-[.18em] text-white/70">Eau aujourd’hui</p><strong className="mt-1 block text-3xl font-black">{(safeAmount / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} <span className="text-lg text-white/75">/ 2 L</span></strong><p className="mt-2 text-sm font-bold text-white/80">{percent >= 100 ? 'Objectif atteint 💧' : `${Math.round(percent)} % de votre objectif`}</p><div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,.65)] transition-[width] duration-700" style={{ width: `${percent}%` }} /></div></div></div>
  </section>
}
