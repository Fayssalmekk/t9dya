import { useCallback } from 'react'
import { motion as Motion, useAnimation, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'
import SmartImage from './SmartImage'

export default function SwipeCard({ ingredient, onDecision, active = true }) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-220, 220], [-10, 10])
  const yesOpacity = useTransform(x, [20, 120], [0, 1])
  const noOpacity = useTransform(x, [-120, -20], [1, 0])
  const tint = useTransform(x, [-180, 0, 180], ['rgba(244,63,94,.14)', 'rgba(255,255,255,0)', 'rgba(16,185,129,.14)'])
  const controls = useAnimation()
  const reduced = useReducedMotion()

  const decide = useCallback(async (hasIt) => {
    if (!active) return
    if (!reduced) await controls.start({ x: hasIt ? 620 : -620, rotate: hasIt ? 16 : -16, opacity: 0, transition: { duration: 0.25 } })
    onDecision(hasIt)
  }, [active, controls, onDecision, reduced])

  return <Motion.article drag={active ? 'x' : false} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.85} style={{ x, rotate }} animate={controls} onDragEnd={(_, info) => { if (Math.abs(info.offset.x) > 105 || Math.abs(info.velocity.x) > 650) decide(info.offset.x > 0); else controls.start({ x: 0, rotate: 0, transition: { type: 'spring', stiffness: 420, damping: 28 } }) }} className="absolute inset-0 touch-pan-y select-none overflow-hidden rounded-[2rem] border border-slate-200 bg-surface shadow-[0_28px_70px_-30px_rgba(15,23,42,.5)] dark:border-slate-700" aria-label={`${ingredient.name_fr}. Glissez à droite si vous l’avez, à gauche sinon.`}>
    <Motion.div className="pointer-events-none absolute inset-0 z-10" style={{ backgroundColor: tint }} />
    <SmartImage src={ingredient.imageUrl} alt={ingredient.name_fr} emoji={ingredient.emoji} className="h-[66%] w-full" />
    <div className="relative z-20 flex h-[34%] items-center justify-between gap-4 p-6"><div><h3 className="text-3xl font-black tracking-tight">{ingredient.name_fr}</h3>{ingredient.name_darija && <p className="mt-1 text-base font-semibold text-muted">{ingredient.name_darija}</p>}</div><span className="text-5xl">{ingredient.emoji}</span></div>
    <Motion.span style={{ opacity: yesOpacity }} className="absolute left-5 top-5 z-30 rotate-[-8deg] rounded-xl border-4 border-emerald-500 bg-white/90 px-4 py-2 text-lg font-black text-emerald-600">JE L’AI ✓</Motion.span>
    <Motion.span style={{ opacity: noOpacity }} className="absolute right-5 top-5 z-30 rotate-[8deg] rounded-xl border-4 border-rose-500 bg-white/90 px-4 py-2 text-lg font-black text-rose-600">OUPS, NON ✕</Motion.span>
  </Motion.article>
}
