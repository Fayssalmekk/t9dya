import { useMemo, useRef, useState } from 'react'
import { AlertTriangle, Check, RefreshCw, Sparkles, Wrench } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { callHwayjAI, getHwayjAIErrorMessage } from '../hwayj/services/ai'
import { saveCarAiPlan } from '../../services/car'
import { displayDate, formatKm, taskStatus } from './model'
import { carContext } from './aiModel'

function readChecks(plan) {
  try {
    const checks = JSON.parse(plan?.checksJson || '[]')
    return Array.isArray(checks) ? checks.filter((check) => check && check.key && check.label && check.advice).slice(0, 6) : []
  } catch { return [] }
}

function readJson(value, fallback) {
  try { return JSON.parse(value || '') } catch { return fallback }
}

function readSources(value) {
  const sources = readJson(value, [])
  return Array.isArray(sources) ? sources.filter((source) => typeof source?.title === 'string' && typeof source?.url === 'string' && /^https:\/\//i.test(source.url)).slice(0, 6) : []
}

const basisLabels = { history: 'Votre historique', manufacturer: 'Source constructeur', reliable: 'Source technique', inspection: 'Contrôle visuel', unknown: 'À confirmer' }

export default function AiMaintenance({ home, uid, vehicle, odometer, tasks, services, aiServices, plan, today, ready, notify, onComplete, onUndo, onConfigure }) {
  const reducedMotion = useReducedMotion()
  const [refreshing, setRefreshing] = useState(false)
  const refreshLock = useRef(false)
  const context = useMemo(() => carContext(vehicle, odometer, tasks, services, today), [vehicle, odometer, tasks, services, today])
  const input = useMemo(() => JSON.stringify(context), [context])
  const vehicleKey = useMemo(() => JSON.stringify(context.v), [context.v])
  const sameVehicle = !!plan && plan.vehicleKey === vehicleKey
  const sources = sameVehicle ? readSources(plan.sourcesJson) : []
  const research = sources.length && sameVehicle ? readJson(plan.researchJson, null) : null
  const checks = research ? readChecks(plan) : []
  const stale = !!plan && plan.input !== input
  const refresh = async () => {
    if (refreshLock.current || odometer === null) return
    if (checks.length && !stale) { notify('Le suivi IA est déjà à jour : aucun token consommé.'); return }
    refreshLock.current = true
    setRefreshing(true)
    try {
      const result = await callHwayjAI('car', { context, research, sources })
      await saveCarAiPlan(home, uid, input, result, odometer, vehicleKey, plan?.version || '')
      notify(result.webUsed ? 'Recherche Web terminée et plan voiture enregistré' : 'Checklist actualisée depuis la fiche technique enregistrée')
    } catch (error) {
      const message = error?.message === 'INVALID_AI_PLAN' ? 'La réponse IA était incomplète. Réessayez.' : error?.message === 'AI_PLAN_CHANGED' ? 'Votre partenaire a actualisé le suivi entre-temps. La nouvelle liste a été conservée.' : error?.message === 'VEHICLE_CHANGED' ? 'La fiche voiture a changé pendant la recherche. Relancez avec les nouvelles informations.' : getHwayjAIErrorMessage(error).replace('avec moins de pièces', 'dans quelques instants').replace('les images ou les paramètres', 'la recherche Web ou les paramètres')
      notify(message)
    } finally { refreshLock.current = false; setRefreshing(false) }
  }

  return <section className="mt-7 rounded-[1.75rem] border border-emerald-100 bg-surface p-4 shadow-sm dark:border-emerald-950 sm:p-5">
    <div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-700 text-white shadow-lg shadow-emerald-500/20"><Sparkles size={21} /></span><div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-600">Assistant entretien</p><h2 className="mt-1 text-lg font-black">Checks intelligents</h2><p className="mt-1 text-xs leading-5 text-muted">L’IA lit le compteur, vos échéances et l’historique. Elle ne coche rien à votre place.</p></div></div>
    <button type="button" disabled={!ready || odometer === null || refreshing} onClick={refresh} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white shadow-md disabled:opacity-45 dark:bg-emerald-500 dark:text-emerald-950"><RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />{refreshing ? research ? 'Mise à jour en cours…' : 'Recherche Web en cours…' : !research ? 'Rechercher mon plan sur le Web' : !checks.length || stale ? 'Actualiser les priorités' : 'Suivi IA à jour'}</button>
    {odometer === null && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200">Renseignez d’abord le kilométrage actuel.</p>}
    {stale && sameVehicle && <p className="mt-3 flex gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:bg-amber-950 dark:text-amber-200"><AlertTriangle size={17} className="mt-0.5 shrink-0" />Le compteur ou l’historique a changé. La fiche Web reste enregistrée ; seule la liste des priorités doit être recalculée.</p>}
    {!!plan && !sameVehicle && <p className="mt-3 flex gap-2 rounded-xl bg-violet-50 p-3 text-xs leading-5 text-violet-900 dark:bg-violet-950 dark:text-violet-200"><AlertTriangle size={17} className="mt-0.5 shrink-0" />Les informations techniques de la voiture ont changé. Une nouvelle recherche Web est nécessaire ; l’ancien plan est masqué.</p>}
    {research?.summary && <div className="mt-4 rounded-2xl bg-emerald-50/70 p-3 dark:bg-emerald-950/25"><p className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Fiche technique enregistrée</p><p className="mt-1 text-xs leading-5 text-muted">{research.summary}</p></div>}
    {!checks.length && odometer !== null && <div className="mt-4 rounded-2xl border border-dashed border-emerald-200 p-5 text-center dark:border-emerald-900"><Wrench size={24} className="mx-auto text-emerald-600" /><p className="mt-2 text-sm font-bold">{research ? 'Priorités à recalculer' : 'Votre plan personnalisé n’est pas encore recherché'}</p><p className="mt-1 text-xs leading-5 text-muted">La recherche utilise marque, modèle, année, moteur, carburant, boîte et marché. Plaque, dépenses, photos et identité restent exclus.</p></div>}
    {!!checks.length && <div className="mt-4 space-y-3">{checks.map((check, index) => {
      const task = tasks.find((item) => item.active && item.id === check.taskId)
      const status = task ? taskStatus(task, services, odometer, today) : null
      const completion = aiServices.find((entry) => entry.planVersion === plan.version && entry.aiKey === check.key)
      const remaining = status?.remainingKm ?? (Number.isInteger(check.remainingKm) && check.dueKm >= 0 ? check.remainingKm : null)
      const remainingDays = status?.remainingDays ?? (check.dueDate && Number.isInteger(check.remainingDays) ? check.remainingDays : null)
      const due = status?.due || check.urgency === 'due' || (remaining !== null && remaining <= 0) || (remainingDays !== null && remainingDays <= 0)
      const soon = status?.soon || check.urgency === 'soon' || (remainingDays !== null && remainingDays > 0 && remainingDays <= 30)
      const tone = completion ? 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/30' : due ? 'border-rose-200 bg-rose-50/70 dark:border-rose-900 dark:bg-rose-950/20' : soon ? 'border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/20' : 'border-slate-100 bg-canvas dark:border-slate-800'
      return <motion.article key={check.key} initial={reducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reducedMotion ? 0 : index * 0.045 }} className={`rounded-2xl border p-3.5 ${tone}`}>
        <div className="flex items-start gap-3"><button type="button" disabled={!ready} onClick={() => completion ? onUndo(completion) : onComplete(check, plan)} aria-label={completion ? `Annuler ${check.label}` : `Marquer ${check.label} comme effectué`} aria-pressed={!!completion} className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border-2 transition ${completion ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-surface text-transparent dark:border-slate-600'}`}><Check size={22} strokeWidth={3} /></button><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-1"><h3 className="font-black">{check.label}</h3><span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${completion ? 'bg-emerald-600 text-white' : due ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200' : soon ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' : 'bg-surface text-muted'}`}>{completion ? 'Fait' : due ? 'À faire' : soon ? 'Bientôt' : 'À surveiller'}</span></div>
          {completion ? <p className="mt-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">Confirmé le {displayDate(completion.performedOn)} · {formatKm(completion.odometer)} km</p> : <div className={`mt-1 space-y-0.5 ${due ? 'text-rose-700 dark:text-rose-300' : soon ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
            {remaining !== null && <p className="text-sm font-black">{remaining < 0 ? `${formatKm(-remaining)} km de dépassement estimé` : remaining === 0 ? 'Échéance kilométrique atteinte' : `Encore environ ${formatKm(remaining)} km`}{check.dueKm >= 0 && <span className="ml-1 text-[10px] font-bold text-muted">· vers {formatKm(check.dueKm)} km</span>}</p>}
            {remainingDays !== null && <p className="text-xs font-black">{remainingDays < 0 ? `${-remainingDays} jour${remainingDays < -1 ? 's' : ''} de retard estimé` : remainingDays === 0 ? 'Échéance estimée aujourd’hui' : `Encore environ ${remainingDays} jour${remainingDays > 1 ? 's' : ''}`} {check.dueDate && <span className="font-bold text-muted">· vers le {displayDate(check.dueDate)}</span>}</p>}
            {remaining === null && remainingDays === null && <p className="text-xs font-bold text-muted">À contrôler selon l’état réel, pas selon une distance fixe</p>}
          </div>}
          <p className="mt-2 text-xs leading-5 text-muted">{check.advice}</p><div className="mt-2 flex flex-wrap items-center gap-2"><span className="rounded-full bg-surface px-2 py-1 text-[9px] font-bold text-muted">{basisLabels[check.basis] || 'À confirmer'}</span>{task ? <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">Rappel « {task.name} »</span> : !completion && check.dueKm < 0 && <button type="button" onClick={() => onConfigure(check)} className="min-h-8 rounded-lg bg-surface px-2 text-[10px] font-black text-emerald-700 shadow-sm dark:text-emerald-300">Ajouter mon intervalle →</button>}</div></div></div>
      </motion.article>
    })}</div>}
    {!!sources.length && <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-800"><p className="text-[10px] font-black uppercase tracking-wider text-muted">Sources Web enregistrées</p><div className="mt-2 flex flex-wrap gap-2">{sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="max-w-full truncate rounded-full bg-canvas px-3 py-2 text-[10px] font-bold text-emerald-700 underline dark:text-emerald-300">{source.title}</a>)}</div></div>}
    {!!research && <p className="mt-3 text-center text-[10px] leading-4 text-muted">Aide de suivi : le carnet officiel de votre véhicule et le diagnostic du garage restent prioritaires.</p>}
    {sameVehicle && !!plan?.generatedOn && <p className="mt-3 text-center text-[10px] text-muted">Analyse du {displayDate(plan.generatedOn)} à {formatKm(plan.sourceKm)} km · relance uniquement si les données changent</p>}
  </section>
}
