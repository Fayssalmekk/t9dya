import { motion as Motion } from 'framer-motion'
import { Check, CheckCircle2, Minus, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { updateShoppingItem, validateItem } from '../services/shopping'

export default function ShoppingItem({ item, onBuy, onUnbuy, onDelete, shoppingMode = false }) {
  const { user, household } = useAuth()
  const member = household.memberProfiles?.[item.addedBy]
  const isMine = item.addedBy === user.uid
  const canValidate = item.status === 'proposed' && !isMine
  const step = ['kg', 'L'].includes(item.unit) ? 0.5 : 1

  const updateQuantity = (amount) => {
    const quantity = Math.max(step, Number(item.quantity) + amount)
    updateShoppingItem(household.id, item.id, { quantity }, user.uid)
  }

  const handleDragEnd = (_, info) => {
    if (info.offset.x > 85 && !item.bought) onBuy(item)
    if (info.offset.x < -85) onDelete(item)
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-transparent to-red-500">
      <div className="absolute inset-y-0 left-4 flex items-center text-white"><CheckCircle2 size={23} /></div>
      <div className="absolute inset-y-0 right-4 flex items-center text-white"><Trash2 size={22} /></div>
      <Motion.article drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.18} onDragEnd={handleDragEnd} whileDrag={{ scale: 0.985 }} className={`relative flex items-center gap-3 bg-surface p-3 shadow-sm ${shoppingMode ? 'min-h-28 text-lg' : 'min-h-24'} ${item.bought ? 'opacity-65' : ''}`}>
        <button type="button" onClick={() => item.bought ? onUnbuy(item) : onBuy(item)} className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border-2 transition ${item.bought ? 'border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600' : 'border-slate-200 text-transparent hover:border-accent-500 dark:border-slate-700'}`} aria-label={item.bought ? `Remettre ${item.name} dans la liste` : `Marquer ${item.name} comme acheté`}>
          <Check size={21} strokeWidth={3} />
        </button>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-canvas text-2xl">{item.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1">
            <strong className={`min-w-0 flex-1 truncate pt-2 ${item.bought ? 'line-through' : ''}`}>{item.name}</strong>
            <span title={`Ajouté par ${member?.displayName || 'membre'}`} className="mt-2 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-100 text-[10px] font-extrabold text-accent-700">{member?.displayName?.[0]?.toUpperCase() || '?'}</span>
            {!item.bought && (
              <button
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => { event.stopPropagation(); onDelete(item) }}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                aria-label={`Supprimer ${item.name} de la liste`}
                title="Supprimer de la liste"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
          {(item.brand || item.format) && <p className="mt-0.5 truncate text-xs font-semibold text-accent-700">{[item.brand, item.format].filter(Boolean).join(' · ')}</p>}
          {item.note && <p className="mt-0.5 truncate text-xs text-muted">{item.note}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {!item.bought && <div className="flex items-center rounded-lg bg-canvas"><button type="button" onClick={() => updateQuantity(-step)} className="grid h-8 w-8 place-items-center" aria-label="Diminuer"><Minus size={14} /></button><span className="min-w-12 text-center text-xs font-extrabold tabular-nums">{item.quantity} {item.unit}</span><button type="button" onClick={() => updateQuantity(step)} className="grid h-8 w-8 place-items-center" aria-label="Augmenter"><Plus size={14} /></button></div>}
            {item.status === 'validated' ? <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-extrabold text-emerald-700 dark:bg-emerald-950">VALIDÉ</span> : canValidate ? <button type="button" onClick={() => validateItem(household.id, item.id, user.uid)} className="min-h-8 rounded-full bg-amber-100 px-3 text-[10px] font-extrabold text-amber-800">VALIDER</button> : <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-extrabold text-amber-700 dark:bg-amber-950">EN ATTENTE</span>}
          </div>
        </div>
      </Motion.article>
    </div>
  )
}
