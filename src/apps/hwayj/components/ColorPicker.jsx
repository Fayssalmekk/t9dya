import { Check, Palette, X } from 'lucide-react'
import { COLOR_CHOICES, colorHex, colorSwatchBackground, parseColors } from '../utils/colors'

export function ColorSwatch({ colors, className = '' }) {
  const label = parseColors(colors).join(', ') || 'Aucune couleur'
  return <span role="img" aria-label={label} title={label} className={`inline-block shrink-0 rounded-full border border-black/10 shadow-sm ${className}`} style={{ background: colorSwatchBackground(colors) }} />
}

export default function ColorPicker({ value, onChange }) {
  const selected = parseColors(value)

  const toggle = (color) => {
    const exists = selected.some((entry) => entry.toLocaleLowerCase('fr-FR') === color.toLocaleLowerCase('fr-FR'))
    onChange((exists ? selected.filter((entry) => entry.toLocaleLowerCase('fr-FR') !== color.toLocaleLowerCase('fr-FR')) : [...selected, color]).join(', '))
  }

  const makeMain = (color) => onChange([color, ...selected.filter((entry) => entry !== color)].join(', '))

  return (
    <div className="sm:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold">Couleurs</span>
        <span className="text-[11px] font-semibold text-muted">La première est principale</span>
      </div>
      <div className="mt-2 flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-surface px-3 dark:border-slate-700">
        <ColorSwatch colors={selected} className="h-9 w-9" />
        <input value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 bg-transparent py-3 outline-none" placeholder="Ex. Noir, blanc" aria-label="Couleurs du vêtement" />
        <Palette size={19} className="shrink-0 text-muted" />
      </div>
      {selected.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{selected.map((color, index) => <span key={color} className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-2.5 text-xs font-bold ${index === 0 ? 'border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-700 dark:bg-violet-950 dark:text-violet-100' : 'border-slate-200 bg-canvas dark:border-slate-700'}`}><button type="button" onClick={() => makeMain(color)} className="inline-flex items-center gap-2" title="Définir comme couleur principale"><ColorSwatch colors={[color]} className="h-5 w-5" />{color}{index === 0 && <Check size={13} />}</button><button type="button" onClick={() => toggle(color)} aria-label={`Retirer ${color}`}><X size={13} /></button></span>)}</div>}
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">{COLOR_CHOICES.map((color) => { const active = selected.some((entry) => entry.toLocaleLowerCase('fr-FR') === color.toLocaleLowerCase('fr-FR')); return <button key={color} type="button" onClick={() => toggle(color)} aria-label={`${active ? 'Retirer' : 'Ajouter'} ${color}`} title={color} className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 transition ${active ? 'scale-105 border-violet-600' : 'border-surface ring-1 ring-slate-200 dark:ring-slate-700'}`} style={{ background: color === 'Multicolore' ? colorSwatchBackground(['Multicolore']) : colorHex(color) }}>{active && <Check size={17} className={['Blanc', 'Jaune', 'Crème', 'Beige'].includes(color) ? 'text-slate-900' : 'text-white'} strokeWidth={3} />}</button> })}</div>
    </div>
  )
}
