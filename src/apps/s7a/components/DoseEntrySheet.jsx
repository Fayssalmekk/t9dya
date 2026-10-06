import { Minus, Plus, X } from 'lucide-react'

export default function DoseEntrySheet({ dose, setDose, onClose, onSubmit, saving = false }) {
  const units = Number(dose.units) || 0
  const changeUnits = (amount) => setDose((value) => ({ ...value, units: Math.min(200, Math.max(0.5, (Number(value.units) || 0) + amount)) }))

  return <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby="dose-sheet-title">
    <button type="button" onClick={() => !saving && onClose()} className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]" aria-label="Fermer" />
    <form onSubmit={onSubmit} className="relative max-h-[94dvh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-surface p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl">
      <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />
      <div className="flex items-center justify-between gap-3">
        <div><p className={`text-xs font-black uppercase tracking-[.16em] ${dose.insulin === 'novorapid' ? 'text-orange-500' : 'text-emerald-500'}`}>{dose.insulin === 'novorapid' ? 'Rapide' : 'Basale'}</p><h2 id="dose-sheet-title" className="text-2xl font-black">Dose réellement prise</h2></div>
        <button type="button" onClick={onClose} disabled={saving} className="grid h-11 w-11 place-items-center rounded-xl bg-canvas disabled:opacity-40" aria-label="Fermer"><X /></button>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setDose((value) => ({ ...value, insulin: 'novorapid' }))} disabled={saving} className={`min-h-14 rounded-2xl font-black disabled:opacity-50 ${dose.insulin === 'novorapid' ? 'bg-orange-500 text-white' : 'bg-canvas'}`}>NovoRapid</button>
        <button type="button" onClick={() => setDose((value) => ({ ...value, insulin: 'tresiba' }))} disabled={saving} className={`min-h-14 rounded-2xl font-black disabled:opacity-50 ${dose.insulin === 'tresiba' ? 'bg-emerald-600 text-white' : 'bg-canvas'}`}>Tresiba</button>
      </div>
      <div className="mt-5 rounded-[1.75rem] bg-canvas p-4 text-center sm:p-5">
        <p className="text-xs font-black uppercase tracking-[.16em] text-muted">Unités injectées</p>
        <div className="mt-3 grid grid-cols-[3.5rem_1fr_3.5rem] items-center gap-2 sm:grid-cols-[4rem_1fr_4rem] sm:gap-3">
          <button type="button" onClick={() => changeUnits(-1)} disabled={saving || units <= 0.5} className="grid h-14 w-14 place-items-center rounded-2xl bg-surface text-ink shadow-sm disabled:opacity-30 sm:h-16 sm:w-16" aria-label="Diminuer la dose"><Minus size={28} /></button>
          <label className="block"><input type="number" min="0.5" max="200" step="0.5" value={dose.units} onChange={(event) => setDose((value) => ({ ...value, units: event.target.value }))} disabled={saving} className="w-full bg-transparent text-center text-5xl font-black leading-none outline-none disabled:opacity-50 sm:text-6xl" inputMode="decimal" aria-label="Nombre d’unités" required /><span className="mt-2 block text-sm font-bold text-muted">unités</span></label>
          <button type="button" onClick={() => changeUnits(1)} disabled={saving} className="grid h-14 w-14 place-items-center rounded-2xl bg-surface text-ink shadow-sm disabled:opacity-30 sm:h-16 sm:w-16" aria-label="Augmenter la dose"><Plus size={28} /></button>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">{[2, 4, 6, 8, 10].map((value) => <button key={value} type="button" onClick={() => setDose((current) => ({ ...current, units: value }))} disabled={saving} className="min-h-10 min-w-11 rounded-full bg-surface px-3 text-xs font-black shadow-sm disabled:opacity-50">{value} u</button>)}</div>
      </div>
      <input value={dose.meal} onChange={(event) => setDose((value) => ({ ...value, meal: event.target.value }))} disabled={saving} className="field-input mt-4" placeholder="Repas concerné (facultatif)" maxLength={120} />
      <input type="datetime-local" value={dose.takenAt} onChange={(event) => setDose((value) => ({ ...value, takenAt: event.target.value }))} disabled={saving} className="field-input mt-3" required />
      <input value={dose.note} onChange={(event) => setDose((value) => ({ ...value, note: event.target.value }))} disabled={saving} className="field-input mt-3" placeholder="Note facultative" maxLength={300} />
      <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">Enregistrez uniquement la dose réellement prise selon votre plan médical. L’application ne calcule pas la dose.</p>
      <button type="submit" disabled={saving} className={`mt-4 min-h-14 w-full rounded-2xl px-4 font-black text-white shadow-lg disabled:opacity-60 ${dose.insulin === 'novorapid' ? 'bg-rose-600' : 'bg-emerald-600'}`}>{saving ? 'Enregistrement…' : 'Confirmer la prise'}</button>
    </form>
  </div>
}
