import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, LoaderCircle, Plus, RotateCcw, Save, Sparkles, X } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { usePlatform } from '../../../context/PlatformContext'
import HwayjHeader from '../components/HwayjHeader'
import { useWardrobe } from '../context/WardrobeContext'
import { callHwayjAI } from '../services/ai'
import { getClothingImage, saveOutfit } from '../services/wardrobe'
import { wardrobeBySlot } from '../utils/clothingTypes'
import { createVisionImage, finalizeImages } from '../utils/images'

const MotionButton = motion.button

export default function OutfitBuilderPage() {
  const { outfitId } = useParams()
  const { clothes, outfits } = useWardrobe()
  const outfit = outfits.find((entry) => entry.id === outfitId)
  const editorKey = outfitId ? (outfit ? `outfit-${outfit.id}` : `pending-${outfitId}`) : `new-outfit-${clothes.length ? 'ready' : 'empty'}`
  return <OutfitComposer key={editorKey} outfitId={outfitId} outfit={outfit} clothes={clothes} />
}

function OutfitComposer({ outfitId, outfit, clothes }) {
  const { user } = useAuth()
  const { notify } = usePlatform()
  const navigate = useNavigate()
  const slots = useMemo(() => wardrobeBySlot(clothes), [clothes])
  const tops = useMemo(() => [...slots.top, ...slots.outer], [slots])
  const savedIds = useMemo(() => (outfit?.items || []).map((entry) => entry.itemId).filter((id) => clothes.some((item) => item.id === id)), [clothes, outfit])
  const savedTop = outfit?.items?.find((entry) => entry.slot === 'top')?.itemId || savedIds.find((id) => tops.some((item) => item.id === id))
  const savedBottom = outfit?.items?.find((entry) => entry.slot === 'bottom')?.itemId || savedIds.find((id) => slots.bottom.some((item) => item.id === id))
  const [type, setType] = useState(() => outfit?.mode === 'ai' ? 'ai' : 'manual')
  const [manual, setManual] = useState(() => ({ top: savedTop || tops[0]?.id, bottom: savedBottom || slots.bottom[0]?.id }))
  const [aiItems, setAiItems] = useState(() => outfit?.mode === 'ai' ? savedIds : [])
  const [aiPreview, setAiPreview] = useState(() => outfit?.previewThumb || '')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [directions, setDirections] = useState({})
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const swipeStarts = useRef({})

  const selectedItem = (slot) => clothes.find((item) => item.id === manual[slot])
  const choices = (slot) => slot === 'top' ? tops : slots.bottom
  const cycle = (slot, direction) => {
    const available = choices(slot)
    if (!available.length) return
    const index = available.findIndex((item) => item.id === manual[slot])
    const nextIndex = (Math.max(index, direction > 0 ? -1 : 0) + direction + available.length) % available.length
    setDirections((current) => ({ ...current, [slot]: direction }))
    setManual((current) => ({ ...current, [slot]: available[nextIndex].id }))
  }
  const swipeArea = (slot) => ({
    onTouchStart: (event) => { swipeStarts.current[slot] = event.touches[0].clientX },
    onTouchEnd: (event) => {
      const distance = event.changedTouches[0].clientX - swipeStarts.current[slot]
      if (Math.abs(distance) > 35) cycle(slot, distance < 0 ? 1 : -1)
    },
  })

  const addAiItem = (id) => {
    setAiItems((current) => current.includes(id) || current.length >= 4 ? current : [...current, id])
    setAiPreview('')
    setPickerOpen(false)
  }
  const removeAiItem = (id) => {
    setAiItems((current) => current.filter((itemId) => itemId !== id))
    setAiPreview('')
  }
  const clear = () => {
    if (type === 'manual') setManual({ top: undefined, bottom: undefined })
    else { setAiItems([]); setAiPreview(''); setPickerOpen(false) }
  }

  const generateAiLook = async () => {
    if (aiItems.length < 2) return
    setGenerating(true)
    try {
      const selected = aiItems.map((id) => clothes.find((item) => item.id === id)).filter(Boolean)
      const images = await Promise.all(selected.map(async (item) => createVisionImage(await getClothingImage(user.uid, item.id) || item.thumb)))
      const result = await callHwayjAI('compose', { images, names: selected.map((item) => item.name) })
      const prepared = await finalizeImages(result.image)
      setAiPreview(prepared.thumb)
      notify('Look complexe généré')
    } catch (error) {
      notify(error.message === 'credit_balance_exhausted' ? 'Crédits OpenAI insuffisants' : 'Génération GPT indisponible')
    } finally { setGenerating(false) }
  }

  const save = async () => {
    const itemIds = type === 'manual' ? [manual.top, manual.bottom].filter(Boolean) : aiItems
    if ((type === 'manual' && itemIds.length < 2) || (type === 'ai' && (!aiPreview || itemIds.length < 2))) return
    setSaving(true)
    try {
      const items = itemIds.map((itemId, index) => ({ itemId, slot: type === 'manual' ? (index === 0 ? 'top' : 'bottom') : 'complex', x: 50, y: type === 'manual' ? (index === 0 ? 100 : 240) : 150, scale: 1, rotation: 0, z: index + 1 }))
      const id = await saveOutfit(user.uid, { name: type === 'manual' ? 'Haut + bas' : 'Look IA', occasion: 'Toute occasion', season: 'Toutes saisons', mode: type, items, ...(type === 'ai' ? { previewThumb: aiPreview } : {}) }, outfitId)
      notify('Tenue enregistrée')
      navigate(`/hwayj/outfits/${id}`, { replace: true })
    } finally { setSaving(false) }
  }

  const hasManualLook = Boolean(manual.top && manual.bottom)
  const canSave = type === 'manual' ? hasManualLook : Boolean(aiPreview && aiItems.length >= 2)

  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-32 pt-6 sm:px-6">
      <HwayjHeader title="Composer" subtitle={type === 'manual' ? 'Un haut + un bas, simplement' : 'Les looks complexes avec GPT'} backTo="/hwayj/outfits" />

      <div className="mb-4 grid grid-cols-2 rounded-2xl bg-surface p-1 shadow-sm"><button type="button" onClick={() => setType('manual')} className={`min-h-12 rounded-xl text-sm font-black ${type === 'manual' ? 'bg-violet-600 text-white' : 'text-muted'}`}>Manuel · Haut + bas</button><button type="button" onClick={() => setType('ai')} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl text-sm font-black ${type === 'ai' ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white' : 'text-muted'}`}><Sparkles size={17} />Look IA</button></div>

      {type === 'manual' ? <ManualLook manual={manual} selectedItem={selectedItem} cycle={cycle} swipeArea={swipeArea} directions={directions} clear={clear} /> : <AiLook clothes={clothes} itemIds={aiItems} preview={aiPreview} pickerOpen={pickerOpen} setPickerOpen={setPickerOpen} addItem={addAiItem} removeItem={removeAiItem} clear={clear} generate={generateAiLook} generating={generating} />}

      <button type="button" onClick={save} disabled={saving || !canSave} className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 font-black text-white disabled:opacity-40">{saving ? <LoaderCircle className="animate-spin" size={20} /> : <Save size={20} />}{type === 'manual' ? 'Enregistrer cette tenue' : 'Enregistrer ce look IA'}</button>
    </main>
  )
}

