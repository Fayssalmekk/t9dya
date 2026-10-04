import { Check, ChevronDown, PackagePlus, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { categories } from '../data/catalog'
import { createCustomProduct } from '../services/shopping'

const iconOptions = [
  ['🛒', 'Courses', 'panier caddie t9dya achats sou9'],
  ['🍅', 'Tomate', 'maticha tomate sauce'], ['🥔', 'Pomme de terre', 'btata patate frites'], ['🥕', 'Carotte', 'khizou légumes'],
  ['🧅', 'Oignon', 'bsla légume'], ['🧄', 'Ail', 'touma ail'], ['🥬', 'Salade', 'khoss laitue légumes'], ['🥒', 'Concombre', 'khyar concombre'],
  ['🫑', 'Poivron', 'felfla poivron'], ['🍆', 'Aubergine', 'denjal aubergine'], ['🫛', 'Petits pois', 'jelbana pois'], ['🌽', 'Maïs', 'dra mais'],
  ['🍎', 'Pomme', 'tfa7 fruit'], ['🍌', 'Banane', 'banane fruit'], ['🍊', 'Orange', 'limoun orange fruit'], ['🍋', 'Citron', 'hamed 7amed citron'],
  ['🍉', 'Pastèque', 'dellah pastèque'], ['🍓', 'Fraise', 'fraise fruit'], ['🍇', 'Raisin', '3neb raisin'], ['🥑', 'Avocat', 'avocat fruit'],
  ['🍗', 'Poulet', 'djaj poulet viande'], ['🥩', 'Viande', 'l7em viande boeuf'], ['🐟', 'Poisson', 'hout poisson'], ['🍤', 'Crevettes', 'crevette gambas poisson'],
  ['🥚', 'Œufs', 'bid oeuf'], ['🥛', 'Lait', 'hlib lait raibi'], ['🧀', 'Fromage', 'fromage cheddar rouge blanc'], ['🧈', 'Beurre', 'zebda beurre'],
  ['🥣', 'Yaourt', 'danone yaourt raibi laitier'], ['🥖', 'Baguette', 'khobz pain baguette'], ['🍞', 'Pain', 'khobz toast pain'], ['🥐', 'Viennoiserie', 'croissant pain'],
  ['🍚', 'Riz', 'roz riz'], ['🍝', 'Pâtes', 'makarona spaghetti pâtes'], ['🥫', 'Conserve', 'conserve tomate thon'], ['🫘', 'Légumineuses', 'loubia haricot lentille 3dess'],
  ['🫒', 'Huile', 'zit huile olive'], ['🌾', 'Farine', 'd9i9 farine semoule'], ['🧂', 'Sel', 'ml7 sel épice'], ['🍬', 'Sucre', 'sokkar sucre bonbon'],
  ['🌶️', 'Épices', 'ibzar poivre harissa piment'], ['🍯', 'Miel', 'miel confiture'], ['🫙', 'Pot et sauce', 'sauce mayonnaise moutarde confiture'], ['🥜', 'Fruits secs', 'cacahuète amande noix'],
  ['💧', 'Eau', 'ma eau bouteille'], ['🧃', 'Jus', '3asir jus boisson'], ['🥤', 'Soda', 'boisson gazeuse cola'], ['☕', 'Café', 'qahwa café'],
  ['🍵', 'Thé', 'atay thé'], ['🍪', 'Biscuits', 'biscuit cookies goûter'], ['🍫', 'Chocolat', 'chocolat cacao'], ['🍿', 'Snack', 'popcorn chips apéritif'],
  ['❄️', 'Surgelé', 'congelé glace surgelé'], ['🍦', 'Glace', 'glace dessert'], ['🍰', 'Gâteau', 'gateau pâtisserie dessert'], ['🍕', 'Pizza', 'pizza surgelé'],
  ['🧴', 'Hygiène', 'shampooing gel crème beauté'], ['🧼', 'Savon', 'saboun savon lessive'], ['🪥', 'Dents', 'dentifrice brosse dents'], ['🧻', 'Papier toilette', 'papier toilette mouchoir'],
  ['🧽', 'Éponge', 'éponge ménage nettoyage'], ['🧹', 'Balai', 'balai ménage nettoyage'], ['🧺', 'Lessive', 'linge lessive adoucissant'], ['🗑️', 'Poubelle', 'sac poubelle déchets'],
  ['🧪', 'Produit ménager', 'javel désinfectant nettoyant sol ménage'], ['🪣', 'Seau', 'seau ménage'], ['🧤', 'Gants', 'gants ménage'], ['🌸', 'Parfum', 'parfum désodorisant fleur'],
  ['👶', 'Bébé', 'bébé enfant'], ['🍼', 'Biberon', 'lait bébé biberon'], ['🧷', 'Couches', 'couche bébé diaper'], ['🐾', 'Animal', 'chat chien croquettes'],
  ['💊', 'Pharmacie', 'médicament vitamine santé'], ['🩹', 'Soin', 'pansement pharmacie'], ['🔋', 'Piles', 'pile batterie maison'], ['💡', 'Ampoule', 'lampe ampoule maison'],
  ['📦', 'Autre produit', 'boîte paquet autre'], ['🎁', 'Cadeau', 'cadeau fête'], ['🔥', 'Charbon', 'charbon barbecue feu']
].map(([emoji, label, keywords]) => ({ emoji, label, keywords }))
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
  const [iconSearch, setIconSearch] = useState(initialName)
  const category = useMemo(() => categories.find((item) => item.id === form.category), [form.category])
  const filteredIcons = useMemo(() => {
    const needle = normalize(iconSearch)
    if (!needle) return iconOptions
    const words = needle.split(/\s+/).filter(Boolean)
    return iconOptions.filter((option) => {
      const searchable = normalize(`${option.label} ${option.keywords}`)
      return words.some((word) => searchable.includes(word))
    })
  }, [iconSearch])
  const selectedIcon = iconOptions.find((option) => option.emoji === form.emoji)

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
          <Field label="Nom du produit *"><input value={form.name} onChange={(event) => update('name', event.target.value)} required maxLength={80} placeholder="Ex. Sauce samouraï" className="field-input" /></Field>
          <Field label="Nom Darija / arabe"><input value={form.altName} onChange={(event) => update('altName', event.target.value)} maxLength={80} dir="auto" placeholder="الاسم بالعربية" className="field-input" /></Field>
          <Field label="Marque"><input value={form.brand} onChange={(event) => update('brand', event.target.value)} maxLength={50} placeholder="Ex. Aïcha" className="field-input" /></Field>
          <Field label="Format"><input value={form.format} onChange={(event) => update('format', event.target.value)} maxLength={40} placeholder="Ex. 500 g, pack x6" className="field-input" /></Field>
          <Field label="Catégorie *"><Select value={form.category} onChange={(event) => update('category', event.target.value)}>{categories.map((item) => <option key={item.id} value={item.id}>{item.emoji} {item.name}</option>)}</Select></Field>
          <Field label="Unité *"><Select value={form.unit} onChange={(event) => update('unit', event.target.value)}>{units.map((unit) => <option key={unit}>{unit}</option>)}</Select></Field>
          <Field label="Prix estimé"><div className="relative"><input type="number" min="0" step="0.5" inputMode="decimal" value={form.defaultPrice} onChange={(event) => update('defaultPrice', event.target.value)} placeholder="0" className="field-input pr-14" /><span className="absolute right-4 top-3.5 text-sm font-bold text-muted">DH</span></div></Field>
        </div>

        <fieldset className="mt-5">
          <div className="flex items-center justify-between gap-3"><legend className="text-sm font-bold">Choisir une icône *</legend><span className="rounded-full bg-accent-50 px-3 py-1 text-xs font-extrabold text-accent-700">{form.emoji} {selectedIcon?.label}</span></div>
          <label className="mt-3 flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 bg-canvas px-3 dark:border-slate-700"><Search className="shrink-0 text-muted" size={18} /><span className="sr-only">Rechercher une icône</span><input value={iconSearch} onChange={(event) => setIconSearch(event.target.value)} placeholder="Tomate, lait, ménage, bébé…" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />{iconSearch && <button type="button" onClick={() => setIconSearch('')} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted" aria-label="Effacer la recherche d’icône"><X size={16} /></button>}</label>
          {filteredIcons.length ? <div className="mt-3 grid max-h-52 grid-cols-6 gap-2 overflow-y-auto p-0.5 sm:grid-cols-8">{filteredIcons.map(({ emoji, label }) => <button key={`${emoji}-${label}`} type="button" onClick={() => update('emoji', emoji)} className={`relative grid aspect-square min-h-11 place-items-center rounded-xl text-2xl transition ${form.emoji === emoji ? 'bg-accent-100 ring-2 ring-accent-500' : 'bg-canvas hover:bg-slate-100 dark:hover:bg-slate-800'}`} aria-label={label} title={label} aria-pressed={form.emoji === emoji}>{emoji}{form.emoji === emoji && <Check className="absolute -right-1 -top-1 rounded-full bg-accent-600 p-0.5 text-white" size={15} />}</button>)}</div> : <div className="mt-3 rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-muted dark:border-slate-700">Aucune icône pour « {iconSearch} ». Essayez un autre mot.</div>}
        </fieldset>

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
