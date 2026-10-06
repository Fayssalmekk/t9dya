import { Download, Filter, ReceiptText, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import AppHeader from '../components/AppHeader'
import { useAuth } from '../context/AuthContext'
import { useShopping } from '../context/ShoppingContext'
import { catalogById } from '../data/catalog'
import { matchesProductSearch } from '../utils/catalogSearch'

export default function HistoryPage() {
  const { household } = useAuth()
  const { purchases, purchasesLoading, lists } = useShopping()
  const [search, setSearch] = useState('')
  const [store, setStore] = useState('all')
  const [buyer, setBuyer] = useState('all')
  const stores = [...new Set(purchases.map((purchase) => purchase.store).filter(Boolean))]

  const filtered = useMemo(() => purchases.filter((purchase) => {
    const catalogProduct = catalogById[purchase.productId]
    const matchesSearch = matchesProductSearch(catalogProduct || {
      name: purchase.itemName,
      category: purchase.category,
      categoryName: purchase.categoryName
    }, search)
    return matchesSearch && (store === 'all' || purchase.store === store) && (buyer === 'all' || purchase.boughtBy === buyer)
  }), [buyer, purchases, search, store])

  const exportCsv = () => {
    const header = ['Date', 'Produit', 'Catégorie', 'Quantité', 'Unité', 'Prix MAD', 'Magasin', 'Acheté par', 'Note']
    const lines = filtered.map((purchase) => {
      const member = household.memberProfiles?.[purchase.boughtBy]
      const values = [purchase.purchasedAt?.toDate?.().toLocaleDateString('fr-FR') || '', purchase.itemName, purchase.categoryName, purchase.quantity, purchase.unit, purchase.price ?? '', purchase.store, member?.displayName || '', purchase.note || '']
      return values.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')
    })
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `t9dya-achats-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const total = filtered.reduce((sum, purchase) => sum + (Number.isFinite(purchase.price) ? purchase.price : 0), 0)
  const completedLists = lists.filter((list) => list.status === 'completed')

  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-28 pt-6 sm:px-6">
      <AppHeader title="Historique" subtitle={`${purchases.length} achats enregistrés`} />
      <section className="rounded-[1.75rem] bg-slate-900 p-5 text-white shadow-card dark:bg-accent-700"><p className="text-xs font-bold uppercase tracking-wider text-white/60">Total des résultats</p><div className="mt-2 flex items-end justify-between"><p className="text-3xl font-black">{total.toFixed(2)} <span className="text-base text-white/70">DH</span></p><button type="button" onClick={exportCsv} disabled={!filtered.length} className="flex min-h-11 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-bold disabled:opacity-40"><Download size={17} />CSV</button></div></section>

      {completedLists.length > 0 && <section className="mt-5"><h2 className="font-extrabold">Courses terminées</h2><div className="no-scrollbar -mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-2">{completedLists.map((list) => <article key={list.id} className="w-64 shrink-0 rounded-2xl bg-surface p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><span className="text-2xl">🧾</span><strong className="text-accent-700">{Number(list.summary?.total || 0).toFixed(2)} DH</strong></div><h3 className="mt-3 truncate font-extrabold">{list.title}</h3><p className="mt-1 text-xs text-muted">{list.completedAt?.toDate?.().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p><div className="mt-3 flex gap-3 text-xs font-semibold text-muted"><span>{list.summary?.boughtCount || 0} achetés</span><span>{list.summary?.remainingCount || 0} reportés</span></div></article>)}</div></section>}

      <div className="mt-4 rounded-2xl bg-surface p-3 shadow-sm">
        <label className="flex min-h-12 items-center gap-3 rounded-xl bg-canvas px-3"><Search size={19} className="text-muted" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un achat…" className="min-w-0 flex-1 bg-transparent outline-none" /></label>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="relative"><Filter className="pointer-events-none absolute left-3 top-3.5 text-muted" size={16} /><select value={store} onChange={(event) => setStore(event.target.value)} className="min-h-11 w-full rounded-xl bg-canvas pl-9 pr-2 text-sm font-semibold"><option value="all">Tous magasins</option>{stores.map((value) => <option key={value}>{value}</option>)}</select></label>
          <select value={buyer} onChange={(event) => setBuyer(event.target.value)} className="min-h-11 rounded-xl bg-canvas px-3 text-sm font-semibold"><option value="all">Nous deux</option>{Object.values(household.memberProfiles || {}).map((member) => <option key={member.uid} value={member.uid}>{member.displayName}</option>)}</select>
        </div>
      </div>

      {purchasesLoading ? <div className="mt-5 h-20 animate-pulse rounded-2xl bg-slate-200" /> : filtered.length === 0 ? <section className="mt-6 rounded-[1.75rem] bg-surface p-8 text-center shadow-card"><ReceiptText className="mx-auto text-accent-600" size={46} /><h2 className="mt-4 text-lg font-extrabold">Aucun achat trouvé</h2><p className="mt-2 text-sm text-muted">Marquez des produits comme achetés depuis votre liste.</p></section> : <div className="mt-5 space-y-3">{filtered.map((purchase) => {
        const member = household.memberProfiles?.[purchase.boughtBy]
        const date = purchase.purchasedAt?.toDate?.()
        const emoji = catalogById[purchase.productId]?.emoji || purchase.emoji || '🛒'
        const purchaseDetails = [date?.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }), purchase.store, member?.displayName || 'Membre'].filter(Boolean).join(' · ')
        return <article key={purchase.id} className="flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm"><span className="grid h-12 w-12 place-items-center rounded-xl bg-canvas text-2xl">{emoji}</span><div className="min-w-0 flex-1"><strong className="block truncate">{purchase.itemName}</strong><p className="mt-1 truncate text-xs text-muted">{purchaseDetails}</p></div><div className="text-right"><strong className="whitespace-nowrap">{Number.isFinite(purchase.price) ? `${purchase.price.toFixed(2)} DH` : '—'}</strong><small className="mt-1 block text-muted">{purchase.quantity} {purchase.unit}</small></div></article>
      })}</div>}
    </main>
  )
}
