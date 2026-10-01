import { AlertCircle, CheckCircle2 } from 'lucide-react'

export default function Notice({ children, type = 'error' }) {
  const Icon = type === 'success' ? CheckCircle2 : AlertCircle
  const colors = type === 'success'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
    : 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200'

  return (
    <div className={`flex gap-3 rounded-xl border p-3 text-sm leading-5 ${colors}`} role={type === 'error' ? 'alert' : 'status'}>
      <Icon className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
      <span>{children}</span>
    </div>
  )
}
