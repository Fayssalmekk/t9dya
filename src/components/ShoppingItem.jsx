import { Check, Minus, MoreVertical, Plus, ReceiptText, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { usePlatform } from '../context/PlatformContext'
import { adjustShoppingItemQuantity } from '../services/shopping'

export default function ShoppingItem({ item, onBuy, onBuyWithDetails, onUnbuy, onDelete }) {
  const { user, household } = useAuth()
  const { notify } = usePlatform()
  const member = household.memberProfiles?.[item.addedBy]
  const step = ['kg', 'L'].includes(item.unit) ? 0.5 : 1
  const [menuOpen, setMenuOpen] = useState(false)
  const [quantityBusy, setQuantityBusy] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return undefined
    const closeOutside = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false)
    }
    const closeWithEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeWithEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeWithEscape)
    }
  }, [menuOpen])

  const updateQuantity = async (amount) => {
    if (quantityBusy || (amount < 0 && Number(item.quantity) <= step)) return
    setQuantityBusy(true)
    try {
      await adjustShoppingItemQuantity(household.id, item.id, amount, user.uid)
    } catch {
      notify('Quantité non modifiée.')
    } finally {
      setQuantityBusy(false)
    }
  }

  return (
    <article className={`relative rounded-2xl border bg-surface px-3 py-3 transition ${item.bought ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20' : 'border-slate-200 shadow-sm dark:border-slate-800'}`}>
      <div className="flex min-h-12 items-center gap-3">
        <span className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl shadow-sm ${item.bought ? 'bg-emerald-100 grayscale-[.35] dark:bg-emerald-950' : 'bg-canvas'}`} aria-hidden="true">
          {item.emoji || '🛒'}
          {member && <span title={`Ajouté par ${member.displayName}`} className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border-2 border-surface bg-accent-500 text-[8px] font-black text-white">{member.displayName?.[0]?.toUpperCase() || '?'}</span>}
        </span>

        <div className="min-w-0 flex-1">
          <strong className={`block truncate text-[15px] ${item.bought ? 'text-muted line-through' : ''}`}>{item.name}</strong>
          <p className="mt-0.5 truncate text-xs text-muted">{item.bought ? 'Acheté · visible encore 24 h' : `${item.quantity} ${item.unit}${item.note ? ` · ${item.note}` : ''}`}</p>
        </div>

        <div ref={menuRef} className="relative shrink-0"><button type="button" onClick={() => setMenuOpen((open) => !open)} className={`grid h-11 w-9 place-items-center rounded-xl transition ${menuOpen ? 'bg-canvas text-ink' : 'text-slate-400'}`} aria-label={`Options pour ${item.name}`} aria-haspopup="menu" aria-expanded={menuOpen}><MoreVertical size={19} /></button>{menuOpen && <div role="menu" className="absolute right-0 top-12 z-20 w-52 rounded-2xl border border-slate-200 bg-surface p-1.5 shadow-2xl dark:border-slate-700"><button type="button" role="menuitem" onClick={() => { setMenuOpen(false); onDelete(item) }} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-extrabold text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-950/40"><Trash2 size={17} />Supprimer de la liste</button></div>}</div>

        <button
          type="button"
          onClick={() => item.bought ? onUnbuy(item) : onBuy(item)}
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border-2 transition active:scale-95 ${item.bought ? 'border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'border-slate-300 bg-white text-transparent shadow-inner hover:border-accent-500 dark:border-slate-600 dark:bg-slate-950'}`}
          aria-label={item.bought ? `Remettre ${item.name} dans la liste` : `Marquer ${item.name} comme acheté`}
          aria-pressed={item.bought}
        >
          <Check size={23} strokeWidth={3.2} />
        </button>
      </div>

      {!item.bought && (
        <div className="mt-2 flex items-center justify-between gap-3 border-t border-slate-100 pt-2 dark:border-slate-800">
          <div className="flex items-center rounded-xl bg-canvas p-0.5">
            <button type="button" onClick={() => updateQuantity(-step)} disabled={quantityBusy || Number(item.quantity) <= step} className="grid h-9 w-9 place-items-center rounded-lg disabled:opacity-30" aria-label={`Diminuer la quantité de ${item.name}`}><Minus size={15} /></button>
            <span className={`min-w-14 text-center text-xs font-black tabular-nums ${quantityBusy ? 'opacity-50' : ''}`}>{item.quantity} {item.unit}</span>
            <button type="button" onClick={() => updateQuantity(step)} disabled={quantityBusy} className="grid h-9 w-9 place-items-center rounded-lg disabled:opacity-30" aria-label={`Augmenter la quantité de ${item.name}`}><Plus size={15} /></button>
          </div>
          <button type="button" onClick={() => onBuyWithDetails(item)} className="flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-extrabold text-accent-700 hover:bg-accent-50 dark:hover:bg-accent-950" aria-label={`Marquer ${item.name} acheté avec son prix`}><ReceiptText size={16} />Ajouter le prix</button>
        </div>
      )}
    </article>
  )
}
