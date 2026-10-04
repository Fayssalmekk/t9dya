import { CalendarDays, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { usePlatform } from '../context/PlatformContext'
import { useShopping } from '../context/ShoppingContext'
import { createShoppingList } from '../services/shopping'

export default function NewListSheet({ onClose }) {
  const { household, user } = useAuth()
  const { allItems } = useShopping()
  const { notify } = usePlatform()
  const today = new Date().toISOString().slice(0, 10)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(today)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await createShoppingList(household.id, user.uid, title, date, allItems)
      notify('Nouvelle liste créée')
      onClose()
    } catch {
      setError('Impossible de créer la liste.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby="new-list-title">
      <button type="button" className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]" onClick={onClose} aria-label="Fermer" />
      <form onSubmit={submit} className="relative max-h-[94dvh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-[2rem] bg-surface px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-xl bg-accent-100 text-accent-700"><Plus size={23} /></span><div className="flex-1"><h2 id="new-list-title" className="text-xl font-extrabold">Nouvelle course</h2><p className="text-sm text-muted">Une liste séparée avec son propre résumé</p></div><button type="button" onClick={onClose} className="grid min-h-11 min-w-11 place-items-center rounded-xl bg-canvas" aria-label="Fermer"><X size={19} /></button></div>
        <label className="mt-6 block"><span className="mb-2 block text-sm font-bold">Nom de la liste</span><input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={50} placeholder="Courses du weekend" className="min-h-12 w-full rounded-xl border border-slate-200 bg-surface px-4 dark:border-slate-700" /></label>
        <label className="mt-4 block"><span className="mb-2 block text-sm font-bold">Date prévue</span><span className="relative block"><CalendarDays className="pointer-events-none absolute left-4 top-3.5 text-muted" size={19} /><input type="date" value={date} onChange={(event) => setDate(event.target.value)} required className="min-h-12 w-full rounded-xl border border-slate-200 bg-surface pl-12 pr-4 dark:border-slate-700" /></span></label>
        {error && <p className="mt-4 text-sm font-semibold text-red-600" role="alert">{error}</p>}
        <button disabled={saving} className="mt-6 min-h-14 w-full rounded-2xl bg-accent-600 font-extrabold text-white disabled:opacity-60">{saving ? 'Création…' : 'Créer cette liste'}</button>
      </form>
    </div>
  )
}
