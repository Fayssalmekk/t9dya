import { Search, SlidersHorizontal, Sparkles, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import AppHeader from '../components/AppHeader'
import { usePlatform } from '../context/PlatformContext'
import { useShopping } from '../context/ShoppingContext'
import { brands, catalog, categories } from '../data/catalog'
import { useDebouncedValue } from '../hooks/useDebouncedValue'

const normalize = (value) => value.toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export default function CatalogPage() {
  const { openProduct } = usePlatform()
  const { activeItems } = useShopping()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [brand, setBrand] = useState('all')
  const debouncedSearch = useDebouncedValue(search)

  const filteredProducts = useMemo(() => {
    const needle = normalize(debouncedSearch.trim())
    return catalog.filter((product) => {
      const matchesCategory = category === 'all' || product.category === category
      const matchesBrand = brand === 'all' || product.brand === brand
      const haystack = normalize(`${product.name} ${product.altName} ${product.categoryName} ${product.brand || ''} ${product.format || ''}`)
      return matchesCategory && matchesBrand && (!needle || haystack.includes(needle))
    })
  }, [brand, category, debouncedSearch])

  const activeProductIds = useMemo(() => new Set(activeItems.map((item) => item.productId)), [activeItems])
  const customName = search.trim()

  const addCustom = () => {
    const slug = normalize(customName).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    openProduct({
      id: `custom-${slug || 'produit'}`,
      name: customName,
      altName: 'Produit personnalisé',
      category: 'epicerie',
      categoryName: 'Autres',
      emoji: '🛒',
      unit: 'pièce',
      defaultPrice: 0
    })
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-28 pt-6 sm:px-6">
      <AppHeader title="Catalogue" subtitle={`${catalog.length} produits marocains prêts à ajouter`} />

      <div className="sticky top-0 z-10 -mx-1 bg-canvas/95 px-1 pb-3 pt-1 backdrop-blur-xl">
        <label className="flex min-h-14 items-center gap-3 rounded-2xl bg-surface px-4 shadow-card">
          <Search className="shrink-0 text-muted" size={21} aria-hidden="true" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tomate, atay, مطيشة…" className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-slate-400" aria-label="Rechercher un produit" />
          {search && <button type="button" onClick={() => setSearch('')} className="grid h-10 w-10 place-items-center rounded-xl text-muted" aria-label="Effacer"><X size={18} /></button>}
        </label>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-3 sm:-mx-6 sm:px-6" aria-label="Catégories">
        <button type="button" onClick={() => setCategory('all')} className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-bold transition ${category === 'all' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-surface text-muted shadow-sm'}`}><SlidersHorizontal className="mr-2 inline" size={16} />Tout</button>
        {categories.map((item) => (
          <button key={item.id} type="button" onClick={() => setCategory(item.id)} className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-bold transition ${category === item.id ? 'bg-accent-600 text-white' : 'bg-surface text-muted shadow-sm'}`}>
            <span className="mr-2">{item.emoji}</span>{item.name}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <h2 className="font-extrabold">{category === 'all' ? 'Tous les produits' : categories.find((item) => item.id === category)?.name}</h2>
        <select value={brand} onChange={(event) => setBrand(event.target.value)} className="min-h-11 max-w-40 rounded-xl border-0 bg-surface px-3 text-sm font-bold shadow-sm" aria-label="Filtrer par marque"><option value="all">Toutes marques</option>{brands.map((value) => <option key={value}>{value}</option>)}</select>
      </div>
      <p className="mt-2 text-sm font-semibold text-muted">{filteredProducts.length} résultats</p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {filteredProducts.map((product) => {
          const alreadyAdded = activeProductIds.has(product.id)
          return (
            <button key={product.id} type="button" onClick={() => openProduct(product)} className="group relative min-h-44 rounded-2xl bg-surface p-4 text-left shadow-card transition hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]">
              {alreadyAdded && <span className="absolute right-3 top-3 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-extrabold text-emerald-700">DANS LA LISTE</span>}
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-canvas text-3xl transition group-hover:scale-110">{product.emoji}</span>
              {product.brand && <span className="mt-3 inline-block rounded-md bg-slate-900 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white dark:bg-white dark:text-slate-900">{product.brand}</span>}
              <strong className={`${product.brand ? 'mt-2' : 'mt-4'} block leading-tight`}>{product.name}</strong>
              <small className="mt-1 block truncate text-muted" dir="auto">{product.altName}</small>
              {product.format && <small className="mt-1 block truncate font-semibold text-muted">{product.format}</small>}
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="font-medium text-muted">/{product.unit}</span>
                <span className="font-extrabold text-accent-700">≈ {product.defaultPrice} DH</span>
              </div>
            </button>
          )
        })}
      </div>

      {filteredProducts.length === 0 && (
        <section className="mt-6 rounded-card bg-surface p-8 text-center shadow-card">
          <span className="text-5xl">🔎</span>
          <h2 className="mt-4 text-lg font-extrabold">Aucun produit trouvé</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Ajoutez-le comme produit personnalisé; il restera dans votre liste partagée.</p>
          {customName && <button type="button" onClick={addCustom} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-accent-600 px-5 font-bold text-white"><Sparkles size={18} />Ajouter « {customName} »</button>}
        </section>
      )}
    </main>
  )
}