function ManualLook({ manual, selectedItem, cycle, swipeArea, directions, clear }) {
  return <section className="relative overflow-hidden rounded-[2rem] border border-violet-100 bg-gradient-to-b from-violet-50 via-white to-slate-50 px-3 pb-4 pt-3 shadow-card dark:border-violet-950 dark:from-violet-950/40 dark:via-slate-900 dark:to-slate-950"><div className="flex items-center justify-between gap-3 px-2"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-500">Mode manuel</p><p className="mt-0.5 text-xs font-semibold text-muted">Chaque partie reste indépendante</p></div><button type="button" onClick={clear} disabled={!manual.top && !manual.bottom} className="flex min-h-11 items-center gap-2 rounded-xl bg-white px-3 text-xs font-black text-slate-600 shadow-sm disabled:opacity-40 dark:bg-slate-900 dark:text-slate-300"><RotateCcw size={16} />Effacer</button></div><div className="relative mx-auto mt-2 h-[28rem] max-w-sm"><div {...swipeArea('top')} className="absolute inset-x-0 top-0 h-[11.25rem] touch-pan-y"><PreviewArrows onPrevious={() => cycle('top', -1)} onNext={() => cycle('top', 1)} label="Changer le haut" /><GarmentImage item={selectedItem('top')} direction={directions.top} className="absolute inset-x-[15%] h-full" /></div><div {...swipeArea('bottom')} className="absolute inset-x-0 top-[11.75rem] h-[13.75rem] touch-pan-y"><PreviewArrows onPrevious={() => cycle('bottom', -1)} onNext={() => cycle('bottom', 1)} label="Changer le bas" /><GarmentImage item={selectedItem('bottom')} direction={directions.bottom} className="absolute inset-x-[16%] h-full" /></div>{!manual.top && !manual.bottom && <p className="absolute inset-0 grid place-items-center text-center text-sm font-bold text-muted">Utilisez les flèches pour recommencer</p>}</div><div className="flex items-center justify-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-violet-300" /><span className="h-1.5 w-5 rounded-full bg-violet-600" /><span className="h-1.5 w-1.5 rounded-full bg-violet-300" /><small className="ml-1 font-bold text-muted">Swipe gauche / droite</small></div></section>
}

