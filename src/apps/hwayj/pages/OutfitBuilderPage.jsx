import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, ChevronLeft, ChevronRight, LoaderCircle, Plus, RotateCcw, Save, Sparkles, Tag, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePlatform } from '../../../context/PlatformContext'
import HwayjHeader from '../components/HwayjHeader'
import ClothingImage, { preloadNormalizedClothingImage } from '../components/ClothingImage'
import ManualOutfitPreview from '../components/ManualOutfitPreview'
import ManualOutfitSaveModal from '../components/ManualOutfitSaveModal'
import { useWardrobe } from '../context/WardrobeContext'
import { callHwayjAI, getHwayjAIErrorMessage } from '../services/ai'
import { getClothingImage, getOutfitImage, saveOutfit } from '../services/wardrobe'
import { wardrobeBySlot } from '../utils/clothingTypes'
import { createVisionImage, finalizeOutfitImage, hasSafeTransparentMargins } from '../utils/images'
import { getWardrobeGender } from '../utils/profileGender'
import { normalizeManualOutfitLayout } from '../utils/manualOutfitLayout'

const MotionButton = motion.button

export default function OutfitBuilderPage() {
  const { outfitId } = useParams()
  const { clothes, outfits } = useWardrobe()
  const outfit = outfits.find((entry) => entry.id === outfitId)
  const editorKey = outfitId ? (outfit ? `outfit-${outfit.id}` : `pending-${outfitId}`) : `new-outfit-${clothes.length ? 'ready' : 'empty'}`
  return <OutfitComposer key={editorKey} outfitId={outfitId} outfit={outfit} clothes={clothes} />
}

