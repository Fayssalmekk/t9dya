import { AnimatePresence, motion as Motion } from 'framer-motion'
import { Check, Minus, Plus, Store, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { usePlatform } from '../context/PlatformContext'
import { useShopping } from '../context/ShoppingContext'
import { markItemBought } from '../services/shopping'

const stores = ['Marjane', 'Carrefour', 'Aswak Assalam', 'BIM', "Label'Vie", 'Marché', 'Hanout', 'Autre']

export default function BoughtPriceSheet({ item, onClose }) {
  const { household, user } = useAuth()
  const { purchases } = useShopping()
  const { notify } = usePlatform()
  const recentPrices = useMemo(() => purchases
    .filter((purchase) => purchase.productId === item?.productId && Number.isFinite(purchase.price))
    .map((purchase) => purchase.price)
    .filter((price, index, values) => values.indexOf(price) === index)
    .slice(0, 3), [item?.productId, purchases])
  const [price, setPrice] = useState(recentPrices[0] ?? item?.estimatedPrice ?? 0)
  const [store, setStore] = useState(household.lastUsedStore || 'Marjane')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const adjust = (amount) => setPrice((value) => Math.max(0, Number(value || 0) + amount))

  const confirm = async (skipPrice = false) => {
    setSaving(true)
    setError('')
    try {
      await markItemBought(household.id, item, user.uid, { price, store, note, skipPrice })
      onClose()
      notify(`${item.name} marqué comme acheté`)
      navigator.vibrate?.(35)
    } catch {
      setError('Impossible d’enregistrer cet achat.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {item && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby="bought-title">
          <Motion.button type="button" className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]" aria-label="Fermer" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <Motion.section className="relative z-10 max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-surface px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 320 }}>
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent-50 text-3xl">{item.emoji}</span>
              <div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase text-emerald-600">Dans le panier</p><h2 id="bought-title" className="truncate text-xl font-extrabold">Combien avez-vous payé ?</h2><p className="truncate text-sm text-muted">{item.name} · {item.quantity} {item.unit}</p></div>
              <button type="button" onClick={onClose} className="grid min-h-11 min-w-11 place-items-center rounded-xl bg-slate-100 dark:bg-slate-800" aria-label="Fermer"><X size={20} /></button>
            </div>

            <div className="mt-6 rounded-2xl bg-canvas p-4">
              <label htmlFor="paid-price" className="block text-center text-sm font-bold text-muted">Prix total payé</label>
              <div className="mt-2 flex items-baseline justify-center gap-2">
                <input id="paid-price" type="number" min="0" step="0.5" inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} className="w-32 bg-transparent text-right text-4xl font-black tabular-nums outline-none" />
                <span className="text-xl font-bold text-muted">DH</span>
              </div>
              <div className="mt-4 grid grid-cols-5 gap-2">
                {[-5, -1, 1, 5, 10].map((amount) => (
                  <button key={amount} type="button" onClick={() => adjust(amount)} className="min-h-11 rounded-xl bg-surface text-sm font-extrabold shadow-sm">{amount > 0 ? <Plus className="mr-0.5 inline" size={13} /> : <Minus className="mr-0.5 inline" size={13} />}{Math.abs(amount)}</button>
                ))}
              </div>
            </div>

            {recentPrices.length > 0 && <div className="mt-4"><p className="text-xs font-bold uppercase tracking-wider text-muted">Prix récents</p><div className="mt-2 flex gap-2">{recentPrices.map((recent) => <button key={recent} type="button" onClick={() => setPrice(recent)} className="min-h-10 rounded-full border border-accent-100 px-4 text-sm font-bold text-accent-700">{recent} DH</button>)}</div></div>}

            <div className="mt-5">
              <p className="flex items-center gap-2 text-sm font-bold"><Store size={18} />Magasin</p>
              <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
                {stores.map((value) => <button key={value} type="button" onClick={() => setStore(value)} className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-bold ${store === value ? 'bg-accent-600 text-white' : 'bg-canvas text-muted'}`}>{value}</button>)}
              </div>
            </div>

            <label className="mt-5 block"><span className="mb-2 block text-sm font-bold">Note de dépense <span className="font-normal text-muted">(facultatif)</span></span><input value={note} onChange={(event) => setNote(event.target.value)} maxLength={100} placeholder="Promotion, marque…" className="min-h-12 w-full rounded-xl border border-slate-200 bg-surface px-4 dark:border-slate-700" /></label>
            {error && <p className="mt-4 text-sm font-semibold text-red-600" role="alert">{error}</p>}
            <button type="button" disabled={saving} onClick={() => confirm(false)} className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-accent-600 font-extrabold text-white shadow-lg shadow-teal-600/20 disabled:opacity-60"><Check size={21} />{saving ? 'Enregistrement…' : `Confirmer · ${Number(price || 0).toFixed(2)} DH`}</button>
            <button type="button" disabled={saving} onClick={() => confirm(true)} className="mt-2 min-h-11 w-full text-sm font-bold text-muted">Marquer acheté sans prix</button>
          </Motion.section>
        </div>
      )}
    </AnimatePresence>
  )
}
