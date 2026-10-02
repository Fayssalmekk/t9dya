import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion as Motion, useReducedMotion } from 'framer-motion'
import { Check, RotateCcw, X } from 'lucide-react'
import SwipeCard from './SwipeCard'
import SmartImage from './SmartImage'

export default function SwipeDeck({ deck, index, decisions, onDecide, onUndo, onDone, onChangeCategory }) {
  const current = deck[index]
  const next = deck[index + 1]
  const reduced = useReducedMotion()
  const [celebrate, setCelebrate] = useState(false)

  const decide = useCallback((hasIt) => {
    if (!current) return
    if (hasIt) {
      navigator.vibrate?.(35)
      setCelebrate(true)
      window.setTimeout(() => setCelebrate(false), 520)
    } else navigator.vibrate?.(18)
    onDecide(current.id, hasIt)
  }, [current, onDecide])

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'ArrowRight') decide(true)
      if (event.key === 'ArrowLeft') decide(false)
      if ((event.ctrlKey && event.key.toLowerCase() === 'z') || event.key === 'Backspace') onUndo()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [decide, onUndo])

  const percent = deck.length ? Math.round((index / deck.length) * 100) : 0
  return <section className="flex min-h-0 flex-col" aria-labelledby="swipe-title">
    <div className="mb-2 flex items-end justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-accent-700 sm:text-xs">Étape 2 sur 3</p><div className="flex items-baseline gap-2"><h2 id="swipe-title" className="text-xl font-black sm:text-2xl">Qu’est-ce qu’on a ?</h2><button type="button" onClick={onChangeCategory} className="text-[11px] font-bold text-muted underline">Changer</button></div></div><strong className="rounded-full bg-surface px-3 py-1.5 text-xs shadow-sm sm:text-sm">{Math.min(index + 1, deck.length)} / {deck.length}</strong></div>
    <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><Motion.div className="h-full rounded-full bg-gradient-to-r from-accent-500 to-emerald-400" animate={{ width: `${percent}%` }} /></div>
    <div className="relative mx-auto h-[clamp(16rem,calc(100dvh-24rem),29rem)] w-full max-w-md shrink-0 overscroll-contain">
      {next && <Motion.div key={next.id} initial={false} animate={{ scale: 0.96, y: 12 }} className="absolute inset-0 overflow-hidden rounded-[2rem] border bg-surface opacity-70"><SmartImage src={next.imageUrl} alt="Prochain ingrédient" emoji={next.emoji} className="h-full w-full" /></Motion.div>}
      <AnimatePresence>{current && <SwipeCard key={current.id} ingredient={current} onDecision={decide} />}</AnimatePresence>
      <AnimatePresence>{celebrate && <Motion.div initial={reduced ? false : { scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.8, opacity: 0 }} className="pointer-events-none absolute inset-0 z-40 grid place-items-center"><span className="grid h-24 w-24 place-items-center rounded-full bg-emerald-500 text-white shadow-2xl"><Check size={52} strokeWidth={3} /></span></Motion.div>}</AnimatePresence>
    </div>
    <p className="mt-2 text-center text-[11px] font-semibold text-muted sm:text-xs">Glisse à gauche ou à droite</p>
    <div className="mx-auto mt-2 grid w-full max-w-md grid-cols-[1fr_auto_1fr] items-center gap-3"><button type="button" onClick={() => decide(false)} disabled={!current} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-rose-50 font-extrabold text-rose-600 disabled:opacity-40 dark:bg-rose-950/30"><X size={20} /> Non</button><button type="button" onClick={onUndo} disabled={!decisions.length} className="grid h-11 w-11 place-items-center rounded-full bg-surface text-muted shadow disabled:opacity-30" aria-label="Annuler le dernier choix"><RotateCcw size={18} /></button><button type="button" onClick={() => decide(true)} disabled={!current} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-500 font-extrabold text-white disabled:opacity-40"><Check size={20} /> Oui</button></div>
    <button type="button" onClick={onDone} disabled={!decisions.length} className="mt-2 w-full rounded-xl border border-slate-200 bg-surface py-2.5 text-sm font-bold text-muted disabled:opacity-40 dark:border-slate-700">Voir mes idées maintenant</button>
  </section>
}