function OutfitComposer({ outfitId, outfit, clothes }) {
  const { notify } = usePlatform()
  const navigate = useNavigate()
  const { ownerId, ownerProfile, isOwnWardrobe } = useWardrobe()
  const slots = useMemo(() => wardrobeBySlot(clothes), [clothes])
  const tops = useMemo(() => [...slots.top, ...slots.outer], [slots])
  const savedIds = useMemo(() => (outfit?.items || []).map((entry) => entry.itemId).filter((id) => clothes.some((item) => item.id === id)), [clothes, outfit])
  const savedTop = outfit?.items?.find((entry) => entry.slot === 'top')?.itemId || savedIds.find((id) => tops.some((item) => item.id === id))
  const savedBottom = outfit?.items?.find((entry) => entry.slot === 'bottom')?.itemId || savedIds.find((id) => slots.bottom.some((item) => item.id === id))
  const [type, setType] = useState(() => outfit?.mode === 'ai' ? 'ai' : 'manual')
  const [manual, setManual] = useState(() => ({ top: savedTop || tops[0]?.id, bottom: savedBottom || slots.bottom[0]?.id }))
  const [manualLayout, setManualLayout] = useState(() => normalizeManualOutfitLayout(outfit?.manualLayout))
  const [aiItems, setAiItems] = useState(() => outfit?.mode === 'ai' ? savedIds : [])
  const [aiPreview, setAiPreview] = useState(() => outfit?.previewThumb || '')
  const [aiPreviewThumb, setAiPreviewThumb] = useState(() => outfit?.previewThumb || '')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  const [details, setDetails] = useState(() => ({ name: outfit?.name || '', occasion: outfit?.occasion || 'Casual', season: outfit?.season || 'Toutes saisons' }))
  const [generationNotes, setGenerationNotes] = useState(() => outfit?.generationNotes || '')
  const [directions, setDirections] = useState({})
  const [generating, setGenerating] = useState(false)
  const [generationError, setGenerationError] = useState('')
  const [saving, setSaving] = useState(false)
  const swipeStarts = useRef({})
  const pendingCycles = useRef({})

  useEffect(() => {
    if (!outfit?.id || outfit.mode !== 'ai') return undefined
    let cancelled = false
    getOutfitImage(ownerId, outfit.id).then((image) => {
      if (!image || cancelled) return
      setAiPreview(image)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [outfit?.id, outfit?.mode, ownerId])

  const selectedItem = (slot) => clothes.find((item) => item.id === manual[slot])
  const choices = (slot) => slot === 'top' ? tops : slots.bottom

  useEffect(() => {
    const warmNeighbours = (slot, available, selectedId) => {
      if (available.length < 2 || !selectedId) return
      const index = available.findIndex((item) => item.id === selectedId)
      if (index < 0) return
      const neighbours = [available[(index + 1) % available.length], available[(index - 1 + available.length) % available.length]]
      neighbours.forEach((item) => preloadNormalizedClothingImage(ownerId, item, slot))
    }
    warmNeighbours('top', tops, manual.top)
    warmNeighbours('bottom', slots.bottom, manual.bottom)
  }, [manual.bottom, manual.top, ownerId, slots.bottom, tops])

  const cycle = async (slot, direction) => {
    const available = choices(slot)
    if (!available.length) return
    const index = available.findIndex((item) => item.id === manual[slot])
    const nextIndex = (Math.max(index, direction > 0 ? -1 : 0) + direction + available.length) % available.length
    const nextItem = available[nextIndex]
    const requestId = (pendingCycles.current[slot] || 0) + 1
    pendingCycles.current[slot] = requestId
    await preloadNormalizedClothingImage(ownerId, nextItem, slot)
    if (pendingCycles.current[slot] !== requestId) return
    setDirections((current) => ({ ...current, [slot]: direction }))
    setManual((current) => ({ ...current, [slot]: nextItem.id }))
  }
  const swipeArea = (slot) => ({
    onTouchStart: (event) => { swipeStarts.current[slot] = event.touches[0].clientX },
    onTouchEnd: (event) => {
      const distance = event.changedTouches[0].clientX - swipeStarts.current[slot]
      if (Math.abs(distance) > 35) cycle(slot, distance < 0 ? 1 : -1)
    },
  })

  const resetAiPreview = () => {
    setAiPreview('')
    setAiPreviewThumb('')
    setGenerationError('')
  }
  const addAiItem = (id) => {
    setAiItems((current) => current.includes(id) || current.length >= 4 ? current : [...current, id])
    resetAiPreview()
    setPickerOpen(false)
  }
  const removeAiItem = (id) => {
    setAiItems((current) => current.filter((itemId) => itemId !== id))
    resetAiPreview()
  }
  const clear = () => {
    if (type === 'manual') setManual({ top: undefined, bottom: undefined })
    else {
      setAiItems([])
      resetAiPreview()
      setPickerOpen(false)
    }
  }

  const generateAiLook = async () => {
    if (aiItems.length < 2) return
    setGenerating(true)
    setGenerationError('')
    try {
      const selected = aiItems.map((id) => clothes.find((item) => item.id === id)).filter(Boolean)
      const maxCharsPerImage = Math.floor(1150000 / selected.length)
      const images = await Promise.all(selected.map(async (item) => createVisionImage(await getClothingImage(ownerId, item.id) || item.thumb, { maxChars: maxCharsPerImage })))
      const payload = {
        images,
        names: selected.map((item) => item.name),
        garments: selected.map(({ name, category, subcategory, colors, pattern, material }) => ({ name, category, subcategory, colors, pattern, material })),
        gender: getWardrobeGender(ownerProfile),
        instructions: generationNotes.trim()
      }
      let result = await callHwayjAI('compose', payload)
      if (!await hasSafeTransparentMargins(result.image)) {
        result = await callHwayjAI('compose', {
          ...payload,
          instructions: `Correction obligatoire : la tentative précédente touchait les bords. Dézoome fortement et laisse une marge transparente nette autour de la tenue complète.\n${payload.instructions}`.trim()
        })
      }
      const prepared = await finalizeOutfitImage(result.image)
      setAiPreview(prepared.image)
      setAiPreviewThumb(prepared.thumb)
      notify('Look complexe généré')
    } catch (error) {
      const message = getHwayjAIErrorMessage(error)
      setGenerationError(message)
      notify(message)
    } finally {
      setGenerating(false)
    }
  }

  const openSave = () => {
    if (!isOwnWardrobe) return
    setDetails((current) => ({ ...current, name: current.name || (type === 'manual' ? 'Haut + bas' : 'Look IA') }))
    setSaveOpen(true)
  }

  const save = async () => {
    const itemIds = type === 'manual' ? [manual.top, manual.bottom].filter(Boolean) : aiItems
    if ((type === 'manual' && itemIds.length < 2) || (type === 'ai' && (!aiPreview || itemIds.length < 2))) return
    setSaving(true)
    try {
      const fittedLayout = normalizeManualOutfitLayout(manualLayout)
      const items = itemIds.map((itemId, index) => {
        const slot = type === 'manual' ? (index === 0 ? 'top' : 'bottom') : 'complex'
        const fittedPart = type === 'manual' ? fittedLayout[slot] : null
        return { itemId, slot, x: fittedPart?.x ?? 50, y: fittedPart?.y ?? 150, scale: fittedPart?.scale ?? 1, rotation: 0, z: type === 'manual' ? (fittedLayout.front === slot ? 2 : 1) : index + 1 }
      })
      await saveOutfit(ownerId, {
        name: details.name.trim() || (type === 'manual' ? 'Haut + bas' : 'Look IA'),
        occasion: details.occasion,
        season: details.season,
        mode: type,
        items,
        manualLayout: type === 'manual' ? fittedLayout : null,
        ...(type === 'ai' ? { previewImage: aiPreview, previewThumb: aiPreviewThumb || aiPreview, generationNotes: generationNotes.trim() } : { previewThumb: null, generationNotes: '' }),
      }, outfitId)
      notify('Tenue enregistrée')
      navigate('/hwayj/outfits', { replace: true })
    } catch {
      notify('Impossible d’enregistrer cette tenue')
    } finally {
      setSaving(false)
    }
  }

  const canSave = type === 'manual' ? Boolean(manual.top && manual.bottom) : Boolean(aiPreview && aiItems.length >= 2)

  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-32 pt-6 sm:px-6">
      <HwayjHeader title="Composer" subtitle={type === 'manual' ? 'Un haut + un bas, simplement' : 'Les looks complexes avec GPT'} backTo="/hwayj/outfits" />
      {!isOwnWardrobe && <div className="mb-4 rounded-2xl bg-violet-50 p-4 text-sm font-bold text-violet-800 dark:bg-violet-950 dark:text-violet-200">Vous explorez le dressing de {ownerProfile?.displayName || 'votre partenaire'}. Revenez sur votre profil pour créer et enregistrer une tenue.</div>}
      <div className="mb-4 grid grid-cols-2 rounded-2xl bg-surface p-1 shadow-sm"><button type="button" onClick={() => setType('manual')} className={`min-h-12 rounded-xl text-sm font-black ${type === 'manual' ? 'bg-violet-600 text-white' : 'text-muted'}`}>Manuel · Haut + bas</button><button type="button" onClick={() => setType('ai')} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl text-sm font-black ${type === 'ai' ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white' : 'text-muted'}`}><Sparkles size={17} />Look IA</button></div>
      {type === 'ai' && <section className="mb-4 rounded-[1.5rem] border border-violet-200 bg-surface p-4 shadow-sm dark:border-violet-900"><label htmlFor="generation-notes" className="flex items-center gap-2 text-sm font-black"><Sparkles size={17} className="text-violet-600" />{aiPreview ? 'Correction du look' : 'Consignes pour GPT'} <span className="font-semibold text-muted">· facultatif</span></label><p className="mt-1 text-xs leading-5 text-muted">{aiPreview ? 'Le résultat actuel reste visible. Décrivez ce qu’il faut corriger puis relancez avec les mêmes vêtements.' : 'Ex. « laisse la veste ouverte », « rentre le haut dans le pantalon » ou « garde exactement les rayures fines ».'}</p><textarea id="generation-notes" value={generationNotes} maxLength={600} rows="3" onChange={(event) => setGenerationNotes(event.target.value)} placeholder={aiPreview ? 'Ex. « garde tout mais allonge légèrement le pantalon »…' : 'Ajoutez seulement les détails importants pour ce look…'} className="field-input mt-3 min-h-24 resize-y py-3" /><p className="mt-1 text-right text-[10px] font-bold text-muted">{generationNotes.length}/600</p></section>}
      {type === 'manual' ? <ManualLook ownerId={ownerId} manual={manual} selectedItem={selectedItem} cycle={cycle} swipeArea={swipeArea} directions={directions} clear={clear} /> : <AiLook ownerId={ownerId} clothes={clothes} itemIds={aiItems} preview={aiPreview} pickerOpen={pickerOpen} setPickerOpen={setPickerOpen} addItem={addAiItem} removeItem={removeAiItem} clear={clear} generate={generateAiLook} generating={generating} readOnly={!isOwnWardrobe} />}
      {type === 'ai' && generationError && <div role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold leading-6 text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-200"><span className="block text-[10px] font-black uppercase tracking-widest text-red-500">Pourquoi la génération a échoué</span>{generationError}</div>}
      <button type="button" onClick={openSave} disabled={!canSave || !isOwnWardrobe} className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 font-black text-white disabled:opacity-40"><Save size={20} />{isOwnWardrobe ? (type === 'manual' ? 'Enregistrer cette tenue' : 'Enregistrer ce look IA') : 'Lecture seule'}</button>
      {saveOpen && (type === 'manual' ? <ManualOutfitSaveModal ownerId={ownerId} top={selectedItem('top')} bottom={selectedItem('bottom')} layout={manualLayout} setLayout={setManualLayout} details={details} setDetails={setDetails} saving={saving} onClose={() => setSaveOpen(false)} onSave={save} /> : <SaveOutfitModal ownerId={ownerId} type={type} aiPreview={aiPreview} details={details} setDetails={setDetails} saving={saving} onClose={() => setSaveOpen(false)} onSave={save} />)}
    </main>
  )
}

function ManualLook({ manual, selectedItem, cycle, swipeArea, directions, clear }) {
  return <section className="relative overflow-hidden rounded-[2rem] border border-violet-100 bg-gradient-to-b from-violet-50 via-white to-slate-50 px-3 pb-4 pt-3 shadow-card dark:border-violet-950 dark:from-violet-950/40 dark:via-slate-900 dark:to-slate-950"><div className="flex items-center justify-between gap-3 px-2"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-500">Mode manuel</p><p className="mt-0.5 text-xs font-semibold text-muted">Silhouette alignée automatiquement</p></div><button type="button" onClick={clear} disabled={!manual.top && !manual.bottom} className="flex min-h-11 items-center gap-2 rounded-xl bg-white px-3 text-xs font-black text-slate-600 shadow-sm disabled:opacity-40 dark:bg-slate-900 dark:text-slate-300"><RotateCcw size={16} />Effacer</button></div><div className="relative mx-auto mt-2 h-[28rem] max-w-sm"><div className="absolute left-1/2 top-[12.2rem] h-px w-20 -translate-x-1/2 bg-violet-200/70 dark:bg-violet-800/50" /><div {...swipeArea('top')} className="absolute inset-x-0 top-[1rem] h-[11.2rem] touch-pan-y"><PreviewArrows onPrevious={() => cycle('top', -1)} onNext={() => cycle('top', 1)} label="Changer le haut" /><GarmentImage item={selectedItem('top')} slot="top" direction={directions.top} className="absolute inset-x-[12%] h-full" /></div><div {...swipeArea('bottom')} className="absolute inset-x-0 top-[12.25rem] h-[14.75rem] touch-pan-y"><PreviewArrows onPrevious={() => cycle('bottom', -1)} onNext={() => cycle('bottom', 1)} label="Changer le bas" /><GarmentImage item={selectedItem('bottom')} slot="bottom" direction={directions.bottom} className="absolute inset-x-[12%] h-full" /></div>{!manual.top && !manual.bottom && <p className="absolute inset-0 grid place-items-center text-center text-sm font-bold text-muted">Utilisez les flèches pour recommencer</p>}</div><div className="flex items-center justify-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-violet-300" /><span className="h-1.5 w-5 rounded-full bg-violet-600" /><span className="h-1.5 w-1.5 rounded-full bg-violet-300" /><small className="ml-1 font-bold text-muted">Swipe gauche / droite</small></div></section>
}

function AiLook({ clothes, itemIds, preview, pickerOpen, setPickerOpen, addItem, removeItem, clear, generate, generating, readOnly }) {
  const selected = itemIds.map((id) => clothes.find((item) => item.id === id)).filter(Boolean)
  const available = clothes.filter((item) => !itemIds.includes(item.id) && !item.isComposite)
  return <><section className="rounded-[2rem] bg-gradient-to-br from-violet-600 to-fuchsia-600 p-5 text-white shadow-xl"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><Sparkles size={22} /><h2 className="font-black">Composition complexe</h2></div><p className="mt-1 text-xs leading-5 text-white/75">Choisissez uniquement les pièces. GPT les habille ensemble sans décider à votre place.</p></div><button type="button" onClick={clear} disabled={!itemIds.length || readOnly} className="flex min-h-10 items-center gap-1 rounded-xl bg-white/15 px-3 text-xs font-black disabled:opacity-40"><RotateCcw size={15} />Effacer</button></div><div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4">{selected.map((item, index) => <article key={item.id} className="relative rounded-2xl bg-white/15 p-2"><span className="absolute left-2 top-2 z-10 grid h-5 w-5 place-items-center rounded-full bg-white text-[10px] font-black text-violet-700">{index + 1}</span>{!readOnly && <button type="button" onClick={() => removeItem(item.id)} className="absolute right-1 top-1 z-10 grid h-7 w-7 place-items-center rounded-full bg-slate-950/40" aria-label={`Retirer ${item.name}`}><X size={14} /></button>}<img src={item.thumb} alt={item.name} className="aspect-square w-full rounded-xl bg-white/90 object-contain p-1" /><strong className="mt-2 block truncate text-[10px]">{item.name}</strong></article>)}{!readOnly && itemIds.length < 4 && <button type="button" onClick={() => setPickerOpen(true)} className="grid min-h-28 place-items-center rounded-2xl border-2 border-dashed border-white/40 bg-white/10"><span><Plus className="mx-auto" size={25} /><small className="mt-2 block font-black">Ajouter</small></span></button>}</div><button type="button" onClick={generate} disabled={generating || itemIds.length < 2 || readOnly} className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white font-black text-violet-700 disabled:opacity-50">{generating ? <LoaderCircle className="animate-spin" size={20} /> : <Sparkles size={20} />}{readOnly ? 'Lecture seule' : generating ? 'GPT assemble les pièces…' : preview ? 'Corriger / régénérer ce look' : 'Générer ce look'}</button></section>{preview && <section className="mt-4 rounded-[2rem] bg-surface p-4 shadow-card"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-widest text-violet-600">Résultat conservé</p><h3 className="font-black">Votre look assemblé</h3></div><Sparkles className="text-violet-600" /></div><div className="mt-3 grid min-h-80 place-items-center rounded-2xl bg-canvas p-3"><img src={preview} alt="Look généré" className="block max-h-[36rem] max-w-full object-contain" /></div><p className="mt-3 text-xs leading-5 text-muted">Vous pouvez modifier les consignes plus haut puis relancer. Les vêtements sélectionnés et ce résultat restent visibles jusqu’à la nouvelle génération.</p></section>}{pickerOpen && <section className="mt-4 rounded-[1.75rem] bg-surface p-4 shadow-card"><div className="flex items-center justify-between"><div><h3 className="font-black">Ajouter une pièce</h3><p className="text-xs text-muted">{4 - itemIds.length} place{4 - itemIds.length > 1 ? 's' : ''} restante{4 - itemIds.length > 1 ? 's' : ''}</p></div><button type="button" onClick={() => setPickerOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-canvas"><X size={17} /></button></div><div className="no-scrollbar mt-4 grid max-h-80 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">{available.map((item) => <button key={item.id} type="button" onClick={() => addItem(item.id)} className="min-w-0 rounded-xl bg-canvas p-2 text-left"><img src={item.thumb} alt="" className="aspect-square w-full object-contain" /><small className="mt-1 block truncate font-bold">{item.name}</small></button>)}</div></section>}</>
}

function SaveOutfitModal({ ownerId, type, top, bottom, aiPreview, details, setDetails, saving, onClose, onSave }) {
  const update = (field, value) => setDetails((current) => ({ ...current, [field]: value }))
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="save-outfit-title"><button type="button" className="absolute inset-0" onClick={onClose} aria-label="Fermer" /><section className="relative max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-[2rem] bg-surface p-5 shadow-2xl sm:rounded-[2rem] sm:p-6"><div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200 sm:hidden" /><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-600">Dernière étape</p><h2 id="save-outfit-title" className="mt-1 text-xl font-black">Enregistrer la tenue</h2><p className="mt-1 text-sm text-muted">Vérifiez le look et ajoutez ses informations.</p></div><button type="button" onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-canvas" aria-label="Fermer"><X size={19} /></button></div><div className="mt-5 grid min-h-64 place-items-center overflow-hidden rounded-[1.5rem] bg-gradient-to-b from-violet-50 to-slate-50 p-3 dark:from-violet-950/40 dark:to-slate-950">{type === 'ai' ? <img src={aiPreview} alt="Aperçu complet du look" className="block max-h-[25rem] max-w-full object-contain" /> : <ManualOutfitPreview ownerId={ownerId} top={top} bottom={bottom} className="h-72 w-48" />}</div><div className="mt-5 space-y-3"><label className="block"><span className="mb-2 flex items-center gap-2 text-sm font-black"><Tag size={16} className="text-violet-600" />Nom de la tenue</span><input className="field-input" value={details.name} onChange={(event) => update('name', event.target.value)} placeholder="Ex. Look weekend" maxLength={60} /></label><div className="grid grid-cols-2 gap-3"><label><span className="mb-2 block text-sm font-black">Occasion</span><select className="field-input" value={details.occasion} onChange={(event) => update('occasion', event.target.value)}><option>Casual</option><option>Travail</option><option>Sortie</option><option>Soirée</option><option>Sport</option><option>Maison</option><option>Toute occasion</option></select></label><label><span className="mb-2 flex items-center gap-2 text-sm font-black"><CalendarDays size={16} className="text-violet-600" />Saison</span><select className="field-input" value={details.season} onChange={(event) => update('season', event.target.value)}><option>Toutes saisons</option><option>Printemps</option><option>Été</option><option>Automne</option><option>Hiver</option></select></label></div></div><button type="button" onClick={onSave} disabled={saving || !details.name.trim()} className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 font-black text-white disabled:opacity-50">{saving ? <LoaderCircle className="animate-spin" size={20} /> : <Save size={20} />}{saving ? 'Enregistrement…' : 'Confirmer et voir mes tenues'}</button></section></div>
}

function GarmentImage({ item, slot, direction = 1, className }) {
  const { ownerId } = useWardrobe()
  return <AnimatePresence initial={false} mode="popLayout">{item && <MotionButton key={item.id} type="button" initial={{ x: direction * 85, opacity: 0, scale: 0.96 }} animate={{ x: 0, opacity: 1, scale: 1 }} exit={{ x: direction * -85, opacity: 0, scale: 0.96 }} transition={{ type: 'spring', stiffness: 310, damping: 29 }} className={className} aria-label={item.name}><ClothingImage ownerId={ownerId} item={item} normalizedSlot={slot} className="h-full w-full object-contain" /></MotionButton>}</AnimatePresence>
}

function PreviewArrows({ onPrevious, onNext, label }) {
  return <><button type="button" onClick={onPrevious} className="absolute left-0 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-violet-700 shadow-md backdrop-blur dark:bg-slate-900/90" aria-label={`${label}, précédent`}><ChevronLeft size={22} /></button><button type="button" onClick={onNext} className="absolute right-0 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-violet-700 shadow-md backdrop-blur dark:bg-slate-900/90" aria-label={`${label}, suivant`}><ChevronRight size={22} /></button></>
}
