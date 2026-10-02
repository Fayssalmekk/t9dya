import { Camera, Check, ImagePlus, LoaderCircle, Sparkles, WandSparkles } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { usePlatform } from '../../../context/PlatformContext'
import ColorPicker from '../components/ColorPicker'
import HwayjHeader from '../components/HwayjHeader'
import { useWardrobe } from '../context/WardrobeContext'
import { callHwayjAI } from '../services/ai'
import { createClothingItem } from '../services/wardrobe'
import { SUBCATEGORY_OPTIONS } from '../utils/clothingTypes'
import { createVisionImage, finalizeImages, prepareUpload } from '../utils/images'

const categories = ['Hauts', 'Bas', 'Robes', 'Vestes', 'Chaussures', 'Accessoires', 'Sport', 'Autre']
const seasons = ['Printemps', 'Été', 'Automne', 'Hiver']

export default function AddItemPage() {
  const { user } = useAuth()
  const { notify } = usePlatform()
  const { isOwnWardrobe } = useWardrobe()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [original, setOriginal] = useState('')
  const [processed, setProcessed] = useState('')
  const [selectedImage, setSelectedImage] = useState('processed')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [tags, setTags] = useState({ name: '', category: 'Hauts', subcategory: '', colors: '', pattern: 'Uni', material: '', season: [], style: '', price: '' })

  if (!isOwnWardrobe) return <Navigate to="/hwayj/closet" replace />

  const update = (key, value) => setTags((current) => ({ ...current, [key]: value }))
  const applyTags = (result) => {
    const ai = result.tags || result
    setTags((current) => ({ ...current, name: ai.name_suggestion || current.name, category: ai.category || current.category, subcategory: ai.subcategory || '', colors: (ai.colors || []).join(', '), pattern: ai.pattern || 'Uni', material: ai.material || '', season: ai.season || [], style: (ai.style || []).join(', ') }))
  }

  const processWithGPT = async (source, includeTags = false) => {
    const enhanceJob = callHwayjAI('enhance', { image: source })
    const jobs = [enhanceJob]
    if (includeTags) jobs.push(enhanceJob.then((result) => result.image, () => source).then(createVisionImage).then((image) => callHwayjAI('tag', { image })))
    const [imageResult, tagResult] = await Promise.allSettled(jobs)
    if (imageResult.status === 'fulfilled') {
      setProcessed(imageResult.value.image)
      setSelectedImage('processed')
    } else {
      setProcessed(source)
      setSelectedImage('original')
      setError('GPT n’a pas pu préparer l’image. Vous pouvez garder la photo originale ou réessayer.')
    }
    if (tagResult?.status === 'fulfilled') applyTags(tagResult.value)
  }

  const choosePhoto = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const prepared = await prepareUpload(file)
      setOriginal(prepared)
      setProcessed(prepared)
      setStep(2)
      await processWithGPT(prepared, true)
    } catch (caught) {
      setError(caught.message === 'IMAGE_TOO_LARGE' ? 'Cette photo reste trop lourde après compression.' : 'Impossible de lire cette photo.')
    } finally {
      setBusy(false)
    }
  }

  const retryGPT = async () => {
    setBusy(true)
    setError('')
    try { await processWithGPT(original, false) } finally { setBusy(false) }
  }

  const save = async () => {
    if (!tags.name.trim()) { setError('Donnez un nom au vêtement.'); return }
    setBusy(true)
    setError('')
    try {
      const source = selectedImage === 'original' ? original : processed
      const images = await finalizeImages(source)
      const id = await createClothingItem(user.uid, {
        name: tags.name.trim(), category: tags.category, subcategory: tags.subcategory.trim(),
        colors: tags.colors.split(',').map((value) => value.trim()).filter(Boolean),
        pattern: tags.pattern.trim(), material: tags.material.trim(), season: tags.season,
        style: tags.style.split(',').map((value) => value.trim()).filter(Boolean),
        price: tags.price === '' ? null : Number(tags.price)
      }, images.image, images.thumb)
      notify('Vêtement ajouté au dressing')
      navigate(`/hwayj/item/${id}`, { replace: true })
    } catch (caught) {
      console.error('Échec de l’enregistrement du vêtement', caught)
      if (caught.code === 'permission-denied') setError('Firebase refuse l’enregistrement. Déployez les règles Firestore Hwayj sur le projet t9dya-5e85a.')
      else if (['unavailable', 'deadline-exceeded'].includes(caught.code)) setError('Firebase est momentanément inaccessible. Vérifiez la connexion puis réessayez.')
      else if (caught.code === 'resource-exhausted' || ['IMAGE_TOO_LARGE', 'THUMB_TOO_LARGE'].includes(caught.message)) setError('L’image reste trop lourde pour Firebase. Choisissez une photo moins grande.')
      else setError(`Impossible d’enregistrer${caught.code ? ` (${caught.code})` : ''}. Réessayez ou consultez la console.`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-32 pt-6 sm:px-6">
      <HwayjHeader title="Ajouter un vêtement" subtitle={`Étape ${step} sur 3`} backTo="/hwayj/closet" />
      <div className="mb-6 flex gap-2">{[1, 2, 3].map((value) => <span key={value} className={`h-1.5 flex-1 rounded-full ${value <= step ? 'bg-violet-600' : 'bg-slate-200 dark:bg-slate-800'}`} />)}</div>
      {error && <p className="mb-5 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-200">{error}</p>}

      {step === 1 && <section className="rounded-[2rem] bg-surface p-6 text-center shadow-card"><span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-violet-100 text-violet-700"><Camera size={34} /></span><h2 className="mt-5 text-xl font-black">Photographiez votre vêtement</h2><p className="mt-2 text-sm leading-6 text-muted">Posez-le à plat avec une bonne lumière. La photo est compressée puis GPT crée automatiquement une présentation propre et détourée.</p><label className="mt-7 flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-violet-600 font-black text-white"><ImagePlus size={21} />Choisir ou prendre une photo<input type="file" accept="image/*" capture="environment" onChange={choosePhoto} className="sr-only" /></label>{busy && <p className="mt-4 flex items-center justify-center gap-2 text-sm font-bold text-violet-700"><LoaderCircle className="animate-spin" size={18} />GPT prépare le vêtement et analyse ses tags…</p>}</section>}

      {step === 2 && <section><div className="grid grid-cols-2 gap-3">{[{ key: 'original', label: 'Photo originale', image: original }, { key: 'processed', label: 'Préparé par GPT', image: processed }].map((choice) => <button key={choice.key} type="button" onClick={() => setSelectedImage(choice.key)} className={`relative overflow-hidden rounded-[1.75rem] border-2 bg-surface p-2 ${selectedImage === choice.key ? 'border-violet-600' : 'border-transparent'}`}><span className="grid aspect-[4/5] place-items-center rounded-[1.3rem] bg-slate-50 dark:bg-slate-900"><img src={choice.image} alt={choice.label} className="h-full w-full object-contain p-2" /></span><strong className="block p-3 text-sm">{choice.label}</strong>{selectedImage === choice.key && <Check className="absolute right-4 top-4 rounded-full bg-violet-600 p-1 text-white" size={25} />}</button>)}</div><button type="button" disabled={busy} onClick={retryGPT} className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 font-black text-violet-700 disabled:opacity-60 dark:border-violet-900 dark:bg-violet-950"><WandSparkles size={21} />{busy ? 'Traitement GPT en cours…' : 'Relancer la préparation GPT'}</button><button type="button" onClick={() => setStep(3)} className="mt-3 min-h-14 w-full rounded-2xl bg-violet-600 font-black text-white">Continuer avec cette image</button></section>}

      {step === 3 && <section className="rounded-[2rem] bg-surface p-5 shadow-card"><div className="flex items-center gap-3"><img src={selectedImage === 'original' ? original : processed} alt="Aperçu" className="h-24 w-20 rounded-2xl bg-slate-50 object-contain p-1 dark:bg-slate-900" /><div><Sparkles className="text-violet-600" size={22} /><h2 className="mt-2 font-black">Vérifiez les informations</h2><p className="text-xs text-muted">Tous les champs restent modifiables.</p></div></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Nom *" value={tags.name} onChange={(value) => update('name', value)} placeholder="Chemise blanche" /><label><span className="mb-2 block text-sm font-bold">Catégorie</span><select className="field-input" value={tags.category} onChange={(event) => update('category', event.target.value)}>{categories.map((value) => <option key={value}>{value}</option>)}</select></label><SubcategoryField category={tags.category} value={tags.subcategory} onChange={(value) => update('subcategory', value)} /><ColorPicker value={tags.colors} onChange={(value) => update('colors', value)} /><Field label="Motif" value={tags.pattern} onChange={(value) => update('pattern', value)} /><Field label="Matière" value={tags.material} onChange={(value) => update('material', value)} placeholder="Coton" /><Field label="Styles" value={tags.style} onChange={(value) => update('style', value)} placeholder="Casual, bureau" /><Field label="Prix en DH" type="number" value={tags.price} onChange={(value) => update('price', value)} placeholder="Facultatif" /></div><div className="mt-5"><span className="mb-2 block text-sm font-bold">Saisons</span><div className="flex flex-wrap gap-2">{seasons.map((value) => <button key={value} type="button" onClick={() => update('season', tags.season.includes(value) ? tags.season.filter((entry) => entry !== value) : [...tags.season, value])} className={`min-h-11 rounded-full px-4 text-sm font-bold ${tags.season.includes(value) ? 'bg-violet-600 text-white' : 'bg-canvas text-muted'}`}>{value}</button>)}</div></div><button type="button" disabled={busy} onClick={save} className="mt-7 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 font-black text-white disabled:opacity-60">{busy ? <LoaderCircle className="animate-spin" size={20} /> : <Check size={20} />}{busy ? 'Enregistrement…' : 'Enregistrer dans mon dressing'}</button></section>}
    </main>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return <label><span className="mb-2 block text-sm font-bold">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="field-input" placeholder={placeholder} /></label>
}

function SubcategoryField({ category, value, onChange }) {
  const options = SUBCATEGORY_OPTIONS[category] || []
  return <label><span className="mb-2 block text-sm font-bold">Type précis</span><input list="hwayj-subcategories" value={value} onChange={(event) => onChange(event.target.value)} className="field-input" placeholder="Ex. Chemise, manteau…" /><datalist id="hwayj-subcategories">{options.map((option) => <option key={option} value={option} />)}</datalist><small className="mt-1 block text-[10px] text-muted">Important pour placer la pièce au bon niveau de la tenue.</small></label>
}
