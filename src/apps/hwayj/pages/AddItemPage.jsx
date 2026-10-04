import { Camera, Check, ImagePlus, LoaderCircle, RefreshCw, Sparkles, WandSparkles } from 'lucide-react'
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
import { getWardrobeGender, getWardrobeGenderLabel } from '../utils/profileGender'

const seasons = ['Printemps', 'Été', 'Automne', 'Hiver']
const initialTags = { name: '', category: '', subcategory: '', colors: '', pattern: '', material: '', season: [], style: '', price: '' }
const normalizedText = (value) => String(value || '').trim().toLocaleLowerCase('fr-FR').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const validSeasons = (values) => seasons.filter((season) => (Array.isArray(values) ? values : []).some((value) => normalizedText(value) === normalizedText(season)))

export default function AddItemPage() {
  const { user, profile } = useAuth()
  const { notify } = usePlatform()
  const { isOwnWardrobe } = useWardrobe()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [original, setOriginal] = useState('')
  const [processed, setProcessed] = useState('')
  const [generationNotes, setGenerationNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [tagging, setTagging] = useState(false)
  const [marginWarning, setMarginWarning] = useState(false)
  const [error, setError] = useState('')
  const [tags, setTags] = useState(initialTags)

  if (!isOwnWardrobe) return <Navigate to="/hwayj/closet" replace />

  const update = (key, value) => setTags((current) => ({ ...current, [key]: value }))
  const updateMetadataCategory = (category) => setTags((current) => ({ ...current, category, subcategory: SUBCATEGORY_OPTIONS[category]?.[0] || 'Autre' }))
  const resetGeneratedResult = () => {
    setProcessed('')
    setMarginWarning(false)
    setError('')
  }
  const chooseGenerationCategory = (category) => {
    setTags((current) => ({ ...current, category, subcategory: '' }))
    resetGeneratedResult()
  }
  const chooseGenerationType = (subcategory) => {
    setTags((current) => ({ ...current, subcategory }))
    resetGeneratedResult()
  }
  const applyTags = (result) => {
    const ai = result.tags || result
    setTags((current) => ({
      ...current,
      name: current.name || ai.name_suggestion || '',
      colors: current.colors || (ai.colors || []).slice(0, 3).join(', '),
      pattern: current.pattern || ai.pattern || 'Uni',
      material: current.material || ai.material || '',
      season: current.season.length ? current.season : validSeasons(ai.season),
      style: current.style || (ai.style || []).slice(0, 6).join(', '),
    }))
  }

  const choosePhoto = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const prepared = await prepareUpload(file)
      setOriginal(prepared)
      setProcessed('')
      setMarginWarning(false)
      setStep(1)
    } catch (caught) {
      setError(caught.message === 'IMAGE_TOO_LARGE' ? 'Cette photo reste trop lourde après compression.' : 'Impossible de lire cette photo.')
    } finally {
      setBusy(false)
    }
  }

  const confirmPhoto = () => {
    if (!original) return
    setError('')
    setStep(2)
  }

  const changePhoto = () => {
    setOriginal('')
    setProcessed('')
    setMarginWarning(false)
    setGenerationNotes('')
    setError('')
    setStep(1)
  }

  const generateWithGPT = async () => {
    if (!original || !tags.category || !tags.subcategory) return
    setBusy(true)
    setError('')
    setMarginWarning(false)
    try {
      const result = await callHwayjAI('enhance', {
        image: original,
        category: tags.category,
        subcategory: tags.subcategory,
        gender: getWardrobeGender(profile),
        instructions: generationNotes.trim(),
      })
      setProcessed(result.image)
      setMarginWarning(!await hasSafeTransparentMargins(result.image))
    } catch (caught) {
      setError(`GPT n’a pas pu créer l’image catalogue : ${getHwayjAIErrorMessage(caught)} ${processed ? 'Le résultat précédent est conservé.' : 'La photo réelle est conservée pour réessayer.'}`)
    } finally {
      setBusy(false)
    }
  }

  const acceptGeneratedImage = () => {
    if (!processed) return
    setError('')
    setStep(3)
    setTagging(true)
    createVisionImage(processed)
      .then((image) => callHwayjAI('tag', { image }))
      .then(applyTags)
      .catch((caught) => setError(`L’image est bien gardée, mais GPT n’a pas pu remplir automatiquement ses informations : ${getHwayjAIErrorMessage(caught)} Vous pouvez les saisir manuellement.`))
      .finally(() => setTagging(false))
  }

  const save = async () => {
    if (!tags.name.trim()) { setError('Donnez un nom au vêtement.'); return }
    setBusy(true)
    setError('')
    try {
      if (!processed) { setError('Générez d’abord l’image catalogue GPT.'); return }
      const images = await finalizeImages(processed)
      const id = await createClothingItem(user.uid, {
        name: tags.name.trim(), category: tags.category, subcategory: tags.subcategory,
        colors: tags.colors.split(',').map((value) => value.trim()).filter(Boolean).slice(0, 3),
        pattern: tags.pattern.trim(), material: tags.material.trim(), season: validSeasons(tags.season),
        style: tags.style.split(',').map((value) => value.trim()).filter(Boolean),
        price: tags.price === '' ? null : Number(tags.price),
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

  const canGenerate = Boolean(original && tags.category && tags.subcategory)

  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-32 pt-6 sm:px-6">
      <HwayjHeader title="Ajouter un vêtement" subtitle={`Étape ${step} sur 3`} backTo="/hwayj/closet" />
      <div className="mb-6 flex gap-2">{[1, 2, 3].map((value) => <span key={value} className={`h-1.5 flex-1 rounded-full transition-colors ${value <= step ? 'bg-violet-600' : 'bg-slate-200 dark:bg-slate-800'}`} />)}</div>
      {error && <p role="alert" className="mb-5 rounded-2xl bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800 dark:bg-amber-950 dark:text-amber-200">{error}</p>}

      {step === 1 && <PhotoStep original={original} busy={busy} choosePhoto={choosePhoto} confirmPhoto={confirmPhoto} />}

      {step === 2 && <section className="space-y-4">
        {busy ? <GenerationLoading image={processed || original} retrying={Boolean(processed)} /> : processed ? <GeneratedResult image={processed} category={tags.category} subcategory={tags.subcategory} marginWarning={marginWarning} /> : <SourcePreview image={original} />}

        {!busy && !processed && <section className="rounded-[1.6rem] bg-surface p-5 shadow-card">
          <div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violet-600 text-sm font-black text-white">1</span><div><h2 className="font-black">Quel est ce produit ?</h2><p className="mt-1 text-xs leading-5 text-muted">Le type empêche GPT de confondre une chaussure avec une veste et place ensuite la pièce au bon endroit dans les tenues.</p></div></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label><span className="mb-2 block text-sm font-bold">Catégorie *</span><select className="field-input" value={tags.category} onChange={(event) => chooseGenerationCategory(event.target.value)}><option value="">Choisir…</option>{CLOTHING_CATEGORIES.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label><span className="mb-2 block text-sm font-bold">Type précis *</span><select className="field-input" value={tags.subcategory} disabled={!tags.category} onChange={(event) => chooseGenerationType(event.target.value)}><option value="">Choisir…</option>{(SUBCATEGORY_OPTIONS[tags.category] || []).map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-violet-50 px-4 py-3 text-xs font-bold text-violet-800 dark:bg-violet-950 dark:text-violet-200"><Sparkles size={16} />Silhouette catalogue : {getWardrobeGenderLabel(profile)}</div>
        </section>}

        {!busy && <section className="rounded-[1.6rem] bg-surface p-5 shadow-card">
          <div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violet-600 text-sm font-black text-white">2</span><div><label htmlFor="garment-generation-notes" className="font-black">{processed ? 'Que faut-il corriger ?' : 'Une consigne à ajouter ?'}</label><p className="mt-1 text-xs leading-5 text-muted">Facultatif · GPT garde déjà les couleurs, motifs, coutures, bordures du col, des manches et du bas.</p></div></div>
          <textarea id="garment-generation-notes" value={generationNotes} maxLength={600} rows="3" onChange={(event) => setGenerationNotes(event.target.value)} placeholder={processed ? 'Ex. « garde la bordure blanche du col exactement comme sur la photo »…' : 'Laissez vide si la photo suffit…'} className="field-input mt-4 min-h-24 resize-y py-3" />
          <p className="mt-1 text-right text-[10px] font-bold text-muted">{generationNotes.length}/600</p>
        </section>}

        {!busy && !processed && (canGenerate ? <button type="button" onClick={generateWithGPT} className="flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 font-black text-white shadow-lg shadow-violet-600/20"><WandSparkles size={22} />Générer l’image catalogue</button> : <p className="rounded-2xl border border-dashed border-violet-300 bg-violet-50/60 p-4 text-center text-sm font-bold text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-200">Choisissez la catégorie et le type précis pour afficher le bouton de génération.</p>)}

        {!busy && processed && <div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={generateWithGPT} className="flex min-h-16 items-center justify-center gap-2 rounded-2xl border-2 border-violet-200 bg-surface px-4 font-black text-violet-700 dark:border-violet-800 dark:text-violet-300"><RefreshCw size={21} />Réessayer</button><button type="button" onClick={acceptGeneratedImage} className="flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 font-black text-white shadow-lg shadow-emerald-600/20"><Check size={22} />Garder cette image</button></div>}

        {!busy && <div className="grid grid-cols-2 gap-3"><button type="button" onClick={changePhoto} className="min-h-12 rounded-2xl bg-canvas px-3 text-sm font-black">Changer la photo</button>{processed && <button type="button" onClick={resetGeneratedResult} className="min-h-12 rounded-2xl bg-canvas px-3 text-sm font-black">Modifier le type</button>}</div>}
      </section>}

      {step === 3 && <section className="rounded-[2rem] bg-surface p-5 shadow-card">
        <div className="flex items-center gap-3"><img src={processed} alt="Aperçu GPT retenu" className="h-24 w-20 rounded-2xl bg-slate-50 object-contain p-1 dark:bg-slate-900" /><div><span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><Check size={13} />Image gardée</span><h2 className="mt-2 font-black">Vérifiez les informations</h2><p className="text-xs text-muted">Tous les champs restent modifiables.</p></div></div>
        {tagging && <p className="mt-4 flex items-center gap-2 rounded-2xl bg-violet-50 p-3 text-xs font-bold text-violet-700 dark:bg-violet-950 dark:text-violet-200"><LoaderCircle className="animate-spin" size={16} />GPT remplit les couleurs et les détails en arrière-plan…</p>}
        <div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Nom *" value={tags.name} onChange={(value) => update('name', value)} placeholder="Chemise blanche" /><label><span className="mb-2 block text-sm font-bold">Catégorie</span><select className="field-input" value={tags.category} onChange={(event) => updateMetadataCategory(event.target.value)}>{CLOTHING_CATEGORIES.map((value) => <option key={value}>{value}</option>)}</select></label><SubcategoryField category={tags.category} value={tags.subcategory} onChange={(value) => update('subcategory', value)} /><ColorPicker value={tags.colors} onChange={(value) => update('colors', value)} /><Field label="Motif" value={tags.pattern} onChange={(value) => update('pattern', value)} /><Field label="Matière" value={tags.material} onChange={(value) => update('material', value)} placeholder="Coton" /><Field label="Styles" value={tags.style} onChange={(value) => update('style', value)} placeholder="Casual, bureau" /><Field label="Prix en DH" type="number" value={tags.price} onChange={(value) => update('price', value)} placeholder="Facultatif" /></div>
        <div className="mt-5"><span className="mb-2 block text-sm font-bold">Saisons</span><div className="flex flex-wrap gap-2">{seasons.map((value) => <button key={value} type="button" onClick={() => update('season', tags.season.includes(value) ? tags.season.filter((entry) => entry !== value) : [...tags.season, value])} className={`min-h-11 rounded-full px-4 text-sm font-bold ${tags.season.includes(value) ? 'bg-violet-600 text-white' : 'bg-canvas text-muted'}`}>{value}</button>)}</div></div>
        <button type="button" onClick={() => setStep(2)} disabled={busy} className="mt-6 min-h-12 w-full rounded-2xl bg-canvas text-sm font-black text-muted">Revoir ou réessayer l’image</button>
        <button type="button" disabled={busy || tagging} onClick={save} className="mt-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 font-black text-white disabled:opacity-60">{busy ? <LoaderCircle className="animate-spin" size={20} /> : <Check size={20} />}{busy ? 'Enregistrement…' : tagging ? 'Analyse des détails…' : 'Enregistrer dans mon dressing'}</button>
      </section>}
    </main>
  )
}

function PhotoStep({ original, busy, choosePhoto, confirmPhoto }) {
  if (!original) return <section className="rounded-[2rem] bg-surface p-6 shadow-card"><div className="text-center"><span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-violet-100 text-violet-700"><Camera size={34} /></span><h2 className="mt-5 text-xl font-black">Choisissez une photo</h2><p className="mt-2 text-sm leading-6 text-muted">Prenez l’article seul et bien éclairé. Rien ne sera envoyé à GPT avant votre confirmation.</p></div><PhotoInputs busy={busy} choosePhoto={choosePhoto} />{busy && <BusyPhoto />}</section>
  return <section className="rounded-[2rem] bg-surface p-4 shadow-card sm:p-5"><div className="relative grid max-h-[32rem] min-h-72 place-items-center overflow-hidden rounded-[1.5rem] bg-slate-50 dark:bg-slate-900"><img src={original} alt="Photo à confirmer" className="max-h-[32rem] w-full object-contain p-3" />{busy && <div className="absolute inset-0 grid place-items-center bg-slate-950/55 text-white"><BusyPhoto /></div>}</div><div className="px-1 pb-1 pt-5"><span className="rounded-full bg-violet-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-violet-700">Photo prête</span><h2 className="mt-3 text-xl font-black">C’est bien cette photo ?</h2><p className="mt-1 text-sm leading-6 text-muted">Vérifiez qu’il s’agit du bon article avant de continuer.</p><div className="mt-5 grid grid-cols-2 gap-3"><label className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-canvas px-3 text-sm font-black"><ImagePlus size={19} />Remplacer<input type="file" accept="image/*" disabled={busy} onChange={choosePhoto} className="sr-only" /></label><button type="button" disabled={busy} onClick={confirmPhoto} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-3 text-sm font-black text-white disabled:opacity-60"><Check size={20} />Confirmer</button></div></div></section>
}

function PhotoInputs({ busy, choosePhoto }) {
  return <div className="mt-6 grid grid-cols-2 gap-3"><label className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-violet-600 px-3 text-center text-sm font-black text-white"><Camera size={20} />Prendre une photo<input type="file" accept="image/*" capture="environment" disabled={busy} onChange={choosePhoto} className="sr-only" /></label><label className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-3 text-center text-sm font-black text-violet-700 dark:border-violet-900 dark:bg-violet-950"><ImagePlus size={20} />Galerie<input type="file" accept="image/*" disabled={busy} onChange={choosePhoto} className="sr-only" /></label></div>
}

function BusyPhoto() {
  return <p className="flex items-center justify-center gap-2 p-4 text-sm font-bold"><LoaderCircle className="animate-spin" size={18} />Préparation de la photo…</p>
}

function SourcePreview({ image }) {
  return <div className="overflow-hidden rounded-[2rem] border border-violet-100 bg-surface p-3 shadow-card dark:border-violet-900"><div className="grid max-h-80 min-h-56 place-items-center rounded-[1.4rem] bg-slate-50 dark:bg-slate-900"><img src={image} alt="Photo confirmée" className="max-h-80 w-full object-contain p-3" /></div><div className="px-2 pb-2 pt-4"><strong className="block">Photo confirmée</strong><small className="mt-1 block text-muted">Choisissez maintenant le type exact avant la génération.</small></div></div>
}

function GenerationLoading({ image, retrying }) {
  return <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 shadow-xl"><img src={image} alt="Image en cours de génération" className="max-h-[34rem] min-h-80 w-full object-contain opacity-30 blur-sm" /><div className="absolute inset-0 grid place-items-center p-8 text-center text-white"><span><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/15 backdrop-blur"><LoaderCircle className="animate-spin" size={30} /></span><strong className="mt-5 block text-xl">{retrying ? 'GPT prépare une nouvelle version…' : 'GPT prépare l’image boutique…'}</strong><small className="mt-2 block leading-5 text-white/70">Une seule génération · article complet · détails fidèles</small></span></div></div>
}

function GeneratedResult({ image, category, subcategory, marginWarning }) {
  return <div className="relative overflow-hidden rounded-[2rem] border-2 border-emerald-500 bg-surface p-3 shadow-card"><span className="absolute right-5 top-5 z-10 grid h-10 w-10 place-items-center rounded-full bg-emerald-600 text-white shadow-lg"><Check size={21} /></span><div className="grid min-h-80 max-h-[36rem] place-items-center rounded-[1.4rem] bg-slate-50 dark:bg-slate-900"><img src={image} alt="Résultat catalogue GPT" className="max-h-[36rem] w-full object-contain p-3" /></div><div className="px-2 pb-2 pt-4"><div className="flex flex-wrap items-center gap-2"><strong>Résultat GPT</strong><span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-black text-violet-700 dark:bg-violet-950 dark:text-violet-200">{category} · {subcategory}</span></div><small className="mt-2 block leading-5 text-muted">Regardez bien le col, les manches, les bordures, le motif et la forme avant de décider.</small>{marginWarning && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-800 dark:bg-amber-950 dark:text-amber-200">L’article touche peut-être un bord. Ajoutez « laisse plus de marge » puis appuyez sur Réessayer.</p>}</div></div>
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return <label><span className="mb-2 block text-sm font-bold">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="field-input" placeholder={placeholder} /></label>
}

function SubcategoryField({ category, value, onChange }) {
  const options = SUBCATEGORY_OPTIONS[category] || []
  return <label><span className="mb-2 block text-sm font-bold">Type précis</span><select value={options.includes(value) ? value : options[0]} onChange={(event) => onChange(event.target.value)} className="field-input">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select><small className="mt-1 block text-[10px] text-muted">Ce type détermine sa place dans le carrousel des tenues.</small></label>
}
