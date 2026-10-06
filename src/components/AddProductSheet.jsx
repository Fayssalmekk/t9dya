import { AnimatePresence, motion as Motion } from 'framer-motion'
import { Minus, Plus, ShoppingBasket, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { usePlatform } from '../context/PlatformContext'
import { useShopping } from '../context/ShoppingContext'
import { addShoppingItem, DEFAULT_LIST_ID } from '../services/shopping'

const units = ['pièce', 'kg', 'g', 'L', 'pack', 'boîte', 'bouteille', 'sachet', 'pot', 'barquette', 'botte', 'plateau', 'rouleau']

export default function AddProductSheet() {
  const { user, household } = useAuth()
  const { allItems, activeList } = useShopping()
  const { selectedProduct: product, closeProduct, notify } = usePlatform()
  const [quantity, setQuantity] = useState(1)
  const [unit, setUnit] = useState('pièce')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const targetListId = activeList?.id || DEFAULT_LIST_ID

  useEffect(() => {
    if (!product) return
    // A new product selection intentionally resets this short-lived form.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuantity(1)
    setUnit(product.unit || 'pièce')
    setNote('')
    setError('')
  }, [product])

  const duplicate = useMemo(() => allItems.find((item) => !item.bought && item.productId === product?.id), [allItems, product?.id])
  const step = ['kg', 'L'].includes(unit) ? 0.5 : 1
  const estimate = ((product?.defaultPrice || 0) * quantity).toFixed(2)

  const submit = async (event) => {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError('')
    try {
      const result = await addShoppingItem(household.id, targetListId, product, user, { quantity, unit, note }, duplicate)
      closeProduct()
      notify(result.merged ? `Quantité de ${product.name} mise à jour` : `${product.name} ajouté à la liste`)
    } catch {
      setError('Impossible d’ajouter ce produit. Vérifiez votre connexion.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {product && (
        <div className="fixed inset-0 z-40 flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby="add-product-title">
          <Motion.button type="button" aria-label="Fermer" className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" onClick={() => !submitting && closeProduct()} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <Motion.form onSubmit={submit} className="relative z-10 max-h-[94dvh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-surface px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 320 }}>
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-start gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent-50 text-3xl">{product.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-accent-700">{product.brand || product.categoryName}{product.format ? ` · ${product.format}` : ''}</p>
                <h2 id="add-product-title" className="mt-1 truncate text-xl font-extrabold">{product.name}</h2>
                <p className="mt-0.5 text-sm text-muted" dir="auto">{product.altName}</p>
              </div>
              <button type="button" onClick={closeProduct} disabled={submitting} className="grid min-h-11 min-w-11 place-items-center rounded-xl bg-slate-100 text-muted disabled:opacity-40 dark:bg-slate-800" aria-label="Fermer"><X size={20} /></button>
            </div>

            {duplicate && <div className="mt-5 rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">Déjà dans la liste : la quantité sera additionnée.</div>}

            <div className="mt-6 grid grid-cols-[1fr_1.15fr] gap-3">
              <div>
                <span className="mb-2 block text-sm font-bold">Quantité</span>
                <div className="flex min-h-12 items-center justify-between rounded-xl border border-slate-200 bg-canvas p-1 dark:border-slate-700">
                  <button type="button" onClick={() => setQuantity((value) => Math.max(step, value - step))} className="grid h-10 w-10 place-items-center rounded-lg bg-surface shadow-sm" aria-label="Diminuer"><Minus size={18} /></button>
                  <strong className="tabular-nums">{quantity}</strong>
                  <button type="button" onClick={() => setQuantity((value) => value + step)} className="grid h-10 w-10 place-items-center rounded-lg bg-accent-600 text-white" aria-label="Augmenter"><Plus size={18} /></button>
                </div>
              </div>
              <label>
                <span className="mb-2 block text-sm font-bold">Unité</span>
                <select value={unit} onChange={(event) => setUnit(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-200 bg-surface px-3 dark:border-slate-700">
                  {units.map((value) => <option key={value}>{value}</option>)}
                </select>
              </label>
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-bold">Note <span className="font-normal text-muted">(facultatif)</span></span>
              <input value={note} onChange={(event) => setNote(event.target.value)} maxLength={100} placeholder="Ex. Centrale, sans sucre…" className="min-h-12 w-full rounded-xl border border-slate-200 bg-surface px-4 dark:border-slate-700" />
            </label>
            {error && <p className="mt-4 text-sm font-medium text-red-600" role="alert">{error}</p>}
            <button type="submit" disabled={submitting} className="mt-6 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-accent-600 px-5 font-extrabold text-white shadow-lg shadow-teal-600/20 transition active:scale-[0.98] disabled:opacity-60">
              <ShoppingBasket size={21} /> {submitting ? 'Ajout…' : duplicate ? 'Ajouter la quantité' : 'Ajouter à la liste'}
              <span className="rounded-lg bg-white/15 px-2 py-1 text-xs font-bold">≈ {estimate} DH</span>
            </button>
          </Motion.form>
        </div>
      )}
    </AnimatePresence>
  )
}
