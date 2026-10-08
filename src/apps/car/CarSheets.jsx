import { useEffect, useId, useRef, useState } from 'react'
import { Minus, Plus, X } from 'lucide-react'
import HoldButton from './HoldButton'
import { DEFAULT_VEHICLE, displayDate, formatKm, localDate } from './model'

const errors = {
  MILEAGE_CHANGED: 'Le compteur a été modifié par votre partenaire. Fermez puis rouvrez cette fenêtre.',
  MILEAGE_DECREASE: 'Le kilométrage ne peut pas diminuer. Utilisez « Corriger une erreur » si nécessaire.',
  MILEAGE_UNCHANGED: 'Ce kilométrage est déjà enregistré.',
  CORRECTION_NOTE_REQUIRED: 'Expliquez la correction pour garder un historique clair.',
  INITIAL_MILEAGE_REQUIRED: 'Renseignez d’abord le kilométrage actuel.',
  UPDATE_MILEAGE_FIRST: 'Mettez d’abord le compteur à jour : il doit être au moins égal au kilométrage de cet entretien.',
  INVALID_TASK: 'Vérifiez les intervalles. Pour un rappel en mois, renseignez aussi une date de départ.',
  INVALID_SERVICE: 'Vérifiez la date (pas dans le futur) et le kilométrage.',
  INVALID_MILEAGE: 'Saisissez un nombre entier de kilomètres valide.',
  INVALID_VEHICLE: 'Renseignez au minimum le nom, la marque, le modèle, le carburant, la boîte et l’année.',
  INVALID_DATE: 'Vérifiez les dates de la voiture.',
  TASK_NOT_FOUND: 'Cet entretien a été supprimé. Fermez puis actualisez votre sélection.',
  AI_PLAN_CHANGED: 'La checklist IA a changé. Fermez cette fenêtre puis utilisez la nouvelle liste.',
  AI_CHECK_ALREADY_DONE: 'Votre partenaire vient déjà de confirmer ce check.'
}

function useSave(action, onClose) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const lock = useRef(false)
  const submit = async (event) => {
    event.preventDefault()
    if (lock.current) return
    lock.current = true
    setSaving(true)
    setError('')
    try { await action(); onClose() } catch (reason) {
      setError(errors[reason.message] || 'Impossible d’enregistrer. Vérifiez la connexion et les règles Firebase.')
    } finally { lock.current = false; setSaving(false) }
  }
  return { saving, error, submit }
}

