import { AlertTriangle, X } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null)
  const resolver = useRef(null)

  const settle = useCallback((accepted) => {
    resolver.current?.(accepted)
    resolver.current = null
    setDialog(null)
  }, [])

  const confirm = useCallback((options) => new Promise((resolve) => {
    resolver.current?.(false)
    resolver.current = resolve
    setDialog({
      title: options.title || 'Confirmer cette action ?',
      message: options.message || '',
      confirmLabel: options.confirmLabel || 'Confirmer',
      cancelLabel: options.cancelLabel || 'Annuler',
      tone: options.tone || 'danger'
    })
  }), [])

  useEffect(() => {
    if (!dialog) return undefined
    const closeWithEscape = (event) => {
      if (event.key === 'Escape') settle(false)
    }
    document.addEventListener('keydown', closeWithEscape)
    return () => document.removeEventListener('keydown', closeWithEscape)
  }, [dialog, settle])

  useEffect(() => () => resolver.current?.(false), [])

  const contextValue = useMemo(() => confirm, [confirm])
  const dangerous = dialog?.tone === 'danger'

  return <ConfirmContext.Provider value={contextValue}>
    {children}
    {dialog && <div className="fixed inset-0 z-[100] grid place-items-center p-5" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby={dialog.message ? 'confirm-dialog-message' : undefined}>
      <button type="button" onClick={() => settle(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" aria-label={dialog.cancelLabel} />
      <section className="relative w-full max-w-sm overflow-hidden rounded-[1.75rem] bg-surface p-5 text-center text-ink shadow-2xl">
        <button type="button" onClick={() => settle(false)} className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-xl bg-canvas text-muted" aria-label="Fermer"><X size={18} /></button>
        <span className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl ${dangerous ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300' : 'bg-accent-50 text-accent-700'}`}><AlertTriangle size={28} /></span>
        <h2 id="confirm-dialog-title" className="mt-4 text-xl font-black">{dialog.title}</h2>
        {dialog.message && <p id="confirm-dialog-message" className="mt-2 text-sm leading-6 text-muted">{dialog.message}</p>}
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => settle(false)} className="min-h-12 rounded-xl bg-canvas px-3 font-extrabold">{dialog.cancelLabel}</button>
          <button type="button" onClick={() => settle(true)} className={`min-h-12 rounded-xl px-3 font-extrabold text-white ${dangerous ? 'bg-rose-600' : 'bg-accent-600'}`}>{dialog.confirmLabel}</button>
        </div>
      </section>
    </div>}
  </ConfirmContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirmDialog() {
  const confirm = useContext(ConfirmContext)
  if (!confirm) throw new Error('useConfirmDialog doit être utilisé dans ConfirmProvider')
  return confirm
}
