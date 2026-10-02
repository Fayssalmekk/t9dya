import { motion as Motion, useReducedMotion } from 'framer-motion'
import SmartImage from './SmartImage'

const choices = [
  { id: 'meal', title: 'Un bon plat', subtitle: 'Marocain, quotidien ou du monde', emoji: '🍲', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=82', gradient: 'from-orange-500 to-rose-500' },
  { id: 'dessert', title: 'Une douceur', subtitle: 'Desserts, gâteaux et gourmandises', emoji: '🍰', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=82', gradient: 'from-fuchsia-500 to-pink-500' },
  { id: 'juice', title: 'Quelque chose de frais', subtitle: 'Jus, smoothies et cocktails', emoji: '🥤', image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=900&q=82', gradient: 'from-emerald-500 to-teal-500' }
]

export default function CategoryPicker({ onChoose, savedSession, onResume }) {
  const reduced = useReducedMotion()
  return <section aria-labelledby="cuisine-category-title">
    <div className="mb-5"><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-accent-700">Étape 1 sur 3</p><h2 id="cuisine-category-title" className="mt-1 text-2xl font-black">Chnou nṭayab aujourd’hui ?</h2><p className="mt-1 text-sm text-muted">Choisis une envie, puis dis-nous ce que tu as à la maison.</p></div>
    {savedSession && <button type="button" onClick={onResume} className="mb-4 flex w-full items-center justify-between rounded-2xl border border-accent-200 bg-accent-50 p-4 text-left text-accent-900 dark:border-accent-800 dark:bg-accent-950/40 dark:text-accent-100"><span><strong className="block">Continuer ma dernière session</strong><small>{savedSession.index + 1} ingrédients déjà parcourus</small></span><span className="text-2xl">↗</span></button>}
    <div className="grid gap-4 sm:grid-cols-3">{choices.map((choice, index) => <Motion.button key={choice.id} type="button" onClick={() => onChoose(choice.id)} initial={reduced ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} whileTap={reduced ? undefined : { scale: 0.98 }} className="group relative min-h-56 overflow-hidden rounded-[1.75rem] text-left shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-accent-300"><SmartImage src={choice.image} alt={choice.title} emoji={choice.emoji} className="absolute inset-0 h-full w-full" /><span className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" /><span className={`absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${choice.gradient} text-2xl shadow-lg`}>{choice.emoji}</span><span className="absolute inset-x-0 bottom-0 p-5 text-white"><strong className="block text-xl font-black">{choice.title}</strong><small className="mt-1 block text-white/80">{choice.subtitle}</small></span></Motion.button>)}</div>
  </section>
}
