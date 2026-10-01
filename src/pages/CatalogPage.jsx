import { PackagePlus, Search, SlidersHorizontal, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import AppHeader from '../components/AppHeader'
import CreateCustomProductSheet from '../components/CreateCustomProductSheet'
import { usePlatform } from '../context/PlatformContext'
import { useShopping } from '../context/ShoppingContext'
import { brands, catalog, categories } from '../data/catalog'
import { useDebouncedValue } from '../hooks/useDebouncedValue'

const normalize = (value) => value.toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export default function CatalogPage() {
  const { notify, openProduct } = usePlatform()
  const { activeItems, activeList, customProducts } = useShopping()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [brand, setBrand] = useState('all')
  const [showCustomProduct, setShowCustomProduct] = useState(false)
  const debouncedSearch = useDebouncedValue(search)
  const allProducts = useMemo(() => [...customProducts, ...catalog], [customProducts])
  const allBrands = useMemo(() => (
    [...new Set([...brands, ...customProducts.map((product) => product.brand).filter(Boolean)])]
      .sort((first, second) => first.localeCompare(second, 'fr'))
  ), [customProducts])

  const filteredProducts = useMemo(() => {
    const needle = normalize(debouncedSearch.trim())
    return allProducts.filter((product) => {
      const matchesCategory = category === 'all' || product.category === category
      const matchesBrand = brand === 'all' || product.brand === brand
      const haystack = normalize(`${product.name} ${product.altName} ${product.categoryName} ${product.brand || ''} ${product.format || ''}`)
      return matchesCategory && matchesBrand && (!needle || haystack.includes(needle))
    })
  }, [allProducts, brand, category, debouncedSearch])

  const activeProductIds = useMemo(() => new Set(activeItems.map((item) => item.productId)), [activeItems])
  const openCreator = () => setShowCustomProduct(true)
  const useCreatedProduct = (product) => {
    setShowCustomProduct(false)
    setSearch('')
    setCategory('all')
    setBrand('all')
    if (activeList) {
      openProduct(product)
    } else {
      notify(`${product.name} enregistré dans votre catalogue`)
    }
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-28 pt-6 sm:px-6">
      <AppHeader title="Catalogue" subtitle={`${allProducts.length} produits prêts à ajouter`} />

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

      <button type="button" onClick={openCreator} className="mt-1 flex min-h-16 w-full items-center gap-3 rounded-2xl border border-dashed border-accent-400 bg-accent-50 px-4 text-left transition hover:border-accent-600 hover:bg-accent-100 active:scale-[0.99] dark:bg-accent-950/30">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-600 text-white"><PackagePlus size={21} /></span>
        <span className="min-w-0 flex-1"><strong className="block text-sm text-accent-800 dark:text-accent-200">Produit introuvable ? Créez-le</strong><small className="mt-0.5 block text-xs text-muted">Choisissez sa catégorie, sa marque, son prix et son icône</small></span>
        <span className="text-xl font-bold text-accent-600" aria-hidden="true">+</span>
      </button>

      <div className="mt-3 flex items-center justify-between gap-3">
        <h2 className="font-extrabold">{category === 'all' ? 'Tous les produits' : categories.find((item) => item.id === category)?.name}</h2>
        <select value={brand} onChange={(event) => setBrand(event.target.value)} className="min-h-11 max-w-40 rounded-xl border-0 bg-surface px-3 text-sm font-bold shadow-sm" aria-label="Filtrer par marque"><option value="all">Toutes marques</option>{allBrands.map((value) => <option key={value}>{value}</option>)}</select>
      </div>
      <p className="mt-2 text-sm font-semibold text-muted">{filteredProducts.length} résultats</p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {filteredProducts.map((product) => {
          const alreadyAdded = activeProductIds.has(product.id)
          return (
            <button key={product.id} type="button" onClick={() => openProduct(product)} className="group relative min-h-44 rounded-2xl bg-surface p-4 text-left shadow-card transition hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]">
              {alreadyAdded && <span className="absolute right-3 top-3 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-extrabold text-emerald-700">DANS LA LISTE</span>}
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-canvas text-3xl transition group-hover:scale-110">{product.emoji}</span>
              {product.isCustom && <span className="mt-3 inline-block rounded-md bg-accent-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-accent-800 dark:bg-accent-950 dark:text-accent-200">VOTRE PRODUIT</span>}
              {product.brand && <span className="mt-3 inline-block rounded-md bg-slate-900 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white dark:bg-white dark:text-slate-900">{product.brand}</span>}
              <strong className={`${product.brand || product.isCustom ? 'mt-2' : 'mt-4'} block leading-tight`}>{product.name}</strong>
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
          <p className="mt-2 text-sm leading-6 text-muted">Créez votre propre fiche : elle restera dans le catalogue partagé de votre foyer.</p>
          <button type="button" onClick={openCreator} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-accent-600 px-5 font-bold text-white"><PackagePlus size={18} />Créer {search.trim() ? `« ${search.trim()} »` : 'un produit'}</button>
        </section>
      )}

      {showCustomProduct && <CreateCustomProductSheet initialName={search.trim()} existingProducts={allProducts} willAddToList={Boolean(activeList)} onClose={() => setShowCustomProduct(false)} onCreated={useCreatedProduct} />}
    </main>
  )
}
