import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'

const MotionArticle = motion.article
const accents = {
  teal: ['from-teal-400 to-teal-700', 'bg-teal-400/15'],
  violet: ['from-violet-400 to-violet-700', 'bg-violet-400/15'],
  amber: ['from-amber-400 to-orange-600', 'bg-amber-400/15'],
  rose: ['from-rose-400 to-pink-600', 'bg-rose-400/15'],
  sky: ['from-sky-400 to-blue-600', 'bg-sky-400/15'],
  emerald: ['from-emerald-400 to-emerald-800', 'bg-emerald-400/15']
}

export default function AppCard({ app }) {
  const { t } = useI18n()
  const reducedMotion = useReducedMotion()
  const Icon = app.icon
  const [gradient, glow] = accents[app.accent] || accents.teal
  return <MotionArticle whileHover={reducedMotion ? undefined : { y: -4 }} whileTap={reducedMotion ? undefined : { scale: 0.97 }} className="group relative min-w-0 overflow-hidden rounded-[1.75rem] border border-white/80 bg-surface shadow-[0_8px_30px_-15px_rgba(15,23,42,.25)] dark:border-slate-800">
    <Link to={app.basePath} className="relative flex h-full min-h-52 flex-col p-4 outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-teal-400 sm:min-h-60 sm:p-6" aria-label={`Ouvrir ${t(app.name)}`}>
      <span className={`pointer-events-none absolute -right-7 -top-7 h-32 w-32 rounded-full blur-2xl ${glow}`} />
      <span className="relative flex items-start justify-between gap-2"><span className={`grid h-16 w-16 shrink-0 place-items-center rounded-[1.35rem] bg-gradient-to-br text-white shadow-lg ring-1 ring-inset ring-white/25 sm:h-[4.5rem] sm:w-[4.5rem] ${gradient}`}><Icon size={30} strokeWidth={1.8} /></span><ArrowUpRight size={18} className="mt-1 text-muted transition group-hover:text-ink" /></span>
      <strong className="relative mt-5 block text-lg font-black leading-tight sm:text-xl">{t(app.name)}</strong>
      <span className="mt-2 block text-xs leading-5 text-muted sm:text-sm">{t(app.description)}</span>
      <span className="mt-auto pt-4 text-[10px] font-black uppercase tracking-widest text-muted">Ouvrir l’espace</span>
    </Link>
  </MotionArticle>
}
