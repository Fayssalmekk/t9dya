import { Check, PackagePlus, Plus, Search, Settings2, SlidersHorizontal, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import CreateCustomProductSheet from '../components/CreateCustomProductSheet'
import { useAuth } from '../context/AuthContext'
import { usePlatform } from '../context/PlatformContext'
import { useShopping } from '../context/ShoppingContext'
import { brands, catalog, categories } from '../data/catalog'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { addShoppingItem, DEFAULT_LIST_ID } from '../services/shopping'
import { matchesProductSearch, productSearchScore } from '../utils/catalogSearch'

export default function CatalogPage() {
  const { user, household } = useAuth()
  const { notify, openProduct } = usePlatform()
  const { activeItems, activeList, customProducts } = useShopping()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(() => searchParams.get('name') || '')
  const [category, setCategory] = useState('all')
  const [brand, setBrand] = useState('all')
  const [showAll, setShowAll] = useState(false)
  const [addingId, setAddingId] = useState('')
  const [showCustomProduct, setShowCustomProduct] = useState(() => searchParams.get('create') === '1')
  const debouncedSearch = useDebouncedValue(search)
  const allProducts = useMemo(() => [...customProducts, ...catalog], [customProducts])
  const allBrands = useMemo(() => [...new Set([...brands, ...customProducts.map((product) => product.brand).filter(Boolean)])].sort((first, second) => first.localeCompare(second, 'fr')), [customProducts])

  const filteredProducts = useMemo(() => allProducts
    .filter((product) => (category === 'all' || product.category === category)
      && (brand === 'all' || product.brand === brand)
      && matchesProductSearch(product, debouncedSearch))
    .sort((first, second) => productSearchScore(second, debouncedSearch) - productSearchScore(first, debouncedSearch)), [allProducts, brand, category, debouncedSearch])

  const visibleProducts = showAll ? filteredProducts : filteredProducts.slice(0, 60)
  const activeByProduct = useMemo(() => new Map(activeItems.map((item) => [item.productId, item])), [activeItems])

  const changeSearch = (value) => {
    setSearch(value)
    setShowAll(false)
  }

  const changeCategory = (value) => {
    setCategory(value)
    setShowAll(false)
  }

  const quickAdd = async (product) => {
    if (addingId) return
    setAddingId(product.id)
    const duplicate = activeByProduct.get(product.id)
    try {
      const result = await addShoppingItem(household.id, activeList?.id || DEFAULT_LIST_ID, product, user, { quantity: 1, unit: product.unit || 'pièce', note: '' }, duplicate)
      navigator.vibrate?.(20)
      notify(result.merged ? `${product.name} · quantité +1` : `${product.name} ajouté à la liste`)
    } catch {
      notify('Impossible d’ajouter ce produit')
    } finally {
      setAddingId('')
    }
  }

  const closeCreator = () => {
    setShowCustomProduct(false)
    if (searchParams.get('create')) setSearchParams({}, { replace: true })
  }

  const useCreatedProduct = (product) => {
    closeCreator()
    setSearch('')
    setCategory('all')
    setBrand('all')
    openProduct(product)
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-28 pt-6 sm:px-6">
      <AppHeader title="Catalogue rapide" subtitle="Touchez + pour ajouter immédiatement" />

      <div className="sticky top-0 z-10 -mx-1 bg-canvas/95 px-1 pb-3 pt-1 backdrop-blur-xl">
        <label className="flex min-h-14 items-center gap-3 rounded-2xl bg-surface px-4 shadow-card">
          <Search className="shrink-0 text-muted" size={21} aria-hidden="true" />
          <input value={search} onChange={(event) => changeSearch(event.target.value)} placeholder="Tomate, maticha, tomato…" className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-slate-400" aria-label="Rechercher un produit en français, Darija ou anglais" />
          {search && <button type="button" onClick={() => changeSearch('')} className="grid h-10 w-10 place-items-center rounded-xl text-muted" aria-label="Effacer"><X size={18} /></button>}
        </label>
      </div>

      <button type="button" onClick={() => setShowCustomProduct(true)} className="flex min-h-12 w-full items-center gap-3 rounded-2xl border border-dashed border-accent-400 bg-accent-50 px-4 text-left text-accent-800 transition active:scale-[0.99] dark:bg-accent-950 dark:text-accent-200">
        <PackagePlus size={20} className="shrink-0" /><span className="min-w-0 flex-1"><strong className="block text-sm">Personnaliser le catalogue</strong><small className="block truncate text-xs text-muted">Créer un produit absent ou une marque précise</small></span><Plus size={20} />
      </button>

      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 py-2 sm:-mx-6 sm:px-6" aria-label="Catégories">
        <button type="button" onClick={() => changeCategory('all')} className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-bold transition ${category === 'all' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-surface text-muted shadow-sm'}`}><SlidersHorizontal className="mr-2 inline" size={16} />Tout</button>
        {categories.map((item) => <button key={item.id} type="button" onClick={() => changeCategory(item.id)} className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-bold transition ${category === item.id ? 'bg-accent-600 text-white' : 'bg-surface text-muted shadow-sm'}`}><span className="mr-2">{item.emoji}</span>{item.name}</button>)}
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-muted"><strong className="text-ink">{filteredProducts.length}</strong> produit{filteredProducts.length !== 1 ? 's' : ''}</p>
        <select value={brand} onChange={(event) => { setBrand(event.target.value); setShowAll(false) }} className="min-h-11 max-w-44 rounded-xl border-0 bg-surface px-3 text-sm font-bold shadow-sm" aria-label="Filtrer par marque"><option value="all">Toutes marques</option>{allBrands.map((value) => <option key={value}>{value}</option>)}</select>
      </div>

      <div className="mt-4 space-y-2">
        {visibleProducts.map((product) => {
          const activeItem = activeByProduct.get(product.id)
          const isAdding = addingId === product.id
          return (
            <article key={product.id} className="flex min-h-20 items-center gap-3 rounded-2xl border border-slate-200 bg-surface p-3 shadow-sm dark:border-slate-800">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-canvas text-2xl">{product.emoji}</span>
              <button type="button" onClick={() => openProduct(product)} className="min-w-0 flex-1 text-left">
                <span className="flex items-center gap-2"><strong className="truncate text-sm">{product.name}</strong>{product.isCustom && <span className="shrink-0 rounded-full bg-accent-100 px-2 py-0.5 text-[9px] font-black text-accent-700">PERSO</span>}</span>
                <small className="mt-1 block truncate text-muted" dir="auto">{[product.altName, product.brand, product.format].filter(Boolean).join(' · ') || product.categoryName}</small>
                {activeItem && <small className="mt-1 flex items-center gap-1 font-extrabold text-emerald-600"><Check size={13} />Dans la liste · {activeItem.quantity} {activeItem.unit}</small>}
              </button>
              <button type="button" onClick={() => openProduct(product)} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-muted hover:bg-canvas" aria-label={`Choisir quantité et note pour ${product.name}`}><Settings2 size={18} /></button>
              <button type="button" disabled={Boolean(addingId)} onClick={() => quickAdd(product)} className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl text-white transition active:scale-90 disabled:opacity-50 ${activeItem ? 'bg-emerald-600' : 'bg-accent-600'}`} aria-label={activeItem ? `Ajouter encore ${product.name}` : `Ajouter ${product.name}`}><Plus className={isAdding ? 'animate-pulse' : ''} size={23} strokeWidth={3} /></button>
            </article>
          )
        })}
      </div>

      {!showAll && filteredProducts.length > visibleProducts.length && <button type="button" onClick={() => setShowAll(true)} className="mt-4 min-h-12 w-full rounded-2xl bg-surface text-sm font-extrabold shadow-sm">Afficher les {filteredProducts.length - visibleProducts.length} autres produits</button>}

      {filteredProducts.length === 0 && (
        <section className="mt-6 rounded-[1.75rem] bg-surface p-8 text-center shadow-card"><span className="text-5xl">🔎</span><h2 className="mt-4 text-lg font-extrabold">Produit introuvable</h2><p className="mt-2 text-sm leading-6 text-muted">Créez-le une fois : il restera disponible pour vous deux.</p><button type="button" onClick={() => setShowCustomProduct(true)} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-accent-600 px-5 font-bold text-white"><PackagePlus size={18} />Créer {search.trim() ? `« ${search.trim()} »` : 'un produit'}</button></section>
      )}

      {showCustomProduct && <CreateCustomProductSheet initialName={search.trim()} existingProducts={allProducts} willAddToList onClose={closeCreator} onCreated={useCreatedProduct} />}
    </main>
  )
}
