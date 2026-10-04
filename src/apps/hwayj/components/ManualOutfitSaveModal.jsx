import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CalendarDays, Layers3, LoaderCircle, Minus, Move, Plus, RotateCcw, Save, Tag, X } from 'lucide-react'
import ManualOutfitPreview from './ManualOutfitPreview'
import { DEFAULT_MANUAL_OUTFIT_LAYOUT, normalizeManualOutfitLayout, resetManualOutfitPart } from '../utils/manualOutfitLayout'

const SLOT_LABELS = { top: 'Haut', bottom: 'Bas' }

const pointDistance = ([first, second]) => Math.hypot(second.x - first.x, second.y - first.y)
const pointCenter = ([first, second]) => ({ x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 })

export default function ManualOutfitSaveModal({ ownerId, top, bottom, layout, setLayout, details, setDetails, saving, onClose, onSave }) {
  const update = (field, value) => setDetails((current) => ({ ...current, [field]: value }))

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="manual-outfit-save-title">
    <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Fermer" />
    <section className="relative max-h-[94dvh] w-full max-w-xl overflow-y-auto rounded-t-[2rem] bg-surface p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-[2rem] sm:p-6">
      <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700 sm:hidden" />
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-600">Studio tenue</p><h2 id="manual-outfit-save-title" className="mt-1 text-xl font-black">Ajuster avant d’enregistrer</h2><p className="mt-1 text-sm leading-5 text-muted">Choisissez le haut ou le bas, puis déplacez et redimensionnez la pièce.</p></div>
        <button type="button" onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-canvas" aria-label="Fermer"><X size={19} /></button>
      </div>

      <OutfitFitEditor ownerId={ownerId} top={top} bottom={bottom} layout={layout} onChange={setLayout} />

      <div className="mt-5 space-y-3">
        <label className="block"><span className="mb-2 flex items-center gap-2 text-sm font-black"><Tag size={16} className="text-violet-600" />Nom de la tenue</span><input className="field-input" value={details.name} onChange={(event) => update('name', event.target.value)} placeholder="Ex. Look weekend" maxLength={60} /></label>
        <div className="grid grid-cols-2 gap-3"><label><span className="mb-2 block text-sm font-black">Occasion</span><select className="field-input" value={details.occasion} onChange={(event) => update('occasion', event.target.value)}><option>Casual</option><option>Travail</option><option>Sortie</option><option>Soirée</option><option>Sport</option><option>Maison</option><option>Toute occasion</option></select></label><label><span className="mb-2 flex items-center gap-2 text-sm font-black"><CalendarDays size={16} className="text-violet-600" />Saison</span><select className="field-input" value={details.season} onChange={(event) => update('season', event.target.value)}><option>Toutes saisons</option><option>Printemps</option><option>Été</option><option>Automne</option><option>Hiver</option></select></label></div>
      </div>
      <button type="button" onClick={onSave} disabled={saving || !details.name.trim()} className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 font-black text-white shadow-lg shadow-violet-200 disabled:opacity-50 dark:shadow-none">{saving ? <LoaderCircle className="animate-spin" size={20} /> : <Save size={20} />}{saving ? 'Enregistrement…' : 'Enregistrer exactement comme ça'}</button>
    </section>
  </div>
}

