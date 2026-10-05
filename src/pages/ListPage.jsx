import { Clock3, Search, Send, Share2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import AppHeader from '../components/AppHeader'
import BoughtPriceSheet from '../components/BoughtPriceSheet'
import ShoppingItem from '../components/ShoppingItem'
import SmartListAdd from '../components/SmartListAdd'
import { useAuth } from '../context/AuthContext'
import { usePlatform } from '../context/PlatformContext'
import { useShopping } from '../context/ShoppingContext'
import { markItemBought, removeShoppingItem, requestShoppingRun, restoreShoppingItem, startShoppingRun, unmarkItemBought } from '../services/shopping'

const normalizeName = (value) => String(value || '').trim().toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export default function ListPage() {
  const { user, household } = useAuth()
  const { items, activeList, incomingRequest, loading, error } = useShopping()
  const { notify } = usePlatform()
  const [buyingId, setBuyingId] = useState('')
  const [buyingItem, setBuyingItem] = useState(null)
  const [filter, setFilter] = useState('todo')
  const [search, setSearch] = useState('')

  const activeItems = useMemo(() => items.filter((item) => !item.bought), [items])
  const boughtItems = useMemo(() => items.filter((item) => item.bought), [items])
  const partnerId = household.members.find((memberId) => memberId !== user.uid)
  const partner = household.memberProfiles?.[partnerId]
  const requestSent = activeList?.assignedTo === partnerId && activeList?.status === 'requested'
  const estimatedTotal = activeItems.reduce((sum, item) => sum + Number(item.estimatedPrice || 0) * Number(item.quantity || 1), 0)
  const progress = items.length ? Math.round((boughtItems.length / items.length) * 100) : 0

  const visibleItems = useMemo(() => {
    const needle = normalizeName(search)
    return items.filter((item) => {
      if (filter === 'todo' && item.bought) return false
      if (filter === 'bought' && !item.bought) return false
      return !needle || normalizeName(`${item.name} ${item.note || ''}`).includes(needle)
    })
  }, [filter, items, search])

  const quickBuy = async (item) => {
    if (buyingId) return
    setBuyingId(item.id)
    const store = household.lastUsedStore || ''
    try {
      const purchaseId = await markItemBought(household.id, item, user.uid, { skipPrice: true, price: 0, store, note: '' })
      navigator.vibrate?.(25)
      notify(`${item.name} acheté`, {
        label: 'Annuler',
        onClick: () => unmarkItemBought(household.id, { ...item, purchaseId, paidPrice: null, store })
      })
    } catch {
      notify('Impossible d’enregistrer cet achat')
    } finally {
      setBuyingId('')
    }
  }

  const unmarkBought = async (item) => {
    await unmarkItemBought(household.id, item)
    notify(`${item.name} remis dans la liste`)
  }

  const deleteItem = async (item) => {
    await removeShoppingItem(household.id, item.id)
    notify(`${item.name} supprimé`, { label: 'Annuler', onClick: () => restoreShoppingItem(household.id, item) })
  }

  const shareList = async () => {
    const lines = activeItems.map((item) => `☐ ${item.name}${Number(item.quantity) !== 1 || item.unit !== 'pièce' ? ` · ${item.quantity} ${item.unit}` : ''}`)
    const text = [`Liste T9dya · ${household.name}`, '', ...lines].join('\n')
    try {
      if (navigator.share) await navigator.share({ title: `Liste T9dya · ${household.name}`, text })
      else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
    } catch {
      // Closing the native share sheet is a normal user action.
    }
  }

  const sendToPartner = async () => {
    if (!partnerId) return
    await requestShoppingRun(household.id, activeList.id, user.uid, partnerId)
    notify(`Liste envoyée à ${partner?.displayName || 'votre partenaire'}`)
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-32 pt-6 sm:px-6">
      <AppHeader title="Liste de courses" subtitle="Une seule liste partagée, toujours à jour" />

      {incomingRequest && (
        <button type="button" onClick={() => startShoppingRun(household.id, incomingRequest.id, user.uid)} className="mb-4 flex min-h-16 w-full items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-left text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-400 text-xl">🛒</span>
          <span className="min-w-0 flex-1"><strong className="block">{household.memberProfiles?.[incomingRequest.requestedBy]?.displayName || 'Votre partenaire'} vous demande les courses</strong><small className="mt-0.5 block">Touchez ici pour commencer.</small></span>
        </button>
      )}

      <SmartListAdd />

      <section className="mt-4 rounded-2xl bg-slate-900 p-4 text-white shadow-card dark:bg-accent-800">
        <div className="flex items-center justify-between gap-4"><div><strong className="text-2xl tabular-nums">{activeItems.length}</strong><span className="ml-2 text-sm text-white/65">à acheter</span></div><div className="text-right"><strong className="text-lg tabular-nums">{boughtItems.length}</strong><span className="ml-2 text-xs text-white/60">achetés</span></div></div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-emerald-300 transition-all" style={{ width: `${progress}%` }} /></div>
        {estimatedTotal > 0 && <p className="mt-3 text-xs font-semibold text-white/65">Estimation restante · <strong className="text-white">{estimatedTotal.toFixed(2)} DH</strong></p>}
      </section>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={shareList} disabled={!activeItems.length} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-surface text-sm font-extrabold shadow-sm disabled:opacity-40"><Share2 size={17} />Partager</button>
        <button type="button" onClick={sendToPartner} disabled={!partnerId || !activeItems.length || requestSent} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-surface px-2 text-sm font-extrabold shadow-sm disabled:opacity-50"><Send size={17} />{requestSent ? 'Demande envoyée ✓' : partner?.displayName ? `Envoyer à ${partner.displayName}` : 'Au partenaire'}</button>
      </div>

      <section className="mt-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {[['todo', `À acheter · ${activeItems.length}`], ['bought', `Achetés · ${boughtItems.length}`], ['all', `Tout · ${items.length}`]].map(([value, label]) => <button key={value} type="button" onClick={() => setFilter(value)} className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-extrabold ${filter === value ? 'bg-accent-600 text-white' : 'bg-surface text-muted shadow-sm'}`}>{label}</button>)}
        </div>
        {items.length > 7 && <label className="mt-2 flex min-h-11 items-center gap-2 rounded-xl bg-surface px-3 shadow-sm"><Search size={17} className="text-muted" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Retrouver un article…" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>}
      </section>

      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700 dark:bg-red-950 dark:text-red-200" role="alert">{error}</p>}

      {loading ? (
        <div className="mt-4 space-y-2" aria-label="Chargement"><div className="h-20 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" /><div className="h-20 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" /></div>
      ) : visibleItems.length ? (
        <div className="mt-4 space-y-2">{visibleItems.map((item) => <ShoppingItem key={item.id} item={item} onBuy={quickBuy} onBuyWithDetails={setBuyingItem} onUnbuy={unmarkBought} onDelete={deleteItem} />)}</div>
      ) : items.length === 0 ? (
        <section className="mt-5 rounded-[1.75rem] border border-dashed border-slate-300 p-8 text-center dark:border-slate-700"><span className="text-5xl">📝</span><h2 className="mt-4 text-lg font-extrabold">La liste est prête</h2><p className="mt-2 text-sm leading-6 text-muted">Écrivez un article ci-dessus ou ouvrez le catalogue pour commencer.</p></section>
      ) : (
        <p className="mt-5 rounded-2xl bg-surface p-6 text-center text-sm text-muted shadow-sm">Aucun article dans cette vue.</p>
      )}

      {boughtItems.length > 0 && <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs font-semibold text-muted"><Clock3 size={15} />Les articles achetés quittent la liste après 24 h. Ils restent dans l’historique.</p>}
      {buyingItem && <BoughtPriceSheet item={buyingItem} onClose={() => setBuyingItem(null)} />}
      {buyingId && <span className="sr-only" aria-live="polite">Enregistrement de l’achat…</span>}
    </main>
  )
}
