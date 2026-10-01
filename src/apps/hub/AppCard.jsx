import { motion } from 'framer-motion'
import { ArrowUpRight, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'

const MotionArticle = motion.article
const accents = { teal: 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-200', violet: 'bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-200', amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200', rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-200' }

export default function AppCard({ app }) {
  const { t } = useI18n()
  const Icon = app.icon
  const content = <><span className={`grid h-14 w-14 place-items-center rounded-2xl ${accents[app.accent]}`}><Icon size={27} /></span><span className="mt-6 flex items-start justify-between gap-4"><span><strong className="block text-xl font-black">{t(app.name)}</strong><small className="mt-2 block max-w-xs text-sm leading-6 text-muted">{t(app.description)}</small></span>{app.comingSoon ? <Clock3 className="mt-1 shrink-0 text-muted" size={19} /> : <ArrowUpRight className="mt-1 shrink-0" size={21} />}</span>{app.comingSoon && <span className="mt-5 inline-flex rounded-full bg-canvas px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-muted">{t('hub.soon')}</span>}</>
  return <MotionArticle whileHover={app.enabled ? { y: -3 } : undefined} whileTap={app.enabled ? { scale: 0.985 } : undefined} className={`rounded-[1.75rem] border p-5 shadow-card ${app.enabled ? 'border-slate-100 bg-surface dark:border-slate-800' : 'border-dashed border-slate-200 bg-surface/50 opacity-65 dark:border-slate-800'}`}>{app.enabled ? <Link to={app.basePath} className="block min-h-48">{content}</Link> : <div className="min-h-48">{content}</div>}</MotionArticle>
}