function AiLook({ clothes, itemIds, preview, pickerOpen, setPickerOpen, addItem, removeItem, clear, generate, generating }) {
  const selected = itemIds.map((id) => clothes.find((item) => item.id === id)).filter(Boolean)
  const available = clothes.filter((item) => !itemIds.includes(item.id) && !item.isComposite)
  return <><section className="rounded-[2rem] bg-gradient-to-br from-violet-600 to-fuchsia-600 p-5 text-white shadow-xl"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><Sparkles size={22} /><h2 className="font-black">Composition complexe</h2></div><p className="mt-1 text-xs leading-5 text-white/75">Choisissez uniquement les pièces. GPT les habille ensemble sans décider à votre place.</p></div><button type="button" onClick={clear} disabled={!itemIds.length} className="flex min-h-10 items-center gap-1 rounded-xl bg-white/15 px-3 text-xs font-black disabled:opacity-40"><RotateCcw size={15} />Effacer</button></div><div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4">{selected.map((item, index) => <article key={item.id} className="relative rounded-2xl bg-white/15 p-2"><span className="absolute left-2 top-2 z-10 grid h-5 w-5 place-items-center rounded-full bg-white text-[10px] font-black text-violet-700">{index + 1}</span><button type="button" onClick={() => removeItem(item.id)} className="absolute right-1 top-1 z-10 grid h-7 w-7 place-items-center rounded-full bg-slate-950/40" aria-label={`Retirer ${item.name}`}><X size={14} /></button><img src={item.thumb} alt={item.name} className="aspect-square w-full rounded-xl bg-white/90 object-contain p-1" /><strong className="mt-2 block truncate text-[10px]">{item.name}</strong></article>)}{itemIds.length < 4 && <button type="button" onClick={() => setPickerOpen(true)} className="grid min-h-28 place-items-center rounded-2xl border-2 border-dashed border-white/40 bg-white/10"><span><Plus className="mx-auto" size={25} /><small className="mt-2 block font-black">Ajouter</small></span></button>}</div><button type="button" onClick={generate} disabled={generating || itemIds.length < 2} className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white font-black text-violet-700 disabled:opacity-50">{generating ? <LoaderCircle className="animate-spin" size={20} /> : <Sparkles size={20} />}{generating ? 'GPT assemble les pièces…' : 'Générer ce look'}</button></section>{preview && <section className="mt-4 rounded-[2rem] bg-surface p-4 shadow-card"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-widest text-violet-600">Résultat</p><h3 className="font-black">Votre look assemblé</h3></div><Sparkles className="text-violet-600" /></div><img src={preview} alt="Look généré" className="mx-auto mt-3 aspect-[4/5] max-h-[30rem] w-full rounded-2xl bg-canvas object-contain" /></section>}{pickerOpen && <section className="mt-4 rounded-[1.75rem] bg-surface p-4 shadow-card"><div className="flex items-center justify-between"><div><h3 className="font-black">Ajouter une pièce</h3><p className="text-xs text-muted">{4 - itemIds.length} place{4 - itemIds.length > 1 ? 's' : ''} restante{4 - itemIds.length > 1 ? 's' : ''}</p></div><button type="button" onClick={() => setPickerOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-canvas"><X size={17} /></button></div><div className="no-scrollbar mt-4 grid max-h-80 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">{available.map((item) => <button key={item.id} type="button" onClick={() => addItem(item.id)} className="min-w-0 rounded-xl bg-canvas p-2 text-left"><img src={item.thumb} alt="" className="aspect-square w-full object-contain" /><small className="mt-1 block truncate font-bold">{item.name}</small></button>)}</div></section>}</>
}

function GarmentImage({ item, direction = 1, className }) {
  return <AnimatePresence initial={false} mode="popLayout">{item && <MotionButton key={item.id} type="button" initial={{ x: direction * 85, opacity: 0, scale: 0.96 }} animate={{ x: 0, opacity: 1, scale: 1 }} exit={{ x: direction * -85, opacity: 0, scale: 0.96 }} transition={{ type: 'spring', stiffness: 310, damping: 29 }} className={className} aria-label={item.name}><img src={item.thumb} alt={item.name} draggable="false" className="h-full w-full object-contain" /></MotionButton>}</AnimatePresence>
}

function PreviewArrows({ onPrevious, onNext, label }) {
  return <><button type="button" onClick={onPrevious} className="absolute left-0 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-violet-700 shadow-md backdrop-blur dark:bg-slate-900/90" aria-label={`${label}, précédent`}><ChevronLeft size={22} /></button><button type="button" onClick={onNext} className="absolute right-0 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-violet-700 shadow-md backdrop-blur dark:bg-slate-900/90" aria-label={`${label}, suivant`}><ChevronRight size={22} /></button></>
}