function Sheet({ title, onClose, saving, error, submit, children, button = 'Enregistrer' }) {
  const titleId = useId()
  const panel = useRef(null)
  const close = useRef(null)
  useEffect(() => {
    const previous = document.activeElement
    close.current?.focus({ preventScroll: true })
    return () => { if (previous?.isConnected) previous.focus?.({ preventScroll: true }) }
  }, [])
  const keyboard = (event) => {
    if (event.key === 'Escape' && !saving) { event.stopPropagation(); onClose() }
    if (event.key !== 'Tab') return
    const items = [...panel.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]')]
    const first = items[0], last = items.at(-1)
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
  }
  return <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby={titleId} onKeyDown={keyboard}>
    <button type="button" tabIndex={-1} disabled={saving} onClick={onClose} className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm" aria-label="Fermer" />
    <section ref={panel} className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-surface p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-ink shadow-2xl sm:rounded-[2rem]">
      <header className="mb-5 flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-600">Notre garage</p><h2 id={titleId} className="mt-1 text-xl font-black">{title}</h2></div><button ref={close} type="button" disabled={saving} onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-canvas" aria-label="Fermer"><X size={20} /></button></header>
      <form onSubmit={submit} className="space-y-4">{children}{error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-200">{error}</p>}<button disabled={saving} className="min-h-14 w-full rounded-2xl bg-emerald-600 px-4 font-black text-white shadow-lg shadow-emerald-600/20 disabled:opacity-50">{saving ? 'Enregistrement…' : button}</button></form>
    </section>
  </div>
}

function Field({ label, children }) {
  return <label className="block"><span className="mb-2 block text-xs font-bold text-muted">{label}</span>{children}</label>
}

export function VehicleSheet({ vehicle, onSave, onClose }) {
  const [form, setForm] = useState(() => ({ ...DEFAULT_VEHICLE, ...vehicle }))
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const state = useSave(() => onSave(form), onClose)
  return <Sheet title="La voiture du foyer" onClose={onClose} {...state}>
    <p className="rounded-2xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">Ces informations permettent à l’IA de rechercher le bon plan d’entretien. Plus le moteur et la boîte sont précis, moins les recommandations seront génériques. La plaque n’est jamais envoyée à l’IA.</p>
    <Field label="Petit nom dans l’application"><input required maxLength={100} className="field-input" value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="Ex. Ma Fabia" /></Field>
    <div className="grid grid-cols-2 gap-3"><Field label="Marque *"><input required maxLength={60} className="field-input" value={form.make} onChange={(event) => update('make', event.target.value)} placeholder="Škoda" /></Field><Field label="Modèle *"><input required maxLength={60} className="field-input" value={form.model} onChange={(event) => update('model', event.target.value)} placeholder="Fabia" /></Field></div>
    <div className="grid grid-cols-2 gap-3"><Field label="Année *"><input required type="number" min={1900} max={2100} className="field-input" value={form.year} onChange={(event) => update('year', event.target.value)} /></Field><Field label="Finition / version"><input maxLength={80} className="field-input" value={form.trim} onChange={(event) => update('trim', event.target.value)} placeholder="Selection, Monte Carlo…" /></Field></div>
    <Field label="Moteur exact"><input maxLength={100} className="field-input" value={form.engine} onChange={(event) => update('engine', event.target.value)} placeholder="Ex. 1.0 TSI 115 ch" /></Field>
    <div className="grid grid-cols-2 gap-3"><Field label="Carburant *"><select required className="field-input" value={form.fuel} onChange={(event) => update('fuel', event.target.value)}>{['Essence', 'Diesel', 'Hybride essence', 'Hybride diesel', 'Électrique', 'GPL', 'Autre'].map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Type de boîte *"><select required className="field-input" value={form.transmission} onChange={(event) => update('transmission', event.target.value)}><option>Automatique</option><option>Manuelle</option></select></Field></div>
    <Field label="Boîte exacte"><input maxLength={60} className="field-input" value={form.gearbox} onChange={(event) => update('gearbox', event.target.value)} placeholder="Ex. DSG 7, BVM 5…" /></Field>
    <div className="grid grid-cols-2 gap-3"><Field label="Marché / pays"><input maxLength={60} className="field-input" value={form.market} onChange={(event) => update('market', event.target.value)} placeholder="Maroc" /></Field><Field label="1re mise en circulation"><input type="date" className="field-input" value={form.registrationDate} onChange={(event) => update('registrationDate', event.target.value)} /></Field></div>
    <Field label="Couleur / toit"><input maxLength={100} className="field-input" value={form.color} onChange={(event) => update('color', event.target.value)} /></Field>
    <Field label="Immatriculation (facultatif)"><input maxLength={30} className="field-input" value={form.plate} onChange={(event) => update('plate', event.target.value)} /></Field>
    <Field label="Assurance : date d’échéance"><input type="date" className="field-input" value={form.insuranceDate} onChange={(event) => update('insuranceDate', event.target.value)} /></Field>
    <Field label="Prochain contrôle technique (selon vos documents)"><input type="date" className="field-input" value={form.inspectionDate} onChange={(event) => update('inspectionDate', event.target.value)} /></Field>
    <Field label="Téléphone assistance (facultatif)"><input type="tel" maxLength={40} className="field-input" value={form.assistancePhone} onChange={(event) => update('assistancePhone', event.target.value)} /></Field>
    <p className="text-xs leading-5 text-muted">Le kilométrage se renseigne séparément. Si vous modifiez marque, modèle, moteur, carburant ou boîte, la prochaine actualisation IA refera une recherche Web adaptée.</p>
  </Sheet>
}

export function MileageSheet({ vehicle, initialValues, onSave, onClose }) {
  const [mode, setMode] = useState(() => initialValues && initialValues.value < initialValues.expected ? 'correction' : 'absolute')
  const [value, setValue] = useState(initialValues?.value ?? vehicle.odometer ?? '')
  const [expected] = useState(initialValues?.expected ?? vehicle.odometer ?? null)
  const [note, setNote] = useState('')
  const effectiveMode = mode !== 'increment' && expected !== null && Number(value) < expected ? 'correction' : mode
  const state = useSave(() => onSave({ mode: effectiveMode, value, note, expected }), onClose)
  const stepValue = (direction, step) => setValue((current) => Math.max(0, Math.min(2000000, (Number(current) || 0) + direction * step)))
  return <Sheet title="Mettre le compteur à jour" onClose={onClose} {...state}>
    <div className="grid grid-cols-2 gap-2">{[['absolute', 'Kilométrage actuel'], ['increment', 'Ajouter un trajet']].map(([key, label]) => <button key={key} type="button" disabled={key === 'increment' && expected === null} onClick={() => { setMode(key); setValue(key === 'absolute' ? expected ?? '' : '') }} className={`min-h-12 rounded-xl px-3 text-xs font-bold disabled:opacity-40 ${mode === key ? 'bg-emerald-600 text-white' : 'bg-canvas'}`}>{label}</button>)}</div>
    <div><label htmlFor="car-mileage-value" className="mb-2 block text-xs font-bold text-muted">{mode === 'increment' ? 'Distance parcourue en km' : 'Valeur affichée sur le tableau de bord'}</label><div className="flex items-center gap-2 rounded-2xl bg-canvas p-2"><HoldButton disabled={state.saving || Number(value) <= 0} label="Diminuer les kilomètres" onStep={(step) => stepValue(-1, step)} className="bg-surface text-emerald-700 shadow-sm"><Minus size={20} /></HoldButton><input id="car-mileage-value" required type="number" inputMode="numeric" min={0} max={2000000} step={1} className="min-h-16 w-full min-w-0 bg-transparent text-center font-mono text-3xl font-black tabular-nums outline-none" value={value} onChange={(event) => setValue(event.target.value)} /><HoldButton disabled={state.saving || Number(value) >= 2000000} label="Augmenter les kilomètres" onStep={(step) => stepValue(1, step)} className="bg-surface text-emerald-700 shadow-sm"><Plus size={20} /></HoldButton></div><p className="mt-2 text-center text-[11px] text-muted">km · Maintenez − ou + pour accélérer : 1, puis 10, puis 100 km.</p></div>
    <p className="text-xs text-muted">Dernier relevé : {expected === null ? 'non renseigné' : `${formatKm(expected)} km`}. Partagé entre vous deux.</p>
    {expected !== null && <button type="button" onClick={() => { setMode('correction'); setValue(expected) }} className="text-xs font-bold text-amber-700 underline dark:text-amber-300">Corriger une erreur de saisie</button>}
    {effectiveMode === 'correction' && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200">Correction manuelle : peut diminuer le compteur. L’ancienne valeur et la raison resteront dans l’historique.</p>}
    <Field label={effectiveMode === 'correction' ? 'Raison de la correction (obligatoire)' : 'Note / trajet (facultatif)'}><input required={effectiveMode === 'correction'} maxLength={240} className="field-input" value={note} onChange={(event) => setNote(event.target.value)} /></Field>
  </Sheet>
}

export function TaskSheet({ task, onSave, onClose }) {
  const [today] = useState(localDate)
  const [form, setForm] = useState(() => ({ name: '', intervalKm: '', intervalMonths: '', baselineKm: 0, baselineDate: '', note: '', ...task }))
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const state = useSave(() => onSave(form), onClose)
  return <Sheet title={task?.id ? 'Modifier l’entretien' : 'Planifier un entretien'} onClose={onClose} {...state}>
    <Field label="Nom"><input required maxLength={100} className="field-input" value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="Vidange, filtres, pneus…" /></Field>
    <p className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:bg-amber-950 dark:text-amber-200">Recopiez uniquement l’intervalle confirmé dans votre carnet ou par votre garage. Si kilomètres et mois sont renseignés, la première échéance atteinte compte.</p>
    <div className="grid grid-cols-2 gap-3"><Field label="Tous les … km"><input type="number" inputMode="numeric" min={0} max={200000} step={1} className="field-input" value={form.intervalKm} onChange={(event) => update('intervalKm', event.target.value)} placeholder="Selon le carnet" /></Field><Field label="Ou tous les … mois"><input type="number" inputMode="numeric" min={0} max={120} step={1} className="field-input" value={form.intervalMonths} onChange={(event) => update('intervalMonths', event.target.value)} placeholder="Facultatif" /></Field></div>
    <Field label="Dernier entretien connu / point de départ (km)"><input required type="number" inputMode="numeric" min={0} max={2000000} step={1} className="field-input" value={form.baselineKm} onChange={(event) => update('baselineKm', event.target.value)} /></Field>
    <Field label="Date du dernier entretien / point de départ"><input required={Number(form.intervalMonths) > 0} type="date" max={today} className="field-input" value={form.baselineDate} onChange={(event) => update('baselineDate', event.target.value)} /></Field>
    <Field label="Note / référence (facultatif)"><textarea maxLength={300} rows={2} className="field-input py-3" value={form.note} onChange={(event) => update('note', event.target.value)} /></Field>
    <p className="text-xs text-muted">Les interventions enregistrées dans le carnet priment sur ce point de départ. Aucun entretien n’est coché automatiquement.</p>
  </Sheet>
}

export function ServiceSheet({ task, odometer, description, onSave, onClose }) {
  const [today] = useState(localDate)
  const [form, setForm] = useState(() => ({ odometer: odometer ?? '', performedOn: localDate(), garage: '', note: '' }))
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const state = useSave(() => onSave(form), onClose)
  return <Sheet title={`${task.name} · effectué`} onClose={onClose} {...state} button="Confirmer l’intervention">
    <Field label="Kilométrage réel de l’intervention"><input required type="number" inputMode="numeric" min={0} max={odometer ?? 2000000} step={1} value={form.odometer} onChange={(event) => update('odometer', event.target.value)} className="field-input" /></Field>
    <Field label="Date"><input required type="date" max={today} value={form.performedOn} onChange={(event) => update('performedOn', event.target.value)} className="field-input" /></Field>
    <Field label="Garage (facultatif)"><input maxLength={100} value={form.garage} onChange={(event) => update('garage', event.target.value)} className="field-input" /></Field>
    <Field label="Détails / référence facture (facultatif)"><textarea rows={2} maxLength={300} value={form.note} onChange={(event) => update('note', event.target.value)} className="field-input py-3" /></Field>
    <p className="text-xs leading-5 text-muted">{description || 'La prochaine échéance repart de cette intervention. Vous pourrez ajouter son coût depuis le carnet : la dépense apparaîtra aussi dans Budget.'}</p>
  </Sheet>
}

export function DeleteSheet({ item, kind, onSave, onClose }) {
  const state = useSave(onSave, onClose)
  return <Sheet title="Confirmer la suppression" onClose={onClose} {...state} button="Supprimer">
    <p className="font-bold">{item.name || item.taskName || item.reason}</p>
    <p className="text-sm leading-6 text-muted">{kind === 'task' ? 'Ce rappel sera retiré. Ses interventions déjà enregistrées restent dans le carnet.' : kind === 'service' || kind === 'aiService' ? `L’intervention du ${displayDate(item.performedOn)} sera retirée et les échéances recalculées. Sa dépense éventuelle reste dans Budget et Voiture ; supprimez-la séparément si elle était aussi erronée.` : 'Cette dépense sera supprimée dans Voiture ET Budget. Si elle venait d’une enveloppe, son montant sera recrédité.'}</p>
  </Sheet>
}
