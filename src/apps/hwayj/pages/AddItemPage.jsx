import { Camera, Check, ImagePlus, LoaderCircle, Sparkles, WandSparkles } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { usePlatform } from '../../../context/PlatformContext'
import ColorPicker from '../components/ColorPicker'
import HwayjHeader from '../components/HwayjHeader'
import { useWardrobe } from '../context/WardrobeContext'
import { callHwayjAI, getHwayjAIErrorMessage } from '../services/ai'
import { createClothingItem } from '../services/wardrobe'
import { CLOTHING_CATEGORIES, SUBCATEGORY_OPTIONS } from '../utils/clothingTypes'
import { createVisionImage, finalizeImages, hasSafeTransparentMargins, prepareUpload } from '../utils/images'

const seasons = ['Printemps', 'Été', 'Automne', 'Hiver']
const normalizedText = (value) => String(value || '').trim().toLocaleLowerCase('fr-FR').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const validSeasons = (values) => seasons.filter((season) => (Array.isArray(values) ? values : []).some((value) => normalizedText(value) === normalizedText(season)))

export default function AddItemPage() {
  const { user } = useAuth()
  const { notify } = usePlatform()
  const { isOwnWardrobe } = useWardrobe()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [original, setOriginal] = useState('')
  const [processed, setProcessed] = useState('')
  const [generationNotes, setGenerationNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [tags, setTags] = useState({ name: '', category: 'Hauts', subcategory: 'T-shirt', colors: '', pattern: 'Uni', material: '', season: [], style: '', price: '' })

  if (!isOwnWardrobe) return <Navigate to="/hwayj/closet" replace />

  const update = (key, value) => setTags((current) => ({ ...current, [key]: value }))
  const updateCategory = (category) => setTags((current) => ({ ...current, category, subcategory: SUBCATEGORY_OPTIONS[category]?.[0] || 'Autre' }))
  const applyTags = (result) => {
    const ai = result.tags || result
    const category = CLOTHING_CATEGORIES.includes(ai.category) ? ai.category : 'Autre'
    const subcategories = SUBCATEGORY_OPTIONS[category]
    const subcategory = subcategories.includes(ai.subcategory) ? ai.subcategory : subcategories[0]
    setTags((current) => ({ ...current, name: ai.name_suggestion || current.name, category, subcategory, colors: (ai.colors || []).slice(0, 3).join(', '), pattern: ai.pattern || 'Uni', material: ai.material || '', season: validSeasons(ai.season), style: (ai.style || []).slice(0, 6).join(', ') }))
  }

  const processWithGPT = async (source, includeTags = false) => {
    const enhanceJob = (async () => {
      const payload = { image: source, instructions: generationNotes.trim() }
      let result = await callHwayjAI('enhance', payload)
      if (!await hasSafeTransparentMargins(result.image)) {
        result = await callHwayjAI('enhance', {
          ...payload,
          instructions: `Correction obligatoire : la tentative précédente touchait les bords. Dézoome fortement, reconstruis toutes les parties coupées et laisse une marge transparente nette autour du vêtement complet.\n${payload.instructions}`.trim()
        })
      }
      return result
    })()
    const jobs = [enhanceJob]
    if (includeTags) jobs.push(enhanceJob.then((result) => result.image, () => source).then(createVisionImage).then((image) => callHwayjAI('tag', { image })))
    const [imageResult, tagResult] = await Promise.allSettled(jobs)
    if (imageResult.status === 'fulfilled') {
      setProcessed(imageResult.value.image)
    } else {
      setProcessed('')
      setError(`GPT n’a pas pu créer l’image catalogue : ${getHwayjAIErrorMessage(imageResult.reason)} La photo réelle est conservée pour réessayer.`)
    }
    if (tagResult?.status === 'fulfilled') applyTags(tagResult.value)
    else if (tagResult?.status === 'rejected' && imageResult.status === 'fulfilled') setError(`L’image est prête, mais GPT n’a pas pu remplir les informations : ${getHwayjAIErrorMessage(tagResult.reason)} Vous pouvez les saisir manuellement.`)
  }

  const choosePhoto = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const prepared = await prepareUpload(file)
      setOriginal(prepared)
      setProcessed('')
      setStep(2)
    } catch (caught) {
      setError(caught.message === 'IMAGE_TOO_LARGE' ? 'Cette photo reste trop lourde après compression.' : 'Impossible de lire cette photo.')
    } finally {
      setBusy(false)
    }
  }

  const retryGPT = async () => {
    setBusy(true)
    setError('')
    try { await processWithGPT(original, !processed) } finally { setBusy(false) }
  }

  const save = async () => {
    if (!tags.name.trim()) { setError('Donnez un nom au vêtement.'); return }
    setBusy(true)
    setError('')
    try {
      if (!processed) { setError('Générez d’abord l’image catalogue GPT.'); return }
      const images = await finalizeImages(processed)
      const id = await createClothingItem(user.uid, {
        name: tags.name.trim(), category: tags.category, subcategory: tags.subcategory.trim(),
        colors: tags.colors.split(',').map((value) => value.trim()).filter(Boolean).slice(0, 3),
        pattern: tags.pattern.trim(), material: tags.material.trim(), season: validSeasons(tags.season),
        style: tags.style.split(',').map((value) => value.trim()).filter(Boolean),
        price: tags.price === '' ? null : Number(tags.price)
      }, images.image, images.thumb)
      notify('Vêtement ajouté au dressing')
      navigate(`/hwayj/item/${id}`, { replace: true })
    } catch (caught) {
      console.error('Échec de l’enregistrement du vêtement', caught)
      if (caught.code === 'permission-denied') setError('Firebase a refusé les données du vêtement. Vérifiez les champs puis réessayez; si le problème persiste, déployez les dernières règles Firestore.')
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

      {step === 1 && <section className="rounded-[2rem] bg-surface p-6 shadow-card"><div className="text-center"><span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-violet-100 text-violet-700"><Camera size={34} /></span><h2 className="mt-5 text-xl font-black">Choisissez d’abord la photo</h2><p className="mt-2 text-sm leading-6 text-muted">Aucune requête GPT ne partira automatiquement. Vous pourrez vérifier la photo et écrire vos consignes à l’étape suivante.</p></div><div className="mt-6 grid grid-cols-2 gap-3"><label className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-violet-600 px-3 text-center text-sm font-black text-white"><Camera size={20} />Prendre une photo<input type="file" accept="image/*" capture="environment" disabled={busy} onChange={choosePhoto} className="sr-only" /></label><label className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-3 text-center text-sm font-black text-violet-700 dark:border-violet-900 dark:bg-violet-950"><ImagePlus size={20} />Choisir de la galerie<input type="file" accept="image/*" disabled={busy} onChange={choosePhoto} className="sr-only" /></label></div>{busy && <p className="mt-4 flex items-center justify-center gap-2 text-sm font-bold text-violet-700"><LoaderCircle className="animate-spin" size={18} />Compression de la photo…</p>}</section>}

      {step === 2 && <section>{busy ? <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 shadow-xl"><img src={processed || original} alt="Photo envoyée à GPT" className="aspect-[2/3] max-h-[34rem] w-full object-contain opacity-30 blur-sm" /><div className="absolute inset-0 grid place-items-center p-8 text-center text-white"><span><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/15 backdrop-blur"><LoaderCircle className="animate-spin" size={30} /></span><strong className="mt-5 block text-xl">GPT génère le vêtement complet…</strong><small className="mt-2 block leading-5 text-white/70">Vue de face · détails fidèles · aucune partie coupée</small></span></div></div> : processed ? <div className="relative overflow-hidden rounded-[2rem] border-2 border-violet-500 bg-surface p-3 shadow-card"><span className="absolute right-5 top-5 z-10 grid h-9 w-9 place-items-center rounded-full bg-violet-600 text-white"><Check size={20} /></span><div className="grid aspect-[2/3] max-h-[34rem] place-items-center rounded-[1.4rem] bg-slate-50 dark:bg-slate-900"><img src={processed} alt="Vêtement complet généré par GPT" className="h-full w-full object-contain p-3" /></div><div className="px-2 pb-2 pt-4"><strong className="block">Image catalogue GPT</strong><small className="mt-1 block text-muted">Si un détail ne vous plaît pas, écrivez la correction ci-dessous puis relancez. La photo et les informations restent en place.</small></div></div> : <div className="overflow-hidden rounded-[2rem] border border-violet-100 bg-surface p-3 shadow-card dark:border-violet-900"><div className="grid aspect-[2/3] max-h-[30rem] place-items-center rounded-[1.4rem] bg-slate-50 dark:bg-slate-900"><img src={original} alt="Photo choisie" className="h-full w-full object-contain p-3" /></div><div className="px-2 pb-2 pt-4"><strong className="block">Photo prête</strong><small className="mt-1 block text-muted">Vérifiez-la puis ajoutez vos consignes avant d’envoyer la première requête.</small></div></div>}<div className="mt-4 rounded-[1.5rem] bg-surface p-4 shadow-sm"><label htmlFor="garment-generation-notes" className="block text-sm font-black">{processed ? 'Correction à demander à GPT' : 'Consignes pour GPT'} <span className="font-semibold text-muted">· facultatif</span></label><p className="mt-1 text-xs leading-5 text-muted">Ex. « garde exactement les petites rayures », « rends le col plus fidèle » ou « montre le pantalon jusqu’aux chevilles ».</p><textarea id="garment-generation-notes" value={generationNotes} maxLength={600} rows="3" onChange={(event) => setGenerationNotes(event.target.value)} placeholder={processed ? 'Expliquez uniquement ce qu’il faut corriger…' : 'Laissez vide si vous n’avez rien à préciser…'} className="field-input mt-3 min-h-24 resize-y py-3" /><p className="mt-1 text-right text-[10px] font-bold text-muted">{generationNotes.length}/600</p></div><div className="mt-4 grid grid-cols-2 gap-3"><button type="button" disabled={busy} onClick={() => setStep(1)} className="min-h-14 rounded-2xl bg-canvas px-3 text-sm font-black disabled:opacity-60">Changer la photo</button><button type="button" disabled={busy} onClick={retryGPT} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-3 text-sm font-black text-violet-700 disabled:opacity-60 dark:border-violet-900 dark:bg-violet-950"><WandSparkles size={19} />{processed ? 'Corriger avec GPT' : 'Générer avec GPT'}</button></div><button type="button" disabled={busy || !processed} onClick={() => setStep(3)} className="mt-3 min-h-14 w-full rounded-2xl bg-violet-600 font-black text-white disabled:opacity-40">Continuer avec l’image GPT</button></section>}

      {step === 3 && <section className="rounded-[2rem] bg-surface p-5 shadow-card"><div className="flex items-center gap-3"><img src={processed} alt="Aperçu GPT" className="h-24 w-20 rounded-2xl bg-slate-50 object-contain p-1 dark:bg-slate-900" /><div><Sparkles className="text-violet-600" size={22} /><h2 className="mt-2 font-black">Vérifiez les informations</h2><p className="text-xs text-muted">Tous les champs restent modifiables.</p></div></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Nom *" value={tags.name} onChange={(value) => update('name', value)} placeholder="Chemise blanche" /><label><span className="mb-2 block text-sm font-bold">Catégorie</span><select className="field-input" value={tags.category} onChange={(event) => updateCategory(event.target.value)}>{CLOTHING_CATEGORIES.map((value) => <option key={value}>{value}</option>)}</select></label><SubcategoryField category={tags.category} value={tags.subcategory} onChange={(value) => update('subcategory', value)} /><ColorPicker value={tags.colors} onChange={(value) => update('colors', value)} /><Field label="Motif" value={tags.pattern} onChange={(value) => update('pattern', value)} /><Field label="Matière" value={tags.material} onChange={(value) => update('material', value)} placeholder="Coton" /><Field label="Styles" value={tags.style} onChange={(value) => update('style', value)} placeholder="Casual, bureau" /><Field label="Prix en DH" type="number" value={tags.price} onChange={(value) => update('price', value)} placeholder="Facultatif" /></div><div className="mt-5"><span className="mb-2 block text-sm font-bold">Saisons</span><div className="flex flex-wrap gap-2">{seasons.map((value) => <button key={value} type="button" onClick={() => update('season', tags.season.includes(value) ? tags.season.filter((entry) => entry !== value) : [...tags.season, value])} className={`min-h-11 rounded-full px-4 text-sm font-bold ${tags.season.includes(value) ? 'bg-violet-600 text-white' : 'bg-canvas text-muted'}`}>{value}</button>)}</div></div><button type="button" disabled={busy} onClick={save} className="mt-7 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 font-black text-white disabled:opacity-60">{busy ? <LoaderCircle className="animate-spin" size={20} /> : <Check size={20} />}{busy ? 'Enregistrement…' : 'Enregistrer dans mon dressing'}</button></section>}
    </main>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return <label><span className="mb-2 block text-sm font-bold">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="field-input" placeholder={placeholder} /></label>
}

function SubcategoryField({ category, value, onChange }) {
  const options = SUBCATEGORY_OPTIONS[category] || []
  return <label><span className="mb-2 block text-sm font-bold">Type précis</span><select value={options.includes(value) ? value : options[0]} onChange={(event) => onChange(event.target.value)} className="field-input">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select><small className="mt-1 block text-[10px] text-muted">Liste fixe pour placer correctement la pièce dans les tenues.</small></label>
}
