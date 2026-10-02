import { Heart, LoaderCircle, Shirt, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { usePlatform } from '../../../context/PlatformContext'
import HwayjHeader from '../components/HwayjHeader'
import { useWardrobe } from '../context/WardrobeContext'
import { getClothingImage, markClothingWorn, removeClothingItem, restoreClothingItem, updateClothingItem } from '../services/wardrobe'

export default function ItemDetailPage() {
  const { itemId } = useParams()
  const { clothes, loading, ownerId, ownerProfile, isOwnWardrobe } = useWardrobe()
  const { notify } = usePlatform()
  const navigate = useNavigate()
  const item = clothes.find((entry) => entry.id === itemId)
  const [image, setImage] = useState('')
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (!item) return undefined

    let cancelled = false
    getClothingImage(ownerId, item.id).then((value) => {
      if (!cancelled) setImage(value)
    })

    return () => { cancelled = true }
  }, [item, ownerId])
  if (loading) return <main className="grid min-h-dvh place-items-center"><LoaderCircle className="animate-spin text-violet-600" /></main>
  if (!item) return <Navigate to="/hwayj/closet" replace />

  const save = async (form) => { await updateClothingItem(ownerId, item.id, { ...form, colors: form.colors.split(',').map((value) => value.trim()).filter(Boolean), style: form.style.split(',').map((value) => value.trim()).filter(Boolean), price: form.price === '' ? null : Number(form.price) }); setEditing(false); notify('Informations mises à jour') }
  const remove = async () => { if (!window.confirm(`Supprimer « ${item.name} » ?`)) return; const backup = await removeClothingItem(ownerId, item.id); navigate('/hwayj/closet'); notify('Vêtement supprimé', { label: 'Annuler', onClick: () => restoreClothingItem(ownerId, item.id, backup) }) }
  const statusOptions = [{ value: 'clean', label: 'Propre' }, { value: 'dirty', label: 'À laver' }, { value: 'laundry', label: 'En machine' }]

  return <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-32 pt-6 sm:px-6"><HwayjHeader title={item.name} subtitle={item.category} backTo="/hwayj/closet" /><section className="relative grid min-h-96 place-items-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-50 to-violet-100 p-5 dark:from-slate-900 dark:to-violet-950/60">{image ? <img src={image} alt={item.name} className="max-h-[28rem] w-full object-contain" /> : <img src={item.thumb} alt={item.name} className="h-48 w-48 object-contain blur-sm" />}{isOwnWardrobe && <button type="button" onClick={() => updateClothingItem(ownerId, item.id, { favorite: !item.favorite })} className="absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-2xl bg-white/90 text-rose-500 shadow-lg" aria-label="Favori"><Heart fill={item.favorite ? 'currentColor' : 'none'} /></button>}</section><section className="mt-4 rounded-[1.75rem] bg-surface p-5 shadow-card">{isOwnWardrobe ? <><div className="grid grid-cols-2 gap-3"><button type="button" onClick={async () => { await markClothingWorn(ownerId, item.id); notify('Tenue du jour enregistrée') }} className="min-h-14 rounded-2xl bg-violet-600 px-3 font-black text-white"><Shirt className="mr-2 inline" size={19} />Porté aujourd’hui</button><button type="button" onClick={() => setEditing((value) => !value)} className="min-h-14 rounded-2xl bg-canvas px-3 font-black">{editing ? 'Fermer' : 'Modifier'}</button></div></> : <p className="rounded-2xl bg-violet-50 p-4 text-sm font-bold text-violet-800 dark:bg-violet-950 dark:text-violet-200">Vêtement de {ownerProfile?.displayName || 'votre partenaire'} · lecture seule</p>}<div className="mt-4 grid grid-cols-3 gap-2 text-center"><Stat label="Porté" value={`${item.wearCount || 0}×`} /><Stat label="État" value={statusOptions.find((entry) => entry.value === item.status)?.label} /><Stat label="Coût/port" value={item.price && item.wearCount ? `${(item.price / item.wearCount).toFixed(0)} DH` : '—'} /></div>{isOwnWardrobe && <div className="mt-5 flex gap-2">{statusOptions.map((status) => <button key={status.value} type="button" onClick={() => updateClothingItem(ownerId, item.id, { status: status.value })} className={`min-h-11 flex-1 rounded-xl px-2 text-xs font-bold ${item.status === status.value ? 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200' : 'bg-canvas text-muted'}`}>{status.label}</button>)}</div>}</section>{isOwnWardrobe && editing && <ItemEditForm key={item.id} item={item} onSave={save} />}{isOwnWardrobe && <button type="button" onClick={remove} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 font-bold text-red-700 dark:border-red-900 dark:bg-red-950"><Trash2 size={18} />Supprimer ce vêtement</button>}</main>
}

function ItemEditForm({ item, onSave }) {
  const [form, setForm] = useState(() => ({
    name: item.name,
    category: item.category,
    subcategory: item.subcategory || '',
    colors: (item.colors || []).join(', '),
    material: item.material || '',
    pattern: item.pattern || '',
    style: (item.style || []).join(', '),
    price: item.price ?? '',
  }))

  return <section className="mt-4 rounded-[1.75rem] bg-surface p-5 shadow-card"><div className="grid gap-4 sm:grid-cols-2">{Object.entries({ name: 'Nom', category: 'Catégorie', subcategory: 'Sous-catégorie', colors: 'Couleurs', material: 'Matière', pattern: 'Motif', style: 'Styles', price: 'Prix' }).map(([key, label]) => <label key={key}><span className="mb-2 block text-sm font-bold">{label}</span><input type={key === 'price' ? 'number' : 'text'} value={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} className="field-input" /></label>)}</div><button type="button" onClick={() => onSave(form)} className="mt-5 min-h-12 w-full rounded-xl bg-violet-600 font-black text-white">Enregistrer</button></section>
}

function Stat({ label, value }) {
  return <div className="rounded-2xl bg-canvas p-3"><small className="text-muted">{label}</small><strong className="mt-1 block text-sm">{value}</strong></div>
}
