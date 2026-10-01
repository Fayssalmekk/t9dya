import { Archive, ArrowLeft, CalendarDays, ChevronDown, ChevronRight, CircleCheckBig, Plus, ScanLine, Send, Share2, Sparkles, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import BoughtPriceSheet from '../components/BoughtPriceSheet'
import NewListSheet from '../components/NewListSheet'
import ShoppingItem from '../components/ShoppingItem'
import { useAuth } from '../context/AuthContext'
import { usePlatform } from '../context/PlatformContext'
import { useShopping } from '../context/ShoppingContext'
import { catalogById } from '../data/catalog'
import { deleteShoppingList, finishShoppingList, removeShoppingItem, requestShoppingRun, restoreShoppingItem, selectShoppingList, startShoppingRun, unmarkItemBought, validateMany } from '../services/shopping'

export default function ListPage() {
  const { user, household } = useAuth()
  const { items: syncedItems, allItems, lists, activeList: syncedActiveList, incomingRequest, loading, error } = useShopping()
  const { notify } = usePlatform()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState({})
  const [buyingItem, setBuyingItem] = useState(null)
  const [shoppingMode, setShoppingMode] = useState(false)
  const [showNewList, setShowNewList] = useState(false)
  const [showFinish, setShowFinish] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [viewedListId, setViewedListId] = useState(null)
  const [listToDelete, setListToDelete] = useState(null)
  const [deletingList, setDeletingList] = useState(false)
  const wakeLockRef = useRef(null)

  const activeList = viewedListId ? lists.find((list) => list.id === viewedListId) || syncedActiveList : syncedActiveList
  const items = activeList
    ? allItems.filter((item) => item.listId === activeList.id || (activeList.id === 'inbox' && !item.listId))
    : syncedItems
  const activeItems = items.filter((item) => !item.bought)
  const boughtItems = items.filter((item) => item.bought)
  const displayedItems = shoppingMode ? activeItems : items
  const groupedItems = useMemo(() => displayedItems.reduce((groups, item) => {
    const key = item.categoryName || 'Autres'
    groups[key] ||= []
    groups[key].push({ ...item, emoji: catalogById[item.productId]?.emoji || item.emoji })
    return groups
  }, {}), [displayedItems])
  const eligibleForValidation = activeItems.filter((item) => item.status === 'proposed' && item.addedBy !== user.uid)
  const progress = items.length ? Math.round((boughtItems.length / items.length) * 100) : 0
  const estimatedTotal = activeItems.reduce((sum, item) => sum + Number(item.estimatedPrice || 0) * Number(item.quantity || 1), 0)
  const partnerId = household.members.find((memberId) => memberId !== user.uid)
  const partner = household.memberProfiles?.[partnerId]

  useEffect(() => {
    if (!shoppingMode || !navigator.wakeLock) return undefined
    let active = true
    navigator.wakeLock.request('screen').then((lock) => {
      if (active) wakeLockRef.current = lock
      else lock.release()
    }).catch(() => {})
    return () => {
      active = false
      wakeLockRef.current?.release()
      wakeLockRef.current = null
    }
  }, [shoppingMode])

  const deleteItem = async (item) => {
    await removeShoppingItem(household.id, item.id)
    notify(`${item.name} supprimé`, { label: 'Annuler', onClick: () => restoreShoppingItem(household.id, item) })
  }

  const unmarkBought = async (item) => {
    await unmarkItemBought(household.id, item)
    notify(`${item.name} remis dans la liste`)
    navigator.vibrate?.(25)
  }

  const shareList = async () => {
    const lines = activeItems.map((item) => `${item.emoji} ${item.name} — ${item.quantity} ${item.unit}${item.note ? ` (${item.note})` : ''}`)
    const text = [`🛒 *Liste T9dya — ${household.name}*`, '', ...lines, '', `Total estimé : ${estimatedTotal.toFixed(2)} DH`].join('\n')
    try {
      if (navigator.share) await navigator.share({ title: `Liste T9dya — ${household.name}`, text })
      else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
    } catch {
      // Closing the native share sheet is a normal user action.
    }
  }

  const sendToPartner = async () => {
    if (!activeList || !partnerId) return
    await requestShoppingRun(household.id, activeList.id, user.uid, partnerId)
    notify(`Liste envoyée à ${partner?.displayName || 'votre partenaire'}`)
  }

  const finishList = async () => {
    if (!activeList) return
    setFinishing(true)
    try {
      const fallback = lists.find((list) => list.status !== 'completed' && list.id !== activeList.id)
      await finishShoppingList(household.id, activeList, items, user.uid, fallback?.id)
      notify('Course archivée · aucune nouvelle liste créée')
      setShowFinish(false)
      setShoppingMode(false)
      setShowDetail(false)
      setViewedListId(null)
    } finally {
      setFinishing(false)
    }
  }

  const openList = async (list) => {
    setViewedListId(list.id)
    setShowDetail(true)
    if (list.status !== 'completed') await selectShoppingList(household.id, list.id)
  }

  const closeDetail = () => {
    setShowDetail(false)
    setViewedListId(null)
    setShoppingMode(false)
  }

  const confirmDeleteList = async () => {
    if (!listToDelete) return
    setDeletingList(true)
    const listItems = allItems.filter((item) => item.listId === listToDelete.id || (listToDelete.id === 'inbox' && !item.listId))
    const fallback = lists.find((list) => list.status !== 'completed' && list.id !== listToDelete.id)
    const isCurrentList = syncedActiveList?.id === listToDelete.id
    try {
      await deleteShoppingList(household.id, listToDelete, listItems, fallback?.id, isCurrentList)
      notify(`Liste « ${listToDelete.title} » supprimée`)
      setListToDelete(null)
      if (viewedListId === listToDelete.id) closeDetail()
    } catch {
      notify('Impossible de supprimer cette liste')
    } finally {
      setDeletingList(false)
    }
  }

  if (!showDetail) {
    return (
      <>
        <ListsOverview lists={lists} allItems={allItems} loading={loading} incomingRequest={incomingRequest} onOpen={openList} onDelete={setListToDelete} onNew={() => setShowNewList(true)} />
        {showNewList && <NewListSheet onClose={() => setShowNewList(false)} />}
        {listToDelete && <DeleteListDialog list={listToDelete} itemCount={listToDelete.status === 'completed' ? listToDelete.summary?.itemCount || 0 : allItems.filter((item) => item.listId === listToDelete.id || (listToDelete.id === 'inbox' && !item.listId)).length} deleting={deletingList} onCancel={() => setListToDelete(null)} onConfirm={confirmDeleteList} />}
      </>
    )
  }

  if (activeList?.status === 'completed') {
    return <ArchivedListDetail list={activeList} onBack={closeDetail} />
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-32 pt-6 sm:px-6">
      <button type="button" onClick={closeDetail} className="mb-4 flex min-h-11 items-center gap-2 rounded-xl pr-4 text-sm font-extrabold text-muted hover:text-ink"><ArrowLeft size={20} />Toutes les courses</button>
      <AppHeader title={activeList?.title || 'Course'} subtitle={`${activeItems.length} à prendre · ${boughtItems.length} dans le panier`} />
      {activeList?.plannedFor && <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-muted"><CalendarDays size={17} />Prévue le {activeList.plannedFor.toDate?.().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>}

      {incomingRequest && incomingRequest.id === activeList?.id && <section className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"><strong className="block">🔔 {household.memberProfiles?.[incomingRequest.requestedBy]?.displayName || 'Votre partenaire'} vous demande de faire cette course</strong><p className="mt-1 text-sm">{incomingRequest.title} · {items.length} produits</p><button type="button" onClick={() => { startShoppingRun(household.id, activeList.id, user.uid); setShoppingMode(true) }} className="mt-3 min-h-11 rounded-xl bg-amber-500 px-4 text-sm font-extrabold text-white">J’y vais · ouvrir le mode magasin</button></section>}

      <div className="mb-4 grid grid-cols-2 gap-3">
        <button type="button" onClick={() => setShoppingMode((value) => !value)} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl text-sm font-extrabold transition ${shoppingMode ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-surface text-ink shadow-sm'}`}><ScanLine size={18} />{shoppingMode ? 'Quitter le mode' : 'Mode magasin'}</button>
        <button type="button" onClick={shareList} disabled={!activeItems.length} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-surface text-sm font-extrabold shadow-sm disabled:opacity-40"><Share2 size={18} />Partager</button>
      </div>

      {activeList && activeList.assignedTo !== partnerId && activeList.assignedTo !== user.uid && activeList.status !== 'completed' && <button type="button" onClick={sendToPartner} className="mb-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-accent-100 bg-accent-50 text-sm font-extrabold text-accent-700"><Send size={18} />Demander à {partner?.displayName || 'mon partenaire'} de l’acheter</button>}
      {activeList?.assignedTo === partnerId && activeList.status === 'requested' && <p className="mb-4 rounded-xl bg-blue-50 p-3 text-center text-sm font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-200">Demande envoyée à {partner?.displayName || 'votre partenaire'} ✓</p>}

      {shoppingMode && <div className="mb-4 rounded-2xl border border-accent-100 bg-accent-50 p-4 text-sm text-accent-700"><strong className="block">🛒 Mode magasin actif</strong><span className="mt-1 block leading-5">Seulement les articles restants, avec de grands boutons et l’écran maintenu éveillé.</span></div>}

      <section className="relative overflow-hidden rounded-[1.75rem] bg-slate-900 p-5 text-white shadow-card dark:bg-accent-700">
        <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-accent-500/30 blur-2xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">Estimation restante</p><p className="mt-2 text-3xl font-black tabular-nums">{estimatedTotal.toFixed(2)} <span className="text-base text-white/70">DH</span></p></div>
          <div className="text-right"><p className="text-2xl font-black">{progress}%</p><p className="text-xs text-white/65">{boughtItems.length}/{items.length} achetés</p></div>
        </div>
        <div className="relative mt-5 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-teal-300 transition-all duration-500" style={{ width: `${progress}%` }} /></div>
        {eligibleForValidation.length > 0 && <button type="button" onClick={() => validateMany(household.id, eligibleForValidation, user.uid)} className="relative mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-bold backdrop-blur hover:bg-white/20"><CircleCheckBig size={18} />Valider les {eligibleForValidation.length} propositions</button>}
      </section>

      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}

      {loading ? (
        <div className="mt-6 space-y-3" aria-label="Chargement"><div className="h-24 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" /><div className="h-24 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" /><div className="h-24 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" /></div>
      ) : items.length === 0 ? (
        <section className="mt-6 rounded-[1.75rem] bg-surface p-8 text-center shadow-card">
          <span className="text-6xl">🧺</span><h2 className="mt-5 text-xl font-extrabold">Votre panier attend sa première idée</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">Parcourez le catalogue marocain et ajoutez vos produits en quelques secondes.</p>
          <button type="button" onClick={() => navigate('/catalog')} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-accent-600 px-5 font-extrabold text-white"><Sparkles size={19} />Explorer le catalogue</button>
        </section>
      ) : shoppingMode && activeItems.length === 0 ? (
        <section className="mt-6 rounded-[1.75rem] bg-surface p-8 text-center shadow-card"><span className="text-6xl">🎉</span><h2 className="mt-5 text-xl font-extrabold">Tout est dans le panier</h2><p className="mt-2 text-sm text-muted">Quittez le mode magasin pour revoir les articles achetés et en décocher un si nécessaire.</p><button type="button" onClick={() => setShoppingMode(false)} className="mt-5 min-h-12 rounded-xl bg-accent-600 px-5 font-extrabold text-white">Voir toute la liste</button></section>
      ) : (
        <div className="mt-7 space-y-6">
          {Object.entries(groupedItems).map(([categoryName, categoryItems]) => {
            const isCollapsed = collapsed[categoryName]
            const categoryBought = categoryItems.filter((item) => item.bought).length
            return (
              <section key={categoryName}>
                <button type="button" onClick={() => setCollapsed((value) => ({ ...value, [categoryName]: !value[categoryName] }))} className="mb-3 flex min-h-11 w-full items-center gap-3 text-left">
                  <span className="text-2xl">{categoryItems[0].emoji}</span><span className="flex-1 font-extrabold">{categoryName}</span><span className="text-xs font-bold text-muted">{categoryBought}/{categoryItems.length}</span>{isCollapsed ? <ChevronRight size={19} /> : <ChevronDown size={19} />}
                </button>
                {!isCollapsed && <div className="space-y-3">{categoryItems.map((item) => <ShoppingItem key={item.id} item={item} onBuy={setBuyingItem} onUnbuy={unmarkBought} onDelete={deleteItem} shoppingMode={shoppingMode} />)}</div>}
              </section>
            )
          })}
        </div>
      )}
      {buyingItem && <BoughtPriceSheet item={buyingItem} onClose={() => setBuyingItem(null)} />}
      {items.length > 0 && !shoppingMode && <button type="button" onClick={() => setShowFinish(true)} className="mt-7 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-surface font-extrabold shadow-sm dark:border-slate-700"><Archive size={20} />Terminer et archiver cette course</button>}
      {showFinish && <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true"><button type="button" className="absolute inset-0 bg-slate-950/50" onClick={() => setShowFinish(false)} aria-label="Fermer" /><section className="relative w-full max-w-lg rounded-t-[2rem] bg-surface p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"><button type="button" onClick={() => setShowFinish(false)} className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-xl bg-canvas" aria-label="Fermer"><X size={19} /></button><span className="text-4xl">🧾</span><h2 className="mt-4 text-xl font-extrabold">Terminer « {activeList?.title} » ?</h2><p className="mt-2 text-sm leading-6 text-muted">{boughtItems.length} produits achetés seront archivés avec un total de {boughtItems.reduce((sum, item) => sum + (item.paidPrice || 0), 0).toFixed(2)} DH. Les {activeItems.length} produits non achetés resteront indiqués comme reportés dans le résumé. Aucune nouvelle liste ne sera créée automatiquement.</p><button type="button" disabled={finishing} onClick={finishList} className="mt-6 min-h-14 w-full rounded-2xl bg-accent-600 font-extrabold text-white disabled:opacity-60">{finishing ? 'Archivage…' : 'Terminer cette course'}</button></section></div>}
    </main>
  )
}

function ListsOverview({ lists, allItems, loading, incomingRequest, onOpen, onDelete, onNew }) {
  const activeLists = lists.filter((list) => list.status !== 'completed')
  const completedLists = lists.filter((list) => list.status === 'completed')
  const completedByMonth = completedLists.reduce((groups, list) => {
    const date = list.completedAt?.toDate?.() || list.plannedFor?.toDate?.() || list.createdAt?.toDate?.() || new Date()
    const key = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    groups[key] ||= []
    groups[key].push(list)
    return groups
  }, {})

  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-32 pt-6 sm:px-6">
      <AppHeader title="Mes courses" subtitle="Une liste claire pour chaque sortie" />

      <button type="button" onClick={onNew} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-accent-600 font-extrabold text-white shadow-lg shadow-teal-600/20 transition active:scale-[0.99]"><Plus size={21} />Créer une nouvelle liste</button>

      {incomingRequest && <button type="button" onClick={() => onOpen(incomingRequest)} className="mt-4 flex min-h-20 w-full items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left text-amber-900 shadow-sm dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"><span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-400 text-2xl">🛒</span><span className="min-w-0 flex-1"><strong className="block truncate">Course demandée</strong><small className="mt-1 block truncate">{incomingRequest.title} vous attend</small></span><ChevronRight size={21} /></button>}

      <section className="mt-8">
        <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-accent-700">À faire</p><h2 className="mt-1 text-xl font-extrabold">Listes actives</h2></div><span className="rounded-full bg-accent-50 px-3 py-1 text-xs font-extrabold text-accent-700">{activeLists.length}</span></div>
        <div className="mt-4 space-y-3">
          {loading ? <><ListSkeleton /><ListSkeleton /></> : activeLists.length ? activeLists.map((list) => <CourseCard key={list.id} list={list} items={allItems.filter((item) => item.listId === list.id || (list.id === 'inbox' && !item.listId))} active onOpen={onOpen} onDelete={onDelete} />) : <div className="rounded-2xl border border-dashed border-slate-300 p-7 text-center dark:border-slate-700"><span className="text-4xl">📝</span><p className="mt-3 font-bold">Aucune liste active</p><p className="mt-1 text-sm text-muted">Créez la prochaine course en un clic.</p></div>}
        </div>
      </section>

      <section className="mt-9">
        <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-muted">Archives</p><h2 className="mt-1 text-xl font-extrabold">Courses terminées</h2></div><Archive size={20} className="text-muted" /></div>
        {Object.keys(completedByMonth).length ? <div className="mt-5 space-y-7">{Object.entries(completedByMonth).map(([month, monthLists]) => <div key={month}><h3 className="mb-3 capitalize text-sm font-extrabold text-muted">{month}</h3><div className="space-y-3">{monthLists.map((list) => <CourseCard key={list.id} list={list} items={[]} onOpen={onOpen} onDelete={onDelete} />)}</div></div>)}</div> : <div className="mt-4 rounded-2xl bg-surface p-6 text-center text-sm text-muted shadow-sm">Les courses terminées apparaîtront ici, classées par mois.</div>}
      </section>
    </main>
  )
}

function CourseCard({ list, items, active = false, onOpen, onDelete }) {
  const date = list.plannedFor?.toDate?.() || list.createdAt?.toDate?.() || new Date()
  const boughtCount = active ? items.filter((item) => item.bought).length : list.summary?.boughtCount || 0
  const itemCount = active ? items.length : list.summary?.itemCount || 0
  const amount = active
    ? items.filter((item) => !item.bought).reduce((sum, item) => sum + Number(item.estimatedPrice || 0) * Number(item.quantity || 1), 0)
    : Number(list.summary?.total || 0)
  const statusLabel = list.status === 'requested' ? 'Demandée' : list.status === 'shopping' ? 'En magasin' : active ? 'Active' : 'Terminée'

  return (
    <article className={`flex min-h-28 items-stretch overflow-hidden rounded-[1.4rem] border transition ${active ? 'border-accent-100 bg-surface shadow-card hover:border-accent-500' : 'border-slate-200 bg-slate-100/80 text-slate-500 dark:border-slate-800 dark:bg-slate-900/60'}`}>
      <button type="button" onClick={() => onOpen(list)} className="group flex min-w-0 flex-1 items-center gap-4 p-4 text-left active:scale-[0.99]">
        <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl ${active ? 'bg-accent-50' : 'bg-slate-200 grayscale dark:bg-slate-800'}`}>{active ? '🛒' : '✓'}</span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2"><strong className={`truncate text-base ${active ? 'text-ink' : ''}`}>{list.title}</strong><small className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-black uppercase ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500 dark:bg-slate-800'}`}>{statusLabel}</small></span>
          <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-muted"><span>{date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span><span>{itemCount} produit{itemCount !== 1 ? 's' : ''}</span><span>{boughtCount}/{itemCount} acheté{boughtCount !== 1 ? 's' : ''}</span></span>
          <span className={`mt-2 block text-sm font-extrabold ${active ? 'text-accent-700' : 'text-slate-500'}`}>{active ? 'Estimation' : 'Total'} · {amount.toFixed(2)} DH</span>
        </span>
        <ChevronRight className="shrink-0 text-muted transition group-hover:translate-x-1" size={21} />
      </button>
      <button type="button" onClick={() => onDelete(list)} className="my-3 mr-3 grid min-h-11 w-11 shrink-0 place-items-center self-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950" aria-label={`Supprimer la liste ${list.title}`} title="Supprimer la liste"><Trash2 size={18} /></button>
    </article>
  )
}

function ArchivedListDetail({ list, onBack }) {
  const summary = list.summary || {}
  const completedDate = list.completedAt?.toDate?.() || list.plannedFor?.toDate?.()
  const archivedItems = summary.items || []

  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-32 pt-6 text-ink sm:px-6">
      <button type="button" onClick={onBack} className="mb-4 flex min-h-11 items-center gap-2 rounded-xl pr-4 text-sm font-extrabold text-muted hover:text-ink"><ArrowLeft size={20} />Toutes les courses</button>
      <AppHeader title={list.title} subtitle="Course terminée et archivée" />
      <section className="rounded-[1.75rem] bg-slate-900 p-5 text-white shadow-card">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-white/60">Total payé</p><p className="mt-2 text-3xl font-black">{Number(summary.total || 0).toFixed(2)} <span className="text-base text-white/65">DH</span></p></div><span className="grid h-12 w-12 place-items-center rounded-xl bg-white/10 text-2xl">✓</span></div>
        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center"><ArchiveMetric label="Produits" value={summary.itemCount || 0} /><ArchiveMetric label="Achetés" value={summary.boughtCount || 0} /><ArchiveMetric label="Reportés" value={summary.remainingCount || 0} /></div>
      </section>
      <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold text-muted">{completedDate && <span className="flex items-center gap-2 rounded-full bg-surface px-3 py-2 shadow-sm"><CalendarDays size={16} />{completedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}{summary.stores?.map((store) => <span key={store} className="rounded-full bg-surface px-3 py-2 shadow-sm">{store}</span>)}</div>
      <section className="mt-7"><h2 className="font-extrabold">Contenu de la course</h2><div className="mt-3 space-y-3">{archivedItems.length ? archivedItems.map((item, index) => <article key={`${item.productId}-${index}`} className={`flex items-center gap-3 rounded-2xl p-4 ${item.bought ? 'bg-surface shadow-sm' : 'border border-dashed border-slate-300 bg-canvas text-muted dark:border-slate-700'}`}><span className="grid h-11 w-11 place-items-center rounded-xl bg-canvas text-2xl">{catalogById[item.productId]?.emoji || item.emoji || '🛒'}</span><div className="min-w-0 flex-1"><strong className="block truncate">{item.name}</strong><small className="text-muted">{item.quantity} {item.unit}{item.brand ? ` · ${item.brand}` : ''}</small></div><strong className="whitespace-nowrap text-sm">{item.bought ? Number(item.paidPrice || 0).toFixed(2) + ' DH' : 'Reporté'}</strong></article>) : <p className="rounded-2xl bg-surface p-6 text-center text-sm text-muted">Aucun détail disponible pour cette ancienne course.</p>}</div></section>
    </main>
  )
}

function ArchiveMetric({ label, value }) {
  return <div><strong className="block text-xl">{value}</strong><span className="text-[10px] font-bold uppercase text-white/55">{label}</span></div>
}

function ListSkeleton() {
  return <div className="h-28 animate-pulse rounded-[1.4rem] bg-slate-200 dark:bg-slate-800" />
}

function DeleteListDialog({ list, itemCount, deleting, onCancel, onConfirm }) {
  const isArchived = list.status === 'completed'

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-5" role="dialog" aria-modal="true" aria-labelledby="delete-list-title">
      <button type="button" onClick={onCancel} className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]" aria-label="Annuler" />
      <section className="relative w-full max-w-sm rounded-[1.75rem] bg-surface p-6 text-center shadow-2xl">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950"><Trash2 size={25} /></span>
        <h2 id="delete-list-title" className="mt-5 text-xl font-extrabold">Supprimer « {list.title} » ?</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          {isArchived
            ? `Le résumé archivé de cette course (${itemCount} produits) sera supprimé. Les achats réels resteront dans l’historique et le budget.`
            : `Cette liste et ses ${itemCount} produit${itemCount !== 1 ? 's' : ''} seront supprimés. L’historique des achats déjà payés sera conservé.`}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" onClick={onCancel} disabled={deleting} className="min-h-12 rounded-xl bg-canvas font-extrabold text-ink">Annuler</button>
          <button type="button" onClick={onConfirm} disabled={deleting} className="min-h-12 rounded-xl bg-red-600 font-extrabold text-white disabled:opacity-60">{deleting ? 'Suppression…' : 'Supprimer'}</button>
        </div>
      </section>
    </div>
  )
}
