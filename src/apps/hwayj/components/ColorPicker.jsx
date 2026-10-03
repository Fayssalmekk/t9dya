import { Check, Palette, X } from 'lucide-react'
import { COLOR_CHOICES, colorHex, colorSwatchBackground, parseColors } from '../utils/colors'

export function ColorSwatch({ colors, className = '' }) {
  const label = parseColors(colors).join(', ') || 'Aucune couleur'
  return <span role="img" aria-label={label} title={label} className={`inline-block shrink-0 rounded-full border border-black/10 shadow-sm ${className}`} style={{ background: colorSwatchBackground(colors) }} />
}

export default function ColorPicker({ value, onChange }) {
  const selected = parseColors(value).slice(0, 3)

  const toggle = (color) => {
    const exists = selected.some((entry) => entry.toLocaleLowerCase('fr-FR') === color.toLocaleLowerCase('fr-FR'))
    if (!exists && color === 'Multicolore') { onChange('Multicolore'); return }
    const current = color === 'Multicolore' ? selected : selected.filter((entry) => entry !== 'Multicolore')
    if (!exists && selected.length >= 3) return
    onChange((exists ? current.filter((entry) => entry.toLocaleLowerCase('fr-FR') !== color.toLocaleLowerCase('fr-FR')) : [...current, color]).slice(0, 3).join(', '))
  }

  const makeMain = (color) => onChange([color, ...selected.filter((entry) => entry !== color)].join(', '))

  return (
    <div className="sm:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold">Couleurs</span>
        <span className="text-[11px] font-semibold text-muted">{selected.length}/3 · la première est principale</span>
      </div>
      <div className="mt-2 flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-surface px-3 dark:border-slate-700">
        <ColorSwatch colors={selected} className="h-9 w-9" />
        <span className="min-w-0 flex-1 py-3 text-sm font-semibold text-muted">{selected.join(', ') || 'Choisissez jusqu’à 3 couleurs'}</span>
        <Palette size={19} className="shrink-0 text-muted" />
      </div>
      {selected.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{selected.map((color, index) => <span key={color} className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-2.5 text-xs font-bold ${index === 0 ? 'border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-700 dark:bg-violet-950 dark:text-violet-100' : 'border-slate-200 bg-canvas dark:border-slate-700'}`}><button type="button" onClick={() => makeMain(color)} className="inline-flex items-center gap-2" title="Définir comme couleur principale"><ColorSwatch colors={[color]} className="h-5 w-5" />{color}{index === 0 && <Check size={13} />}</button><button type="button" onClick={() => toggle(color)} aria-label={`Retirer ${color}`}><X size={13} /></button></span>)}</div>}
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">{COLOR_CHOICES.map((color) => { const active = selected.some((entry) => entry.toLocaleLowerCase('fr-FR') === color.toLocaleLowerCase('fr-FR')); const disabled = !active && selected.length >= 3 && color !== 'Multicolore'; return <button key={color} type="button" disabled={disabled} onClick={() => toggle(color)} aria-label={`${active ? 'Retirer' : 'Ajouter'} ${color}`} className={`flex min-h-11 min-w-0 items-center gap-2 rounded-xl border px-2 text-left text-[10px] font-bold transition disabled:cursor-not-allowed disabled:opacity-30 ${active ? 'border-violet-500 bg-violet-50 text-violet-800 dark:bg-violet-950 dark:text-violet-100' : 'border-slate-200 bg-canvas text-muted dark:border-slate-700'}`}><span className="relative grid h-7 w-7 shrink-0 place-items-center rounded-full border border-black/10" style={{ background: color === 'Multicolore' ? colorSwatchBackground(['Multicolore']) : colorHex(color) }}>{active && <Check size={14} className={['Blanc', 'Blanc cassé', 'Écru', 'Ivoire', 'Jaune', 'Crème', 'Beige clair', 'Beige', 'Gris clair'].includes(color) ? 'text-slate-900' : 'text-white'} strokeWidth={3} />}</span><span className="truncate">{color}</span></button> })}</div>
    </div>
  )
}
