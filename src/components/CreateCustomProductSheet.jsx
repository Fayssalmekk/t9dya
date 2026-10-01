import { Check, ChevronDown, PackagePlus, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { categories } from '../data/catalog'
import { createCustomProduct } from '../services/shopping'

const icons = ['🛒', '🍅', '🥔', '🥕', '🧅', '🥬', '🍎', '🍌', '🍋', '🍗', '🥩', '🐟', '🍤', '🥚', '🥛', '🧀', '🧈', '🥖', '🍞', '🥐', '🍚', '🍝', '🥫', '🫙', '🧃', '🥤', '💧', '🍪', '🍫', '🍿', '🧴', '🧼', '🧽', '🧻', '👶', '❄️', '🌾', '☕', '🍵', '🌶️']
const units = ['pièce', 'kg', 'g', 'L', 'pack', 'boîte', 'bouteille', 'sachet', 'pot', 'barquette', 'botte', 'plateau', 'rouleau']
const normalize = (value) => value.trim().toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export default function CreateCustomProductSheet({ initialName = '', existingProducts, willAddToList, onClose, onCreated }) {
  const { household, user } = useAuth()
  const [form, setForm] = useState({
    name: initialName,
    altName: '',
    brand: '',
    format: '',
    category: 'epicerie',
    emoji: '🛒',
    unit: 'pièce',
    defaultPrice: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const category = useMemo(() => categories.find((item) => item.id === form.category), [form.category])

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const submit = async (event) => {
    event.preventDefault()
    const duplicate = existingProducts.some((product) => normalize(product.name) === normalize(form.name) && normalize(product.brand || '') === normalize(form.brand))
    if (duplicate) {
      setError('Ce produit avec cette marque existe déjà dans le catalogue.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const product = await createCustomProduct(household.id, user.uid, {
        ...form,
        categoryName: category.name
      })
      onCreated(product)
    } catch {
      setError('Impossible d’enregistrer ce produit. Vérifiez les règles Firebase.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby="custom-product-title">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]" aria-label="Fermer" />
      <form onSubmit={submit} className="relative max-h-[94dvh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-surface px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-xl bg-accent-100 text-accent-700"><PackagePlus size={23} /></span><div className="min-w-0 flex-1"><h2 id="custom-product-title" className="text-xl font-extrabold">Créer un produit</h2><p className="text-sm text-muted">Enregistré pour toujours dans votre foyer</p></div><button type="button" onClick={onClose} className="grid min-h-11 min-w-11 place-items-center rounded-xl bg-canvas" aria-label="Fermer"><X size={19} /></button></div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nom du produit *"><input autoFocus value={form.name} onChange={(event) => update('name', event.target.value)} required maxLength={80} placeholder="Ex. Sauce samouraï" className="field-input" /></Field>
          <Field label="Nom Darija / arabe"><input value={form.altName} onChange={(event) => update('altName', event.target.value)} maxLength={80} dir="auto" placeholder="الاسم بالعربية" className="field-input" /></Field>
          <Field label="Marque"><input value={form.brand} onChange={(event) => update('brand', event.target.value)} maxLength={50} placeholder="Ex. Aïcha" className="field-input" /></Field>
          <Field label="Format"><input value={form.format} onChange={(event) => update('format', event.target.value)} maxLength={40} placeholder="Ex. 500 g, pack x6" className="field-input" /></Field>
          <Field label="Catégorie *"><Select value={form.category} onChange={(event) => update('category', event.target.value)}>{categories.map((item) => <option key={item.id} value={item.id}>{item.emoji} {item.name}</option>)}</Select></Field>
          <Field label="Unité *"><Select value={form.unit} onChange={(event) => update('unit', event.target.value)}>{units.map((unit) => <option key={unit}>{unit}</option>)}</Select></Field>
          <Field label="Prix estimé"><div className="relative"><input type="number" min="0" step="0.5" inputMode="decimal" value={form.defaultPrice} onChange={(event) => update('defaultPrice', event.target.value)} placeholder="0" className="field-input pr-14" /><span className="absolute right-4 top-3.5 text-sm font-bold text-muted">DH</span></div></Field>
        </div>

        <fieldset className="mt-5"><legend className="text-sm font-bold">Choisir une icône *</legend><div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-2">{icons.map((emoji) => <button key={emoji} type="button" onClick={() => update('emoji', emoji)} className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-xl text-2xl transition ${form.emoji === emoji ? 'bg-accent-100 ring-2 ring-accent-500' : 'bg-canvas'}`} aria-label={`Choisir ${emoji}`} aria-pressed={form.emoji === emoji}>{emoji}{form.emoji === emoji && <Check className="absolute -right-1 -top-1 rounded-full bg-accent-600 p-0.5 text-white" size={15} />}</button>)}</div></fieldset>

        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700 dark:bg-red-950 dark:text-red-200" role="alert">{error}</p>}
        <button type="submit" disabled={saving} className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-accent-600 font-extrabold text-white shadow-lg shadow-teal-600/20 disabled:opacity-60"><PackagePlus size={20} />{saving ? 'Enregistrement…' : willAddToList ? 'Enregistrer et ajouter à la liste' : 'Enregistrer dans le catalogue'}</button>
      </form>
    </div>
  )
}

function Field({ label, children }) {
  return <label><span className="mb-2 block text-sm font-bold">{label}</span>{children}</label>
}

function Select({ children, ...props }) {
  return <span className="relative block"><select {...props} className="field-input appearance-none pr-10">{children}</select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 text-muted" size={18} /></span>
}
