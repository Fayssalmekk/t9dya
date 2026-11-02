import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CalendarDays, Check, ChevronRight, CircleDollarSign, ExternalLink, Gift, Heart, Lightbulb, Link2, MapPin, MoreHorizontal, Pencil, Plane, Plus, Search, ShoppingBag, Sparkles, Star, Trash2, UsersRound, X } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { useConfirmDialog } from '../../../context/ConfirmContext'
import { usePlatform } from '../../../context/PlatformContext'
import { createWish, deleteWish, setWishStatus, subscribeWishes, toggleWishVote, updateWish } from '../../../services/wishlist'

const MotionArticle = motion.article
const MotionDiv = motion.div
const MotionForm = motion.form
const MotionButton = motion.button

const categories = {
  buy: { label: 'À acheter', short: 'Achats', emoji: '🛍️', icon: ShoppingBag, tone: 'bg-rose-50 text-rose-700 dark:bg-rose-950/45 dark:text-rose-200' },
  gift: { label: 'Cadeau', short: 'Cadeaux', emoji: '🎁', icon: Gift, tone: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/45 dark:text-fuchsia-200' },
  travel: { label: 'Voyage', short: 'Voyages', emoji: '✈️', icon: Plane, tone: 'bg-sky-50 text-sky-700 dark:bg-sky-950/45 dark:text-sky-200' },
  outing: { label: 'Sortie', short: 'Sorties', emoji: '🌆', icon: MapPin, tone: 'bg-amber-50 text-amber-700 dark:bg-amber-950/45 dark:text-amber-200' },
  experience: { label: 'Expérience', short: 'Expériences', emoji: '✨', icon: Sparkles, tone: 'bg-violet-50 text-violet-700 dark:bg-violet-950/45 dark:text-violet-200' },
  project: { label: 'Projet', short: 'Projets', emoji: '💡', icon: Lightbulb, tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-200' }
}

const views = [
  { id: 'active', label: 'Nos envies' },
  { id: 'planned', label: 'Planifiées' },
  { id: 'done', label: 'Réalisées' }
]

const blankWish = {
  title: '', category: 'buy', status: 'idea', forWhom: 'couple', priority: 'normal', estimatedBudget: '', targetDate: '', place: '', url: '', note: '', emoji: '🛍️'
}

const money = (value) => new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(Number(value) || 0)
const dateLabel = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

function recipientLabel(wish, household) {
  if (wish.forWhom === 'couple') return 'Pour nous deux'
  const name = household.memberProfiles?.[wish.forWhom]?.displayName
  return name ? `Pour ${name}` : 'Pour un membre'
}

function interestLabel(voters, members, currentUserId) {
  const count = voters?.length || 0
  if (!count) return 'Ça me plaît'
  if (count === members.length && members.length > 1) return 'On adore tous les deux'
  return voters.includes(currentUserId) ? 'Ça me plaît' : 'Plaît au partenaire'
}

function WishCard({ wish, household, userId, onEdit, onVote, onStatus }) {
  const category = categories[wish.category] || categories.buy
  const CategoryIcon = category.icon
  const liked = wish.voters?.includes(userId)
  const done = wish.status === 'done'

  return <MotionArticle layout className={`group relative overflow-hidden rounded-[1.65rem] border bg-surface p-4 shadow-[0_12px_35px_-24px_rgba(15,23,42,.65)] ${done ? 'border-slate-200/60 opacity-75 dark:border-slate-800' : 'border-white/80 dark:border-slate-800'}`}>
    <div className="flex items-start gap-3">
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${category.tone}`}><CategoryIcon size={22} /></span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2"><div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-[.14em] text-muted">{category.label} · {recipientLabel(wish, household)}</p><h3 className={`mt-1 text-[1.05rem] font-black leading-snug ${done ? 'line-through decoration-2' : ''}`}>{wish.title}</h3></div><button type="button" onClick={() => onEdit(wish)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-canvas text-muted transition active:scale-90" aria-label={`Modifier ${wish.title}`}><Pencil size={16} /></button></div>
        {wish.note && <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">{wish.note}</p>}
      </div>
    </div>

    <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold">
      {wish.priority === 'high' && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1.5 text-amber-800 dark:bg-amber-950/45 dark:text-amber-200"><Star size={13} fill="currentColor" />Coup de cœur</span>}
      {wish.estimatedBudget > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-canvas px-2.5 py-1.5 text-muted"><CircleDollarSign size={13} />{money(wish.estimatedBudget)} DH</span>}
      {wish.targetDate && <span className="inline-flex items-center gap-1 rounded-full bg-canvas px-2.5 py-1.5 text-muted"><CalendarDays size={13} />{dateLabel(wish.targetDate)}</span>}
      {wish.place && <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-canvas px-2.5 py-1.5 text-muted"><MapPin size={13} /><span className="truncate">{wish.place}</span></span>}
      {wish.url && <a href={wish.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full bg-canvas px-2.5 py-1.5 text-fuchsia-700 dark:text-fuchsia-300"><ExternalLink size={13} />Voir le lien</a>}
    </div>

    <div className="mt-4 grid grid-cols-[1fr_auto] gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
      <button type="button" onClick={() => onVote(wish, liked)} className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-black transition active:scale-[.97] ${liked ? 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/45 dark:text-fuchsia-200' : 'bg-canvas text-muted'}`}><Heart size={17} fill={liked ? 'currentColor' : 'none'} />{interestLabel(wish.voters || [], household.members || [], userId)}</button>
      <button type="button" onClick={() => onStatus(wish)} className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-black text-white transition active:scale-[.97] ${done ? 'bg-slate-700' : wish.status === 'planned' ? 'bg-emerald-600' : 'bg-fuchsia-600'}`}>{done ? 'Réouvrir' : wish.status === 'planned' ? <><Check size={16} />Réalisée</> : <>Planifier<ChevronRight size={16} /></>}</button>
    </div>
  </MotionArticle>
}

function WishSheet({ wish, household, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(() => wish ? {
    ...blankWish,
    ...wish,
    estimatedBudget: wish.estimatedBudget || ''
  } : blankWish)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const members = household.members || []

  const submit = async (event) => {
    event.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    setError('')
    try {
      await onSave(form)
      onClose()
    } catch {
      setError('Impossible d’enregistrer. Vérifiez votre connexion et les règles Firebase.')
    } finally { setSaving(false) }
  }

  return <MotionDiv className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/55 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="wish-sheet-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Fermer" />
    <MotionForm onSubmit={submit} initial={{ y: 45 }} animate={{ y: 0 }} exit={{ y: 45 }} className="relative max-h-[94dvh] w-full max-w-xl overflow-y-auto rounded-t-[2rem] bg-surface p-5 text-ink shadow-2xl sm:rounded-[2rem] sm:p-6">
      <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700 sm:hidden" />
      <div className="flex items-start gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-200"><Sparkles size={22} /></span><div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-[.18em] text-fuchsia-600">Une envie à garder</p><h2 id="wish-sheet-title" className="mt-1 text-xl font-black">{wish ? 'Modifier cette envie' : 'Ajouter une envie'}</h2></div><button type="button" onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-canvas" aria-label="Fermer"><X size={19} /></button></div>

      <label className="mt-6 block"><span className="mb-2 block text-sm font-black">Qu’est-ce qui vous ferait plaisir ? *</span><input autoFocus className="field-input" value={form.title} onChange={(event) => update('title', event.target.value)} maxLength={120} placeholder="Ex. Weekend à Chefchaouen" /></label>

      <fieldset className="mt-5"><legend className="mb-2 text-sm font-black">Type d’envie</legend><div className="grid grid-cols-3 gap-2">{Object.entries(categories).map(([key, category]) => { const Icon = category.icon; const active = form.category === key; return <button key={key} type="button" onClick={() => setForm((current) => ({ ...current, category: key, emoji: category.emoji }))} className={`flex min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-2xl border px-2 text-[11px] font-black transition ${active ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700 ring-2 ring-fuchsia-500/15 dark:bg-fuchsia-950/40 dark:text-fuchsia-200' : 'border-slate-200 bg-canvas text-muted dark:border-slate-800'}`}><Icon size={19} />{category.short}</button>})}</div></fieldset>

      <div className="mt-5 grid grid-cols-2 gap-3"><label><span className="mb-2 block text-sm font-black">Pour qui ?</span><select className="field-input" value={form.forWhom} onChange={(event) => update('forWhom', event.target.value)}><option value="couple">Nous deux</option>{members.map((uid) => <option key={uid} value={uid}>{household.memberProfiles?.[uid]?.displayName || 'Membre'}</option>)}</select></label><label><span className="mb-2 block text-sm font-black">Importance</span><select className="field-input" value={form.priority} onChange={(event) => update('priority', event.target.value)}><option value="normal">Normale</option><option value="high">Coup de cœur</option><option value="low">Un jour peut-être</option></select></label></div>
      <div className="mt-3 grid grid-cols-2 gap-3"><label><span className="mb-2 block text-sm font-black">Budget estimé</span><div className="relative"><input className="field-input pr-12" type="number" min="0" max="10000000" step="1" value={form.estimatedBudget} onChange={(event) => update('estimatedBudget', event.target.value)} placeholder="Facultatif" /><span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-muted">DH</span></div></label><label><span className="mb-2 block text-sm font-black">Date souhaitée</span><input className="field-input" type="date" value={form.targetDate} onChange={(event) => update('targetDate', event.target.value)} /></label></div>
      <label className="mt-3 block"><span className="mb-2 block text-sm font-black">Lieu</span><div className="relative"><MapPin className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={17} /><input className="field-input pl-11" value={form.place} onChange={(event) => update('place', event.target.value)} maxLength={150} placeholder="Ville, magasin, restaurant…" /></div></label>
      <label className="mt-3 block"><span className="mb-2 block text-sm font-black">Lien utile</span><div className="relative"><Link2 className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={17} /><input className="field-input pl-11" type="url" value={form.url} onChange={(event) => update('url', event.target.value)} maxLength={500} placeholder="https://…" /></div></label>
      <label className="mt-3 block"><span className="mb-2 block text-sm font-black">Petit mot ou détails</span><textarea className="field-input min-h-24 resize-none py-3" value={form.note} onChange={(event) => update('note', event.target.value)} maxLength={1000} placeholder="Taille, idée, adresse, pourquoi on l’aime…" /></label>
      <label className="mt-3 flex min-h-14 cursor-pointer items-center justify-between rounded-2xl bg-canvas px-4"><span><strong className="block text-sm">Déjà planifiée</strong><small className="text-muted">Elle apparaîtra dans l’onglet Planifiées</small></span><input type="checkbox" className="h-5 w-5 accent-fuchsia-600" checked={form.status === 'planned'} onChange={(event) => update('status', event.target.checked ? 'planned' : 'idea')} /></label>

      {error && <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-200" role="alert">{error}</p>}
      <button type="submit" disabled={saving || !form.title.trim()} className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-4 font-black text-white shadow-lg shadow-fuchsia-600/20 disabled:opacity-50">{saving ? <MoreHorizontal className="animate-pulse" size={21} /> : <Check size={20} />}{saving ? 'Enregistrement…' : wish ? 'Enregistrer les modifications' : 'Ajouter à nos envies'}</button>
      {wish && <button type="button" disabled={saving} onClick={onDelete} className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-black text-rose-600 disabled:opacity-50"><Trash2 size={17} />Supprimer cette envie</button>}
    </MotionForm>
  </MotionDiv>
}

export default function WishlistPage() {
  const { household, user } = useAuth()
  const { notify } = usePlatform()
  const confirm = useConfirmDialog()
  const reducedMotion = useReducedMotion()
  const [wishes, setWishes] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('active')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sheet, setSheet] = useState(null)

  useEffect(() => subscribeWishes(household.id, (entries) => { setWishes(entries); setLoading(false) }, () => { setLoading(false); notify('Impossible de charger les envies. Déployez les règles Firestore.') }), [household.id, notify])

  const members = household.members || []
  const activeWishes = useMemo(() => wishes.filter((wish) => wish.status !== 'done'), [wishes])
  const plannedCount = wishes.filter((wish) => wish.status === 'planned').length
  const sharedCount = activeWishes.filter((wish) => (wish.voters?.length || 0) === members.length && members.length > 1).length
  const estimatedTotal = activeWishes.reduce((sum, wish) => sum + (Number(wish.estimatedBudget) || 0), 0)

  const visibleWishes = useMemo(() => {
    const term = normalize(search)
    return wishes.filter((wish) => {
      const statusMatches = view === 'active' ? wish.status !== 'done' : wish.status === view
      const categoryMatches = categoryFilter === 'all' || wish.category === categoryFilter
      const searchMatches = !term || normalize(`${wish.title} ${wish.note} ${wish.place}`).includes(term)
      return statusMatches && categoryMatches && searchMatches
    }).sort((a, b) => {
      const priority = { high: 3, normal: 2, low: 1 }
      if ((priority[b.priority] || 0) !== (priority[a.priority] || 0)) return (priority[b.priority] || 0) - (priority[a.priority] || 0)
      if ((b.voters?.length || 0) !== (a.voters?.length || 0)) return (b.voters?.length || 0) - (a.voters?.length || 0)
      if (a.targetDate && b.targetDate && a.targetDate !== b.targetDate) return a.targetDate.localeCompare(b.targetDate)
      return (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0)
    })
  }, [categoryFilter, search, view, wishes])

  const save = async (values) => {
    if (sheet?.wish) await updateWish(household.id, sheet.wish.id, user.uid, values)
    else await createWish(household.id, user.uid, values)
    notify(sheet?.wish ? 'Envie mise à jour' : 'Nouvelle envie ajoutée pour vous deux ✨')
  }

  const remove = async () => {
    const wish = sheet?.wish
    if (!wish) return
    const accepted = await confirm({ title: 'Supprimer cette envie ?', message: `“${wish.title}” disparaîtra pour vous deux.`, confirmLabel: 'Supprimer' })
    if (!accepted) return
    try {
      await deleteWish(household.id, wish.id)
      setSheet(null)
      notify('Envie supprimée')
    } catch { notify('Suppression impossible. Vérifiez votre connexion.') }
  }

  const changeStatus = async (wish) => {
    const next = wish.status === 'idea' ? 'planned' : wish.status === 'planned' ? 'done' : 'idea'
    await setWishStatus(household.id, wish.id, user.uid, next)
    notify(next === 'done' ? 'Une envie réalisée ! Beau souvenir à garder 🎉' : next === 'planned' ? 'Envie ajoutée aux projets planifiés' : 'Envie réouverte')
  }

  const runAction = async (action) => {
    try { await action() } catch { notify('Action impossible pour le moment. Vérifiez votre connexion.') }
  }

  return <main className="min-h-dvh bg-canvas px-4 pb-[max(7rem,env(safe-area-inset-bottom))] pt-5 text-ink sm:px-6 sm:pt-8">
    <div className="mx-auto max-w-2xl">
      <header className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-700 text-white shadow-lg shadow-fuchsia-500/20"><Heart size={23} fill="currentColor" /></span><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-fuchsia-600">Notre boîte à rêves</p><h1 className="text-2xl font-black">Wish list</h1></div><button type="button" onClick={() => setSheet({ type: 'new' })} className="ml-auto flex min-h-11 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-xs font-black text-white shadow-lg dark:bg-white dark:text-slate-950"><Plus size={18} />Ajouter</button></header>

      {!loading && activeWishes.length > 0 && <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted" aria-label="Résumé des envies actives">
        <span><strong className="font-black text-ink">{activeWishes.length}</strong> envie{activeWishes.length > 1 ? 's' : ''} active{activeWishes.length > 1 ? 's' : ''}</span>
        {sharedCount > 0 && <span className="inline-flex items-center gap-1.5 text-fuchsia-700 dark:text-fuchsia-300"><Heart size={13} /><strong className="font-black">{sharedCount}</strong> en commun</span>}
        {estimatedTotal > 0 && <span className="inline-flex items-center gap-1.5"><CircleDollarSign size={14} />Budget estimé : <strong className="font-black text-ink">{money(estimatedTotal)} DH</strong></span>}
      </div>}

      <nav className="mt-5 grid grid-cols-3 rounded-2xl bg-surface p-1.5 shadow-sm" aria-label="États des envies">{views.map((entry) => <button key={entry.id} type="button" onClick={() => setView(entry.id)} className={`relative min-h-11 rounded-xl px-2 text-xs font-black transition ${view === entry.id ? 'bg-fuchsia-600 text-white shadow-md' : 'text-muted'}`}>{entry.label}{entry.id === 'planned' && plannedCount > 0 && <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[9px] ${view === entry.id ? 'bg-white/20' : 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-200'}`}>{plannedCount}</span>}</button>)}</nav>

      <div className="mt-4"><label className="relative block"><Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} /><input className="field-input pl-11" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une envie…" /></label></div>
      <div className="-mx-4 mt-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"><div className="flex w-max gap-2"><button type="button" onClick={() => setCategoryFilter('all')} className={`min-h-10 rounded-full px-4 text-xs font-black ${categoryFilter === 'all' ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'bg-surface text-muted'}`}>Tout</button>{Object.entries(categories).map(([key, category]) => <button key={key} type="button" onClick={() => setCategoryFilter(key)} className={`min-h-10 rounded-full px-3 text-xs font-black ${categoryFilter === key ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'bg-surface text-muted'}`}>{category.emoji} {category.short}</button>)}</div></div>

      <div className="mt-5 flex items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-muted">{views.find((entry) => entry.id === view)?.label}</p><h2 className="mt-1 text-lg font-black">{visibleWishes.length ? `${visibleWishes.length} idée${visibleWishes.length > 1 ? 's' : ''}` : 'À vous d’imaginer'}</h2></div>{members.length > 1 && <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted"><UsersRound size={15} />Synchronisé à deux</span>}</div>

      {loading ? <div className="mt-5 space-y-3">{[1, 2, 3].map((key) => <div key={key} className="h-40 animate-pulse rounded-[1.65rem] bg-surface" />)}</div> : <AnimatePresence mode="popLayout" initial={false}><MotionDiv layout className="mt-4 space-y-3">{visibleWishes.map((wish) => <WishCard key={wish.id} wish={wish} household={household} userId={user.uid} onEdit={(entry) => setSheet({ type: 'edit', wish: entry })} onVote={(entry, liked) => runAction(async () => { await toggleWishVote(household.id, entry.id, user.uid, liked); notify(liked ? 'Retiré de vos coups de cœur' : 'Ajouté à vos coups de cœur ❤️') })} onStatus={(entry) => runAction(() => changeStatus(entry))} />)}</MotionDiv></AnimatePresence>}

      {!loading && !visibleWishes.length && <section className="mt-5 rounded-[2rem] border border-dashed border-fuchsia-200 bg-surface px-6 py-10 text-center dark:border-fuchsia-900"><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-fuchsia-50 text-3xl dark:bg-fuchsia-950">{view === 'done' ? '🏆' : view === 'planned' ? '🗓️' : '💭'}</span><h3 className="mt-4 text-lg font-black">{search ? 'Aucun résultat' : view === 'done' ? 'Vos souvenirs réalisés arriveront ici' : view === 'planned' ? 'Rien de planifié pour le moment' : 'Votre liste attend sa première envie'}</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">{search ? 'Essayez un autre mot ou retirez le filtre.' : 'Ajoutez même les petites idées. Vous pourrez les choisir ensemble et les organiser plus tard.'}</p>{!search && view !== 'done' && <button type="button" onClick={() => setSheet({ type: 'new' })} className="mt-5 min-h-12 rounded-2xl bg-fuchsia-600 px-5 text-sm font-black text-white">Ajouter une première envie</button>}</section>}
    </div>

    <AnimatePresence>{sheet && <WishSheet key={sheet.wish?.id || 'new'} wish={sheet.wish} household={household} onClose={() => setSheet(null)} onSave={save} onDelete={remove} />}</AnimatePresence>
    {!sheet && <MotionButton type="button" onClick={() => setSheet({ type: 'new' })} whileTap={reducedMotion ? undefined : { scale: 0.9 }} className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-30 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-700 text-white shadow-xl shadow-fuchsia-800/30 sm:right-[calc(50%-20rem)]" aria-label="Ajouter une envie"><Plus size={26} /></MotionButton>}
  </main>
}
