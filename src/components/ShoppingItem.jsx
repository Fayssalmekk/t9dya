import { Check, Minus, Plus, ReceiptText, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { updateShoppingItem } from '../services/shopping'

export default function ShoppingItem({ item, onBuy, onBuyWithDetails, onUnbuy, onDelete }) {
  const { user, household } = useAuth()
  const member = household.memberProfiles?.[item.addedBy]
  const step = ['kg', 'L'].includes(item.unit) ? 0.5 : 1

  const updateQuantity = (amount) => {
    const quantity = Math.max(step, Number(item.quantity) + amount)
    updateShoppingItem(household.id, item.id, { quantity }, user.uid)
  }

  return (
    <article className={`rounded-2xl border bg-surface px-3 py-2.5 transition ${item.bought ? 'border-emerald-100 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20' : 'border-slate-200 shadow-sm dark:border-slate-800'}`}>
      <div className="flex min-h-12 items-center gap-3">
        <button
          type="button"
          onClick={() => item.bought ? onUnbuy(item) : onBuy(item)}
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border-2 transition active:scale-95 ${item.bought ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-canvas text-transparent hover:border-accent-500 dark:border-slate-700'}`}
          aria-label={item.bought ? `Remettre ${item.name} dans la liste` : `Marquer ${item.name} comme acheté`}
        >
          <Check size={21} strokeWidth={3} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <strong className={`min-w-0 flex-1 truncate text-[15px] ${item.bought ? 'text-muted line-through' : ''}`}>{item.name}</strong>
            {member && <span title={`Ajouté par ${member.displayName}`} className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-100 text-[10px] font-black text-accent-700 dark:bg-accent-950 dark:text-accent-200">{member.displayName?.[0]?.toUpperCase() || '?'}</span>}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted">{item.bought ? 'Acheté · conservé 24 h dans la liste' : `${item.quantity} ${item.unit}${item.note ? ` · ${item.note}` : ''}`}</p>
        </div>

        {!item.bought && <button type="button" onClick={() => onDelete(item)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950" aria-label={`Supprimer ${item.name}`}><Trash2 size={18} /></button>}
      </div>

      {!item.bought && (
        <div className="mt-2 flex items-center justify-between gap-3 border-t border-slate-100 pt-2 dark:border-slate-800">
          <div className="flex items-center rounded-xl bg-canvas p-0.5">
            <button type="button" onClick={() => updateQuantity(-step)} className="grid h-9 w-9 place-items-center rounded-lg" aria-label={`Diminuer la quantité de ${item.name}`}><Minus size={15} /></button>
            <span className="min-w-14 text-center text-xs font-black tabular-nums">{item.quantity} {item.unit}</span>
            <button type="button" onClick={() => updateQuantity(step)} className="grid h-9 w-9 place-items-center rounded-lg" aria-label={`Augmenter la quantité de ${item.name}`}><Plus size={15} /></button>
          </div>
          <button type="button" onClick={() => onBuyWithDetails(item)} className="flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-extrabold text-accent-700 hover:bg-accent-50 dark:hover:bg-accent-950" aria-label={`Marquer ${item.name} acheté avec son prix`}><ReceiptText size={16} />Ajouter le prix</button>
        </div>
      )}
    </article>
  )
}
