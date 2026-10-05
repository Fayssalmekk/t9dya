import { RotateCcw, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { usePlatform } from '../context/PlatformContext'

export default function Toast() {
  const { toast, dismissToast } = usePlatform()
  if (!toast) return null

  const runAction = async () => {
    await toast.action?.onClick?.()
    dismissToast()
  }

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 z-[100] flex justify-center px-4" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}>
      <div className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-white/15 bg-slate-900/[.85] px-4 py-3 text-sm text-white shadow-xl backdrop-blur-md dark:border-slate-300/30 dark:bg-slate-100/[.85] dark:text-slate-950" role="status" aria-live="polite" aria-atomic="true">
        <span className="min-w-0 flex-1 break-words font-medium">{toast.message}</span>
        {toast.action && <button type="button" onClick={runAction} className="pointer-events-auto flex min-h-10 shrink-0 items-center gap-1 rounded-lg px-2 font-bold text-teal-300 dark:text-teal-700"><RotateCcw size={16} />{toast.action.label}</button>}
        <button type="button" onClick={dismissToast} className="pointer-events-auto grid min-h-10 min-w-10 shrink-0 place-items-center rounded-lg" aria-label="Fermer"><X size={18} /></button>
      </div>
    </div>, document.body
  )
}
