import { RotateCcw, X } from 'lucide-react'
import { usePlatform } from '../context/PlatformContext'

export default function Toast() {
  const { toast, dismissToast } = usePlatform()
  if (!toast) return null

  const runAction = async () => {
    await toast.action?.onClick?.()
    dismissToast()
  }

  return (
    <div className="fixed bottom-24 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-2xl dark:bg-slate-100 dark:text-slate-950" role="status">
      <span className="flex-1 font-medium">{toast.message}</span>
      {toast.action && <button type="button" onClick={runAction} className="flex min-h-10 items-center gap-1 rounded-lg px-2 font-bold text-teal-300 dark:text-teal-700"><RotateCcw size={16} />{toast.action.label}</button>}
      <button type="button" onClick={dismissToast} className="grid min-h-10 min-w-10 place-items-center rounded-lg" aria-label="Fermer"><X size={18} /></button>
    </div>
  )
}