function OutfitFitEditor({ ownerId, top, bottom, layout, onChange }) {
  const [selectedSlot, setSelectedSlot] = useState('top')
  const surfaceRef = useRef(null)
  const pointers = useRef(new Map())
  const gesture = useRef(null)
  const currentLayout = normalizeManualOutfitLayout(layout)
  const layoutRef = useRef(currentLayout)
  const selectedPart = currentLayout[selectedSlot]

  useEffect(() => {
    layoutRef.current = normalizeManualOutfitLayout(layout)
  }, [layout])

  const commit = (nextLayout) => {
    const normalized = normalizeManualOutfitLayout(nextLayout)
    layoutRef.current = normalized
    onChange(normalized)
  }
  const changeSelected = (changes) => commit({ ...layoutRef.current, [selectedSlot]: { ...layoutRef.current[selectedSlot], ...changes } })
  const resetAll = () => commit(DEFAULT_MANUAL_OUTFIT_LAYOUT)

  const beginDrag = (point) => {
    gesture.current = { mode: 'drag', point, part: { ...layoutRef.current[selectedSlot] } }
  }
  const beginPinch = () => {
    const points = [...pointers.current.values()].slice(0, 2)
    gesture.current = {
      mode: 'pinch',
      distance: Math.max(1, pointDistance(points)),
      center: pointCenter(points),
      part: { ...layoutRef.current[selectedSlot] },
    }
  }
  const handlePointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    const point = { x: event.clientX, y: event.clientY }
    pointers.current.set(event.pointerId, point)
    if (pointers.current.size >= 2) beginPinch()
    else beginDrag(point)
  }
  const handlePointerMove = (event) => {
    if (!pointers.current.has(event.pointerId) || !surfaceRef.current) return
    event.preventDefault()
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const bounds = surfaceRef.current.getBoundingClientRect()
    if (pointers.current.size >= 2) {
      if (gesture.current?.mode !== 'pinch') beginPinch()
      const points = [...pointers.current.values()].slice(0, 2)
      const center = pointCenter(points)
      const start = gesture.current
      changeSelected({
        x: start.part.x + ((center.x - start.center.x) / bounds.width) * 100,
        y: start.part.y + ((center.y - start.center.y) / bounds.height) * 100,
        scale: start.part.scale * (pointDistance(points) / start.distance),
      })
      return
    }
    if (gesture.current?.mode !== 'drag') beginDrag([...pointers.current.values()][0])
    const point = [...pointers.current.values()][0]
    const start = gesture.current
    changeSelected({
      x: start.part.x + ((point.x - start.point.x) / bounds.width) * 100,
      y: start.part.y + ((point.y - start.point.y) / bounds.height) * 100,
    })
  }
  const handlePointerEnd = (event) => {
    pointers.current.delete(event.pointerId)
    if (pointers.current.size === 1) beginDrag([...pointers.current.values()][0])
    else if (!pointers.current.size) gesture.current = null
  }
  const nudge = (x, y) => changeSelected({ x: selectedPart.x + x, y: selectedPart.y + y })

  return <div className="mt-5 rounded-[1.75rem] border border-violet-100 bg-canvas p-3 dark:border-violet-900">
    <div className="grid grid-cols-2 gap-2">{['top', 'bottom'].map((slot) => { const item = slot === 'top' ? top : bottom; const active = selectedSlot === slot; return <button key={slot} type="button" onClick={() => setSelectedSlot(slot)} className={`flex min-h-12 items-center gap-2 rounded-xl px-3 text-left transition ${active ? 'bg-violet-600 text-white shadow-md' : 'bg-surface text-ink'}`}><img src={item?.thumb} alt="" className="h-9 w-9 shrink-0 rounded-lg bg-white object-contain p-0.5" /><span className="min-w-0"><small className={`block text-[9px] font-black uppercase tracking-widest ${active ? 'text-white/70' : 'text-muted'}`}>{SLOT_LABELS[slot]}</small><strong className="block truncate text-xs">{item?.name}</strong></span></button> })}</div>

    <div ref={surfaceRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerEnd} onPointerCancel={handlePointerEnd} className="relative mx-auto mt-3 aspect-[2/3] w-full max-w-[17rem] cursor-grab overflow-hidden rounded-[1.5rem] border-2 border-white bg-gradient-to-b from-violet-50 via-white to-slate-100 shadow-inner active:cursor-grabbing dark:border-slate-800 dark:from-violet-950/50 dark:via-slate-900 dark:to-slate-950" style={{ touchAction: 'none' }} aria-label={`Déplacer ${SLOT_LABELS[selectedSlot].toLowerCase()}`}>
      <ManualOutfitPreview ownerId={ownerId} top={top} bottom={bottom} layout={currentLayout} selectedSlot={selectedSlot} className="h-full w-full" />
      <span className="pointer-events-none absolute left-1/2 top-[43.6%] z-20 h-px w-20 -translate-x-1/2 bg-violet-400/45" />
      <span className="pointer-events-none absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded-full bg-slate-950/75 px-2.5 py-1.5 text-[10px] font-black text-white"><Move size={13} />{SLOT_LABELS[selectedSlot]} sélectionné</span>
    </div>
    <p className="mt-3 text-center text-xs font-bold text-muted">1 doigt pour déplacer · 2 doigts pour zoomer</p>

    <div className="mt-4 rounded-2xl bg-surface p-3 shadow-sm">
      <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm font-black"><Minus size={16} />Taille</span><strong className="rounded-full bg-violet-100 px-2.5 py-1 text-xs text-violet-700 dark:bg-violet-950 dark:text-violet-200">{Math.round(selectedPart.scale * 100)}%</strong></div>
      <input type="range" min="0.55" max="1.65" step="0.01" value={selectedPart.scale} onChange={(event) => changeSelected({ scale: Number(event.target.value) })} className="mt-3 h-8 w-full cursor-pointer accent-violet-600" aria-label={`Taille du ${SLOT_LABELS[selectedSlot].toLowerCase()}`} />
      <div className="mt-2 flex items-center justify-between gap-2"><button type="button" onClick={() => changeSelected({ scale: selectedPart.scale - 0.05 })} className="grid h-10 w-10 place-items-center rounded-xl bg-canvas" aria-label="Réduire"><Minus size={17} /></button><div className="grid grid-cols-4 gap-0.5"><button type="button" onClick={() => nudge(-1.5, 0)} className="grid h-9 w-9 place-items-center rounded-xl bg-canvas" aria-label="Déplacer à gauche"><ArrowLeft size={17} /></button><button type="button" onClick={() => nudge(0, -1.5)} className="grid h-9 w-9 place-items-center rounded-xl bg-canvas" aria-label="Déplacer vers le haut"><ArrowUp size={17} /></button><button type="button" onClick={() => nudge(0, 1.5)} className="grid h-9 w-9 place-items-center rounded-xl bg-canvas" aria-label="Déplacer vers le bas"><ArrowDown size={17} /></button><button type="button" onClick={() => nudge(1.5, 0)} className="grid h-9 w-9 place-items-center rounded-xl bg-canvas" aria-label="Déplacer à droite"><ArrowRight size={17} /></button></div><button type="button" onClick={() => changeSelected({ scale: selectedPart.scale + 0.05 })} className="grid h-10 w-10 place-items-center rounded-xl bg-canvas" aria-label="Agrandir"><Plus size={17} /></button></div>
      <div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => commit(resetManualOutfitPart(layoutRef.current, selectedSlot))} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-canvas px-2 text-xs font-black"><RotateCcw size={15} />Recentrer la pièce</button><button type="button" onClick={() => commit({ ...layoutRef.current, front: selectedSlot })} className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-2 text-xs font-black ${currentLayout.front === selectedSlot ? 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200' : 'bg-canvas'}`}><Layers3 size={15} />{currentLayout.front === selectedSlot ? 'Pièce devant' : 'Mettre devant'}</button></div>
      <button type="button" onClick={resetAll} className="mt-2 min-h-10 w-full text-xs font-black text-muted">Réinitialiser toute la tenue</button>
    </div>
  </div>
}
