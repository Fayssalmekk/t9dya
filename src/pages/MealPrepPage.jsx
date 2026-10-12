import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import { CalendarDays, Check, ChefHat, ChevronLeft, ChevronRight, Clock3, CopyPlus, CookingPot, LoaderCircle, Minus, PackageCheck, Plus, Search, ShoppingBasket, Sparkles, Trash2, Users, X } from 'lucide-react'
import AppHeader from '../components/AppHeader'
import { useAuth } from '../context/AuthContext'
import { useConfirmDialog } from '../context/ConfirmContext'
import { usePlatform } from '../context/PlatformContext'
import { useShopping } from '../context/ShoppingContext'
import { ingredientsById, pantryAssumptions } from '../features/cuisine/data/ingredients'
import { recipes } from '../features/cuisine/data/recipes'
import { subscribeCustomRecipes } from '../services/cuisine'
import { addShoppingItem } from '../services/shopping'
import { deleteMealPlan, saveMealPlan, subscribeMealPlans, updateMealPlanStatus } from '../services/mealPlanner'

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MEAL_TYPES = {
  lunch: { label: 'Déjeuner', icon: '☀️', tone: 'from-amber-400 to-orange-500' },
  dinner: { label: 'Dîner', icon: '🌙', tone: 'from-indigo-500 to-violet-600' }
}
const STATUS = {
  planned: { label: 'À préparer', className: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200' },
  prepared: { label: 'Au frais', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200' },
  eaten: { label: 'Mangé', className: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300' }
}

const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const atNoon = (key) => new Date(`${key}T12:00:00`)
const addDays = (key, amount) => { const date = atNoon(key); date.setDate(date.getDate() + amount); return dateKey(date) }
const mondayOf = (value) => { const date = new Date(value); date.setHours(12, 0, 0, 0); const day = date.getDay() || 7; date.setDate(date.getDate() - day + 1); return dateKey(date) }
const TODAY = dateKey(new Date())
const NEXT_WEEK = addDays(mondayOf(new Date()), 7)
const longDate = (key) => atNoon(key).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
const weekLabel = (start) => `${atNoon(start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} – ${atNoon(addDays(start, 6)).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`

const dishEmoji = (name = '') => {
  const value = name.toLowerCase()
  if (value.includes('poulet') || value.includes('djej')) return '🍗'
  if (value.includes('poisson') || value.includes('sardine')) return '🐟'
  if (value.includes('pizza')) return '🍕'
  if (value.includes('pâte') || value.includes('lasagne')) return '🍝'
  if (value.includes('soupe') || value.includes('harira')) return '🥣'
  if (value.includes('salade')) return '🥗'
  if (value.includes('couscous')) return '🍲'
  if (value.includes('tacos') || value.includes('wrap')) return '🌯'
  if (value.includes('riz')) return '🍚'
  if (value.includes('œuf') || value.includes('omelette')) return '🍳'
  return '🍽️'
}

const parseIngredients = (plan) => {
  try { return JSON.parse(plan.ingredientsJson || '[]') } catch { return [] }
}

function ProgressRing({ value, total }) {
  const percent = total ? Math.round((value / total) * 100) : 0
  return <span className="relative grid h-20 w-20 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(rgb(255 255 255) ${percent}%, rgb(255 255 255 / .18) 0)` }}><span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-600 text-center"><strong className="text-xl font-black">{value}</strong><small className="-mt-2 text-[9px] font-bold text-white/70">sur {total}</small></span></span>
}

function MealSlot({ type, plan, onAdd, onEdit, onStatus, onDelete, onLeftovers }) {
  const meta = MEAL_TYPES[type]
  if (!plan) return <button type="button" onClick={onAdd} className="group flex min-h-28 w-full items-center gap-4 rounded-[1.5rem] border-2 border-dashed border-slate-200 bg-surface/60 p-4 text-left transition active:scale-[.99] dark:border-slate-700"><span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${meta.tone} text-2xl shadow-lg`}>{meta.icon}</span><span className="min-w-0 flex-1"><small className="font-black uppercase tracking-wider text-muted">{meta.label}</small><strong className="mt-1 block">Choisir un plat</strong><span className="mt-1 block text-xs text-muted">Recette du carnet ou idée libre</span></span><Plus className="text-accent-600" /></button>

  const status = STATUS[plan.status] || STATUS.planned
  return <article className={`overflow-hidden rounded-[1.5rem] bg-surface shadow-card transition ${plan.status === 'eaten' ? 'opacity-65' : ''}`}><div className="flex items-center gap-4 p-4"><span className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${meta.tone} text-3xl shadow-lg`}>{plan.emoji}</span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><small className="font-black uppercase tracking-wider text-muted">{meta.label}</small><span className={`rounded-full px-2 py-1 text-[9px] font-black ${status.className}`}>{status.label}</span></span><strong className="mt-1 block truncate text-lg">{plan.name}</strong><small className="mt-1 flex items-center gap-3 text-muted"><span className="flex items-center gap-1"><Users size={13} />{plan.servings}</span>{plan.prepTime > 0 && <span className="flex items-center gap-1"><Clock3 size={13} />{plan.prepTime} min</span>}</small></span><button type="button" onClick={onEdit} className="grid h-10 w-10 place-items-center rounded-xl bg-canvas" aria-label={`Modifier ${plan.name}`}><ChevronRight size={18} /></button></div><div className="grid grid-cols-2 gap-1 border-t border-slate-100 p-2 dark:border-slate-800"><button type="button" onClick={onStatus} className="flex min-h-10 items-center justify-center gap-2 rounded-xl text-xs font-black text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/30">{plan.status === 'planned' ? <><PackageCheck size={16} />C’est préparé</> : plan.status === 'prepared' ? <><Check size={16} />C’est mangé</> : <><CookingPot size={16} />Remettre prévu</>}</button>{type === 'dinner' ? <button type="button" onClick={onLeftovers} className="flex min-h-10 items-center justify-center gap-2 rounded-xl text-xs font-black text-violet-700 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-950/30"><CopyPlus size={16} />Restes demain</button> : <button type="button" onClick={onDelete} className="flex min-h-10 items-center justify-center gap-2 rounded-xl text-xs font-black text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"><Trash2 size={15} />Retirer</button>}</div></article>
}

function MealPicker({ editor, candidates, saving, onClose, onSave, onDelete }) {
  const [selected, setSelected] = useState(() => editor.plan ? candidates.find((item) => item.id === editor.plan.recipeId && item.source === editor.plan.recipeSource) || null : null)
  const [query, setQuery] = useState(() => editor.plan?.recipeSource === 'free' ? editor.plan.name : '')
  const [manualMode, setManualMode] = useState(() => editor.plan?.recipeSource === 'free')
  const [servings, setServings] = useState(editor.plan?.servings || 2)
  const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr').trim()
  const normalized = normalize(query)
  const matches = normalized ? candidates.filter((item) => normalize(`${item.name} ${item.altName || ''}`).includes(normalized)) : []
  const suggestions = selected && !normalized ? [selected, ...candidates.filter((item) => item.id !== selected.id || item.source !== selected.source)] : candidates
  const visible = (normalized ? matches : suggestions).slice(0, normalized ? 24 : 5)
  const manualName = query.trim() && (manualMode || (normalized && matches.length === 0)) ? query.trim() : ''
  const changeQuery = (value) => { setQuery(value); setSelected(null); setManualMode(false) }
  const submit = (event) => { event.preventDefault(); if (selected) onSave(selected, servings); else if (manualName) onSave({ id: '', source: 'free', name: manualName, emoji: dishEmoji(manualName), prepTime: 0, ingredientIds: [], ingredients: [] }, servings) }

  return <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="meal-picker-title"><button type="button" onClick={onClose} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" aria-label="Fermer" /><form onSubmit={submit} className="relative max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] bg-canvas pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-[2rem]"><header className="sticky top-0 z-10 flex items-start gap-3 border-b border-slate-100 bg-canvas/95 p-5 backdrop-blur-xl dark:border-slate-800"><span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${MEAL_TYPES[editor.mealType].tone} text-2xl`}>{MEAL_TYPES[editor.mealType].icon}</span><div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-[.16em] text-accent-700">{longDate(editor.date)}</p><h2 id="meal-picker-title" className="text-xl font-black">{MEAL_TYPES[editor.mealType].label}</h2></div><button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-xl bg-surface"><X /></button></header><div className="p-5">
    <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={19} /><input value={query} onChange={(event) => changeQuery(event.target.value)} className="field-input pl-11 pr-12" placeholder="Chercher un plat ou écrire son nom…" aria-label="Chercher ou écrire un plat" maxLength={120} />{query && <button type="button" onClick={() => changeQuery('')} className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl bg-canvas text-muted" aria-label="Effacer la recherche"><X size={16} /></button>}</div>
    <div className="mt-5 flex items-center justify-between"><div><h3 className="font-black">{manualName ? 'Nouveau plat libre' : normalized ? 'Résultats' : 'Suggestions rapides'}</h3><p className="text-xs text-muted">{manualName ? 'Aucune recette identique : ce nom sera gardé tel quel.' : normalized ? `${matches.length} recette${matches.length !== 1 ? 's trouvées' : ' trouvée'}` : 'Tapez un mot pour voir les autres recettes.'}</p></div><span className="flex items-center gap-1 text-xs font-black text-orange-600"><Sparkles size={15} />{normalized ? 'Recherche' : 'Top 5'}</span></div>
    {manualName ? <div className="mt-3 flex items-center gap-3 rounded-2xl border-2 border-accent-500 bg-accent-50 p-4 dark:bg-accent-950/30"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-2xl shadow-sm dark:bg-slate-900">{dishEmoji(manualName)}</span><span className="min-w-0 flex-1"><small className="font-black uppercase tracking-wider text-accent-700">Saisie libre</small><strong className="mt-1 block truncate">{manualName}</strong></span><Check className="text-accent-600" /></div> : <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{visible.map((item) => <button key={`${item.source}-${item.id}`} type="button" onClick={() => { setSelected(item); setManualMode(false) }} className={`min-h-28 rounded-2xl border-2 p-3 text-left transition active:scale-[.98] ${selected?.id === item.id && selected?.source === item.source ? 'border-accent-500 bg-accent-50 dark:bg-accent-950/30' : 'border-transparent bg-surface'}`}><span className="text-3xl">{item.emoji}</span><strong className="mt-2 line-clamp-2 block text-sm">{item.name}</strong><small className="mt-1 block text-[10px] font-bold text-muted">{item.source === 'custom' ? 'Notre carnet' : `${item.prepTime} min`}</small></button>)}</div>}
    <div className="mt-5 flex items-center justify-between rounded-2xl bg-surface p-3"><span><strong className="block text-sm">Portions à préparer</strong><small className="text-muted">Pour vous deux et les restes</small></span><span className="flex items-center gap-2"><button type="button" onClick={() => setServings((value) => Math.max(1, value - 1))} className="grid h-11 w-11 place-items-center rounded-xl bg-canvas"><Minus size={18} /></button><strong className="w-7 text-center text-xl tabular-nums">{servings}</strong><button type="button" onClick={() => setServings((value) => Math.min(20, value + 1))} className="grid h-11 w-11 place-items-center rounded-xl bg-canvas"><Plus size={18} /></button></span></div>
    <button disabled={saving || (!selected && !manualName)} className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 font-black text-white shadow-lg disabled:opacity-40">{saving ? <LoaderCircle className="animate-spin" /> : <ChefHat />}{saving ? 'Enregistrement…' : editor.plan ? 'Mettre à jour ce repas' : manualName ? 'Ajouter ce plat libre' : selected ? 'Ajouter au planning' : 'Choisissez une recette'}</button>
    {editor.plan && <button type="button" onClick={onDelete} disabled={saving} className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl font-black text-rose-600 disabled:opacity-40"><Trash2 size={17} />Retirer du planning</button>}
  </div></form></div>
}

function PrepSheet({ plans, candidates, ingredients, lists, targetListId, setTargetListId, selectedIngredients, setSelectedIngredients, adding, saving, onAddToList, onPreparedOne, onPrepared, onClose }) {
  const pending = plans.filter((item) => item.status === 'planned')
  const [expandedId, setExpandedId] = useState('')
  const toggle = (id) => setSelectedIngredients((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next })
  return <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="prep-title"><button type="button" onClick={onClose} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" aria-label="Fermer" /><section className="relative max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] bg-canvas pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-[2rem]"><header className="sticky top-0 z-10 flex items-start gap-3 border-b border-slate-100 bg-canvas/95 p-5 backdrop-blur-xl dark:border-slate-800"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200"><CookingPot /></span><div className="flex-1"><p className="text-[10px] font-black uppercase tracking-[.16em] text-emerald-600">Mode organisation</p><h2 id="prep-title" className="text-xl font-black">Session meal prep</h2><p className="text-xs text-muted">Courses d’abord, cuisine ensuite.</p></div><button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-xl bg-surface"><X /></button></header><div className="p-5">
    <h3 className="font-black">1. Ce qu’il faut préparer</h3><div className="mt-3 space-y-2">{plans.filter((item) => item.status !== 'eaten').map((plan) => { const recipe = candidates.find((item) => item.id === plan.recipeId && item.source === plan.recipeSource); const steps = recipe?.steps || []; const expanded = expandedId === plan.id; return <article key={plan.id} className="overflow-hidden rounded-2xl bg-surface"><div className="flex items-center gap-3 p-3"><span className="text-2xl">{plan.emoji}</span><button type="button" onClick={() => steps.length && setExpandedId(expanded ? '' : plan.id)} className="min-w-0 flex-1 text-left"><strong className="block truncate">{plan.name}</strong><small className="text-muted">{DAYS[(atNoon(plan.date).getDay() + 6) % 7]} · {MEAL_TYPES[plan.mealType].label} · {plan.servings} portions{steps.length ? ` · ${expanded ? 'Masquer' : 'Voir la préparation'}` : ''}</small></button>{plan.status === 'prepared' ? <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950"><Check size={18} /></span> : <button type="button" onClick={() => onPreparedOne(plan)} className="grid h-9 w-9 place-items-center rounded-xl border-2 border-emerald-300 text-emerald-600" aria-label={`Marquer ${plan.name} comme préparé`}><Check size={17} /></button>}</div>{expanded && steps.length > 0 && <ol className="space-y-3 border-t border-slate-100 p-4 dark:border-slate-800">{steps.map((step, index) => <li key={`${index}-${step}`} className="flex gap-3 text-sm leading-5"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-orange-100 text-xs font-black text-orange-700">{index + 1}</span><span>{step}</span></li>)}</ol>}</article> })}</div>
    <div className="mt-6 flex items-end justify-between"><div><h3 className="font-black">2. Ingrédients regroupés</h3><p className="text-xs text-muted">Sel, huile, eau et poivre sont supposés au placard.</p></div><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">{selectedIngredients.size} choisis</span></div>
    <div className="mt-3 grid grid-cols-2 gap-2">{ingredients.map((ingredient) => { const selected = selectedIngredients.has(ingredient.id); return <button key={ingredient.id} type="button" onClick={() => toggle(ingredient.id)} className={`flex min-h-16 items-center gap-2 rounded-2xl border-2 p-3 text-left ${selected ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30' : 'border-transparent bg-surface opacity-65'}`}><span className="text-xl">{ingredient.emoji}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{ingredient.name}</strong><small className="text-muted">{ingredient.count > 1 ? `${ingredient.count} repas` : ingredient.quantityLabel}</small></span><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${selected ? 'bg-amber-500 text-white' : 'border-2 border-slate-300'}`}>{selected && <Check size={14} />}</span></button> })}</div>
    {ingredients.length > 0 && <div className="mt-3 rounded-2xl bg-surface p-3"><label className="text-xs font-black">Envoyer les ingrédients vers</label>{lists.length ? <><select value={targetListId} onChange={(event) => setTargetListId(event.target.value)} className="field-input mt-2">{lists.map((list) => <option key={list.id} value={list.id}>{list.title}</option>)}</select><button type="button" onClick={onAddToList} disabled={!targetListId || !selectedIngredients.size || adding} className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 font-black text-white disabled:opacity-40">{adding ? <LoaderCircle className="animate-spin" /> : <ShoppingBasket />}{adding ? 'Ajout en cours…' : 'Ajouter à la liste de courses'}</button></> : <p className="mt-2 text-sm text-muted">Créez d’abord une liste de courses active.</p>}</div>}
    <h3 className="mt-6 font-black">3. Quand tout est rangé au frais</h3><button type="button" onClick={onPrepared} disabled={!pending.length || saving} className="mt-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 font-black text-white shadow-lg disabled:opacity-40">{saving ? <LoaderCircle className="animate-spin" /> : <PackageCheck />}{pending.length ? `Marquer ${pending.length} repas comme préparés` : 'Tout est déjà prêt'}</button>
  </div></section></div>
}

export default function MealPrepPage() {
  const { household, user } = useAuth()
  const { lists, activeList, allItems } = useShopping()
  const { notify } = usePlatform()
  const confirm = useConfirmDialog()
  const [weekStart, setWeekStart] = useState(NEXT_WEEK)
  const [selectedDay, setSelectedDay] = useState(NEXT_WEEK)
  const [plans, setPlans] = useState([])
  const [customRecipes, setCustomRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [editor, setEditor] = useState(null)
  const [prepOpen, setPrepOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [adding, setAdding] = useState(false)
  const activeLists = useMemo(() => lists.filter((item) => item.status !== 'completed'), [lists])
  const [targetListId, setTargetListId] = useState('')
  const [selectedIngredients, setSelectedIngredients] = useState(new Set())

  useEffect(() => {
    if (!household?.id) return undefined
    const stopPlans = subscribeMealPlans(household.id, (data) => { setPlans(data); setLoading(false) }, () => { setLoading(false); notify('Impossible de charger le planning repas.') })
    const stopRecipes = subscribeCustomRecipes(household.id, setCustomRecipes, () => {})
    return () => { stopPlans(); stopRecipes() }
  }, [household?.id, notify])

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart])
  const weekPlans = useMemo(() => plans.filter((item) => item.date >= weekStart && item.date <= addDays(weekStart, 6)), [plans, weekStart])
  const dayPlans = useMemo(() => Object.fromEntries(weekPlans.filter((item) => item.date === selectedDay).map((item) => [item.mealType, item])), [selectedDay, weekPlans])
  const preparedCount = weekPlans.filter((item) => item.status === 'prepared' || item.status === 'eaten').length
  const effectiveTargetListId = activeLists.some((item) => item.id === targetListId) ? targetListId : activeLists.find((item) => item.id === activeList?.id)?.id || activeLists[0]?.id || ''
  const candidates = useMemo(() => [
    ...customRecipes.map((recipe) => ({ id: recipe.id, source: 'custom', name: recipe.name, altName: '', emoji: recipe.emoji || dishEmoji(recipe.name), prepTime: Number(recipe.prepTime) || 0, ingredientIds: [], ingredients: recipe.ingredients || [], steps: recipe.steps || [] })),
    ...recipes.filter((recipe) => recipe.type === 'meal').map((recipe) => ({ id: recipe.id, source: 'builtin', name: recipe.name_fr, altName: recipe.name_darija, emoji: dishEmoji(recipe.name_fr), prepTime: recipe.prepTime, ingredientIds: recipe.ingredients.filter((item) => item.required).map((item) => item.ingredientId), ingredients: [], steps: recipe.steps || [] }))
  ], [customRecipes])

  const prepIngredients = useMemo(() => {
    const grouped = new Map()
    weekPlans.filter((plan) => plan.status !== 'eaten').forEach((plan) => {
      const list = plan.recipeSource === 'builtin'
        ? (plan.ingredientIds || []).map((id) => ({ id, name: ingredientsById[id]?.name_fr || id, emoji: ingredientsById[id]?.emoji || '🛒', category: ingredientsById[id]?.category || 'other', quantity: 1, unit: 'à prévoir' }))
        : parseIngredients(plan).map((item, index) => ({ id: item.id || `${plan.recipeId || plan.id}-${index}`, name: item.name, emoji: item.emoji || '🛒', category: 'other', quantity: Number(String(item.quantity || 1).replace(',', '.')) || 1, unit: item.unit || 'pièce' }))
      list.filter((item) => item.name && !pantryAssumptions.includes(item.id)).forEach((item) => {
        const key = item.id || item.name.toLocaleLowerCase('fr')
        const current = grouped.get(key)
        if (current) { current.count += 1; if (current.unit === item.unit) current.quantity += item.quantity } else grouped.set(key, { ...item, id: key, count: 1 })
      })
    })
    return [...grouped.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'fr')).map((item) => ({ ...item, quantityLabel: item.quantity > 1 ? `${item.quantity} ${item.unit}` : item.unit }))
  }, [weekPlans])

  const openPrep = () => { setSelectedIngredients(new Set(prepIngredients.map((item) => item.id))); setPrepOpen(true) }
  const changeWeek = (amount) => { const next = addDays(weekStart, amount * 7); setWeekStart(next); setSelectedDay(next) }
  const openEditor = (date, mealType, plan = null) => setEditor({ date, mealType, plan })
  const save = async (candidate, servings) => {
    if (!household?.id || !user?.uid || !editor || saving) return
    setSaving(true)
    try {
      await saveMealPlan(household.id, user.uid, { date: editor.date, mealType: editor.mealType, recipeId: candidate.id, recipeSource: candidate.source, name: candidate.name, emoji: candidate.emoji, servings, prepTime: candidate.prepTime, ingredientIds: candidate.ingredientIds, ingredients: candidate.ingredients, status: editor.plan?.status || 'planned' })
      setEditor(null); notify(editor.plan ? 'Repas mis à jour.' : 'Repas ajouté au planning.')
    } catch { notify('Impossible d’enregistrer ce repas.') } finally { setSaving(false) }
  }
  const remove = async (plan) => {
    if (!plan || saving) return
    const accepted = await confirm({ title: `Retirer « ${plan.name} » ?`, message: 'Le créneau redeviendra libre dans le planning.', confirmLabel: 'Retirer' })
    if (!accepted) return
    setSaving(true); try { await deleteMealPlan(household.id, plan.id); setEditor(null); notify('Repas retiré du planning.') } catch { notify('Suppression impossible.') } finally { setSaving(false) }
  }
  const cycleStatus = async (plan) => {
    const next = plan.status === 'planned' ? 'prepared' : plan.status === 'prepared' ? 'eaten' : 'planned'
    try { await updateMealPlanStatus(household.id, plan.id, next, user.uid); if (next === 'prepared') notify('Bien joué, ce repas est au frais ✨') } catch { notify('Statut non modifié.') }
  }
  const copyLeftovers = async (plan) => {
    const date = addDays(plan.date, 1)
    const existing = plans.find((item) => item.date === date && item.mealType === 'lunch')
    if (existing) {
      const accepted = await confirm({ title: 'Remplacer le déjeuner ?', message: `${existing.name} est déjà prévu. Il sera remplacé par les restes de ${plan.name}.`, confirmLabel: 'Remplacer' })
      if (!accepted) return
    }
    try { await saveMealPlan(household.id, user.uid, { ...plan, date, mealType: 'lunch', name: `Restes · ${plan.name}`, servings: Math.max(1, plan.servings - 1), prepTime: 0, ingredientIds: [], ingredients: [], status: plan.status === 'planned' ? 'planned' : 'prepared' }); notify('Les restes sont prévus pour demain.') } catch { notify('Impossible de copier ce repas.') }
  }
  const markAllPrepared = async () => {
    const pending = weekPlans.filter((item) => item.status === 'planned')
    if (!pending.length || saving) return
    setSaving(true); try { await Promise.all(pending.map((item) => updateMealPlanStatus(household.id, item.id, 'prepared', user.uid))); setPrepOpen(false); notify(`${pending.length} repas rangés au frais. Super préparation !`) } catch { notify('Certains statuts n’ont pas été enregistrés.') } finally { setSaving(false) }
  }
  const addIngredients = async () => {
    const selected = prepIngredients.filter((item) => selectedIngredients.has(item.id))
    if (!selected.length || !effectiveTargetListId || adding) return
    setAdding(true)
    try {
      for (const ingredient of selected) {
        const productId = `mealprep-${ingredient.id}`.slice(0, 180)
        const duplicate = allItems.find((item) => item.listId === effectiveTargetListId && item.productId === productId && !item.bought)
        await addShoppingItem(household.id, effectiveTargetListId, { id: productId, name: ingredient.name, category: ingredient.category || 'other', categoryName: 'Meal prep', emoji: ingredient.emoji, defaultPrice: 0, unit: ingredient.unit }, user, { quantity: Math.max(1, ingredient.quantity || 1), unit: ingredient.unit, note: `Menus · semaine du ${weekStart}` }, duplicate)
      }
      notify(`${selected.length} ingrédient${selected.length > 1 ? 's ajoutés' : ' ajouté'} à la liste.`)
    } catch { notify('Impossible d’ajouter tous les ingrédients.') } finally { setAdding(false) }
  }

  return <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-32 pt-6 sm:px-6"><AppHeader title="Meal prep" subtitle="Planifier, acheter une fois, cuisiner sereinement" />
    <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 p-5 text-white shadow-xl"><span className="absolute -right-8 -top-10 text-[9rem] opacity-10">🥗</span><div className="relative flex items-center gap-4"><ProgressRing value={preparedCount} total={weekPlans.length} /><div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-100">Semaine organisée</p><h2 className="mt-1 text-2xl font-black">{weekPlans.length ? `${weekPlans.length} repas prévus` : 'Votre semaine, sans stress'}</h2><p className="mt-1 text-sm text-white/75">{preparedCount ? `${preparedCount} déjà préparé${preparedCount > 1 ? 's' : ''} et rangé${preparedCount > 1 ? 's' : ''}.` : 'Commencez par placer vos déjeuners et dîners.'}</p></div></div>{weekPlans.some((item) => item.status !== 'eaten') && <button type="button" onClick={openPrep} className="relative mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white font-black text-emerald-700 shadow-lg"><CookingPot size={19} />Ouvrir ma session meal prep</button>}</section>

    <section className="mt-5"><div className="flex items-center justify-between rounded-2xl bg-surface p-2 shadow-sm"><button type="button" onClick={() => changeWeek(-1)} className="grid h-11 w-11 place-items-center rounded-xl bg-canvas" aria-label="Semaine précédente"><ChevronLeft /></button><button type="button" onClick={() => { setWeekStart(NEXT_WEEK); setSelectedDay(NEXT_WEEK) }} className="text-center"><small className="block font-black uppercase tracking-wider text-accent-700">Planning semaine</small><strong>{weekLabel(weekStart)}</strong></button><button type="button" onClick={() => changeWeek(1)} className="grid h-11 w-11 place-items-center rounded-xl bg-canvas" aria-label="Semaine suivante"><ChevronRight /></button></div><div className="scrollbar-none mt-3 grid grid-cols-7 gap-1 overflow-x-auto">{weekDays.map((date, index) => { const count = weekPlans.filter((item) => item.date === date).length; const selected = selectedDay === date; return <button key={date} type="button" onClick={() => setSelectedDay(date)} className={`relative min-w-11 rounded-2xl px-1 py-3 text-center transition ${selected ? 'bg-slate-950 text-white shadow-lg dark:bg-white dark:text-slate-950' : date === TODAY ? 'bg-accent-100 text-accent-800 dark:bg-accent-950 dark:text-accent-200' : 'bg-surface text-muted'}`}><small className="block text-[9px] font-black uppercase">{DAYS[index]}</small><strong className="mt-1 block text-lg">{atNoon(date).getDate()}</strong><span className="mt-1 flex justify-center gap-0.5">{[0, 1].map((slot) => <i key={slot} className={`h-1.5 w-1.5 rounded-full ${slot < count ? selected ? 'bg-emerald-300' : 'bg-emerald-500' : selected ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`} />)}</span></button> })}</div></section>

    <section id="selected-day-menu" className="mt-6 scroll-mt-4"><div className="mb-3 flex items-end justify-between"><div><p className="text-xs font-black uppercase tracking-[.16em] text-emerald-600">{selectedDay === TODAY ? 'Aujourd’hui' : 'Votre menu'}</p><h2 className="text-xl font-black capitalize">{longDate(selectedDay)}</h2></div><span className="rounded-full bg-surface px-3 py-1 text-xs font-bold text-muted">{Object.keys(dayPlans).length}/2 prévu{Object.keys(dayPlans).length !== 1 ? 's' : ''}</span></div><div className="space-y-3">{Object.keys(MEAL_TYPES).map((type) => <MealSlot key={type} type={type} plan={dayPlans[type]} onAdd={() => openEditor(selectedDay, type)} onEdit={() => openEditor(selectedDay, type, dayPlans[type])} onStatus={() => cycleStatus(dayPlans[type])} onDelete={() => remove(dayPlans[type])} onLeftovers={() => copyLeftovers(dayPlans[type])} />)}</div></section>

    {weekPlans.length > 0 && <section className="mt-7"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-200"><CalendarDays /></span><div><h2 className="font-black">Vue de la semaine</h2><p className="text-xs text-muted">Repérez les trous sans changer de jour.</p></div></div><div className="mt-3 space-y-2">{weekDays.map((date, index) => { const items = weekPlans.filter((item) => item.date === date); return <button key={date} type="button" onClick={() => { setSelectedDay(date); window.requestAnimationFrame(() => document.getElementById('selected-day-menu')?.scrollIntoView({ behavior: 'smooth', block: 'start' })) }} className="flex min-h-16 w-full items-center gap-3 rounded-2xl bg-surface p-3 text-left shadow-sm"><span className="w-10 text-center"><small className="block text-[9px] font-black uppercase text-muted">{DAYS[index]}</small><strong>{atNoon(date).getDate()}</strong></span><span className="min-w-0 flex-1">{items.length ? <span className="flex gap-2">{items.map((item) => <span key={item.id} className="min-w-0 flex-1 truncate rounded-xl bg-canvas px-2 py-2 text-xs font-bold">{item.emoji} {item.name}</span>)}</span> : <span className="text-xs text-muted">Aucun repas prévu</span>}</span><ChevronRight size={17} className="text-muted" /></button> })}</div></section>}

    {!loading && !weekPlans.length && <section className="mt-7 rounded-[2rem] border-2 border-dashed border-emerald-200 bg-emerald-50/60 p-7 text-center dark:border-emerald-900 dark:bg-emerald-950/20"><span className="text-6xl">🗓️</span><h2 className="mt-4 text-xl font-black">Construisons votre semaine</h2><p className="mt-2 text-sm leading-6 text-muted">Commencez par un seul dîner. Vous pourrez ensuite prévoir ses restes pour le lendemain en un toucher.</p><button type="button" onClick={() => openEditor(selectedDay, 'dinner')} className="mt-5 min-h-12 rounded-2xl bg-emerald-600 px-5 font-black text-white">Planifier mon premier dîner</button></section>}
    {loading && <div className="grid min-h-48 place-items-center"><LoaderCircle className="animate-spin text-emerald-600" /></div>}

    <AnimatePresence>{editor && <Motion.div key="editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><MealPicker editor={editor} candidates={candidates} saving={saving} onClose={() => !saving && setEditor(null)} onSave={save} onDelete={() => remove(editor.plan)} /></Motion.div>}{prepOpen && <Motion.div key="prep" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><PrepSheet plans={weekPlans} candidates={candidates} ingredients={prepIngredients} lists={activeLists} targetListId={effectiveTargetListId} setTargetListId={setTargetListId} selectedIngredients={selectedIngredients} setSelectedIngredients={setSelectedIngredients} adding={adding} saving={saving} onAddToList={addIngredients} onPreparedOne={cycleStatus} onPrepared={markAllPrepared} onClose={() => !saving && !adding && setPrepOpen(false)} /></Motion.div>}</AnimatePresence>
  </main>
}
