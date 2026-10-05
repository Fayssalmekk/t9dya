import { Check, ListPlus, PackagePlus, Plus, Search, Settings2, ShoppingCart, X } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePlatform } from '../context/PlatformContext'
import { useShopping } from '../context/ShoppingContext'
import { catalog } from '../data/catalog'
import { addQuickTextItem, addShoppingItem, DEFAULT_LIST_ID } from '../services/shopping'
import { matchesProductSearch, normalizeCatalogSearch, productSearchScore } from '../utils/catalogSearch'

const MAX_RESULTS = 6

export default function SmartListAdd() {
  const { user, household } = useAuth()
  const { activeItems, activeList, customProducts, purchases } = useShopping()
  const { notify, openProduct } = usePlatform()
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [addingKey, setAddingKey] = useState('')

  const cleanQuery = query.trim().replace(/\s+/g, ' ')
  const allProducts = useMemo(() => [...customProducts, ...catalog], [customProducts])
  const activeByProduct = useMemo(() => new Map(activeItems.map((item) => [item.productId, item])), [activeItems])
  const purchaseCount = useMemo(() => purchases.reduce((counts, purchase) => {
    if (purchase.productId) counts.set(purchase.productId, (counts.get(purchase.productId) || 0) + 1)
    return counts
  }, new Map()), [purchases])

  const results = useMemo(() => {
    if (!cleanQuery) return []
    return allProducts
      .filter((product) => matchesProductSearch(product, cleanQuery))
      .sort((first, second) => {
        const searchDifference = productSearchScore(second, cleanQuery) - productSearchScore(first, cleanQuery)
        if (searchDifference) return searchDifference
        const historyDifference = (purchaseCount.get(second.id) || 0) - (purchaseCount.get(first.id) || 0)
        if (historyDifference) return historyDifference
        return first.name.localeCompare(second.name, 'fr')
      })
      .slice(0, MAX_RESULTS)
  }, [allProducts, cleanQuery, purchaseCount])

  const clearAndKeepTyping = () => {
    setQuery('')
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const addText = async () => {
    const name = cleanQuery.slice(0, 100)
    if (!name || addingKey) return
    setAddingKey('text')
    const duplicate = activeItems.find((item) => normalizeCatalogSearch(item.name) === normalizeCatalogSearch(name))
    try {
      const result = await addQuickTextItem(household.id, user, name, duplicate)
      navigator.vibrate?.(20)
      clearAndKeepTyping()
      notify(result.merged ? `${name} est déjà dans la liste · quantité +1` : `${name} ajouté comme texte`)
    } catch {
      notify('Impossible d’ajouter cet article pour le moment')
    } finally {
      setAddingKey('')
    }
  }

  const quickAdd = async (product) => {
    if (addingKey) return
    setAddingKey(product.id)
    const duplicate = activeByProduct.get(product.id)
    try {
      const result = await addShoppingItem(
        household.id,
        activeList?.id || DEFAULT_LIST_ID,
        product,
        user,
        { quantity: 1, unit: product.unit || 'pièce', note: '' },
        duplicate
      )
      navigator.vibrate?.(20)
      clearAndKeepTyping()
      notify(result.merged ? `${product.name} · quantité +1` : `${product.name} ajouté à la liste`)
    } catch {
      notify('Impossible d’ajouter ce produit')
    } finally {
      setAddingKey('')
    }
  }

  const customize = (product) => {
    setQuery('')
    openProduct(product)
  }

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) return
    event.preventDefault()
    if (results[0]) quickAdd(results[0])
    else addText()
  }

  return (
    <section className="rounded-[1.75rem] bg-surface p-4 shadow-card">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-100 text-accent-700"><Search size={19} /></span>
        <div className="min-w-0"><h2 className="font-extrabold">Ajouter à la liste</h2><p className="text-xs text-muted">Recherchez, puis ajoutez en un geste.</p></div>
      </div>

      <label className={`mt-4 flex min-h-14 items-center gap-3 rounded-2xl border bg-canvas px-4 transition ${cleanQuery ? 'border-accent-500 ring-4 ring-accent-100/60 dark:ring-accent-950/50' : 'border-transparent'}`}>
        <Search size={20} className="shrink-0 text-muted" />
        <span className="sr-only">Rechercher ou écrire un article</span>
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={100}
          enterKeyHint="done"
          autoComplete="off"
          placeholder="Tomate, maticha, lait, savon…"
          className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-slate-400"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={cleanQuery ? 'smart-product-results' : undefined}
          aria-expanded={Boolean(cleanQuery)}
        />
        {query && <button type="button" onClick={() => setQuery('')} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-surface" aria-label="Effacer la recherche"><X size={18} /></button>}
      </label>

      {cleanQuery && (
        <div id="smart-product-results" className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-surface shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:shadow-black/30">
          {results.length > 0 ? (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-muted">Suggestions intelligentes</span>
                <span className="text-[11px] font-bold text-accent-700">Touchez pour ajuster</span>
              </div>
              <div className="max-h-[min(25rem,48dvh)] overflow-y-auto overscroll-contain p-1.5">
                {results.map((product, index) => {
                  const activeItem = activeByProduct.get(product.id)
                  const isAdding = addingKey === product.id
                  return (
                    <div key={product.id} className={`group flex min-h-16 items-center gap-2 rounded-xl px-2 py-1.5 transition ${index === 0 ? 'bg-accent-50/80 dark:bg-accent-950/35' : 'hover:bg-canvas'}`}>
                      <button type="button" onClick={() => customize(product)} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left" aria-label={`Personnaliser ${product.name}`}>
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-canvas text-2xl shadow-sm">{product.emoji || '🛒'}</span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2"><strong className="truncate text-sm">{product.name}</strong>{product.isCustom && <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[8px] font-black text-violet-700 dark:bg-violet-950 dark:text-violet-200">PERSO</span>}</span>
                          <span className="mt-0.5 block truncate text-[11px] text-muted" dir="auto">{[product.altName, product.brand, product.format].filter(Boolean).join(' · ') || `${product.categoryName} · ${product.unit}`}</span>
                          {activeItem && <span className="mt-1 flex items-center gap-1 text-[10px] font-extrabold text-emerald-600"><Check size={11} strokeWidth={3} />Déjà dans la liste · {activeItem.quantity} {activeItem.unit}</span>}
                        </span>
                        <Settings2 size={16} className="shrink-0 text-slate-400" />
                      </button>
                      <button type="button" onClick={() => quickAdd(product)} disabled={Boolean(addingKey)} className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white shadow-sm transition active:scale-90 disabled:opacity-50 ${activeItem ? 'bg-emerald-600' : 'bg-accent-600'}`} aria-label={activeItem ? `Ajouter encore ${product.name}` : `Ajouter ${product.name}`}><Plus size={21} strokeWidth={3} className={isAdding ? 'animate-pulse' : ''} /></button>
                    </div>
                  )
                })}
              </div>
              <div className="border-t border-slate-100 p-2 dark:border-slate-800">
                <button type="button" onClick={addText} disabled={Boolean(addingKey)} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm transition hover:bg-canvas disabled:opacity-50"><ListPlus size={18} className="shrink-0 text-muted" /><span className="min-w-0 flex-1 truncate text-muted">Ajouter exactement <strong className="text-ink">« {cleanQuery} »</strong></span><Plus size={18} className="shrink-0 text-accent-700" /></button>
              </div>
            </>
          ) : (
            <div className="p-3">
              <div className="rounded-xl bg-canvas p-4 text-center"><span className="text-2xl">✍️</span><strong className="mt-2 block text-sm">Aucun produit correspondant</strong><p className="mt-1 text-xs leading-5 text-muted">Ajoutez ce nom directement à votre liste. Vous pourrez créer sa fiche complète plus tard.</p></div>
              <button type="button" onClick={addText} disabled={Boolean(addingKey)} className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent-600 px-4 text-sm font-extrabold text-white transition active:scale-[.98] disabled:opacity-50"><ListPlus size={19} />Ajouter « {cleanQuery} » comme texte</button>
            </div>
          )}
        </div>
      )}

      {!cleanQuery && <p className="mt-2.5 px-1 text-[11px] leading-5 text-muted">La recherche comprend aussi la Darija, l’arabe, l’anglais et les petites fautes.</p>}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => navigate('/t9dya/catalog')} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent-50 px-3 text-sm font-extrabold text-accent-800 dark:bg-accent-950 dark:text-accent-200"><ShoppingCart size={18} />Tout le catalogue</button>
        <button type="button" onClick={() => navigate(`/t9dya/catalog?create=1${cleanQuery ? `&name=${encodeURIComponent(cleanQuery)}` : ''}`)} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-canvas px-3 text-sm font-extrabold"><PackagePlus size={18} />Créer un produit</button>
      </div>
    </section>
  )
}
