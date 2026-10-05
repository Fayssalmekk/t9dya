import { useEffect, useMemo, useRef, useState } from 'react'
import { Maximize2, Minus, Navigation, Plus } from 'lucide-react'
import { constrainCamera, gestureMetrics, moveCamera } from '../mapViewport'

const TILE_SIZE = 256

function project(latitude, longitude, zoom) {
  const scale = TILE_SIZE * (2 ** zoom)
  const safeLatitude = Math.max(-85.0511, Math.min(85.0511, latitude))
  const sin = Math.sin(safeLatitude * Math.PI / 180)
  return {
    x: ((longitude + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale
  }
}

function suitableZoom(points) {
  if (points.length < 2) return 16
  const latitudeGap = Math.abs(points[0].latitude - points[1].latitude)
  const longitudeGap = Math.abs(points[0].longitude - points[1].longitude)
  const gap = Math.max(latitudeGap, longitudeGap)
  if (gap < 0.002) return 17
  if (gap < 0.006) return 15
  if (gap < 0.02) return 13
  if (gap < 0.08) return 11
  if (gap < 0.35) return 9
  return 7
}

export default function LiveMap({ points }) {
  const [view, setView] = useState(null)
  const [size, setSize] = useState({ width: 768, height: 400 })
  const surfaceRef = useRef(null)
  const gestureRef = useRef({ pointers: new Map(), start: null, base: null, camera: null })
  const suggestedZoom = useMemo(() => suitableZoom(points), [points])
  const hasPoints = points.length > 0
  const automaticCenter = points.length ? project(
    points.reduce((sum, point) => sum + point.latitude, 0) / points.length,
    points.reduce((sum, point) => sum + point.longitude, 0) / points.length,
    0
  ) : { x: 128, y: 128 }
  const camera = view ?? { center: automaticCenter, zoom: suggestedZoom }

  useEffect(() => {
    const surface = surfaceRef.current
    if (!surface) return
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
      // Rotation/resizing changes screen coordinates: end the old gesture safely.
      gestureRef.current.pointers.clear()
    })
    observer.observe(surface)
    return () => observer.disconnect()
  }, [hasPoints])

  function localPoint(event) {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: event.clientX - rect.left - rect.width / 2, y: event.clientY - rect.top - rect.height / 2 }
  }

  function startPointer(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    const gesture = gestureRef.current
    if (!gesture.pointers.size) gesture.camera = camera
    gesture.pointers.set(event.pointerId, localPoint(event))
    gesture.base = gesture.camera
    gesture.start = gestureMetrics(gesture.pointers)
    event.currentTarget.setPointerCapture(event.pointerId)
    setView(gesture.camera)
  }

  function movePointer(event) {
    const gesture = gestureRef.current
    if (!gesture.pointers.has(event.pointerId)) return
    gesture.pointers.set(event.pointerId, localPoint(event))
    gesture.camera = moveCamera(gesture.base, gesture.start, gestureMetrics(gesture.pointers))
    setView(gesture.camera)
  }

  function endPointer(event) {
    const gesture = gestureRef.current
    if (!gesture.pointers.delete(event.pointerId)) return
    // Rebase when a finger lifts, preventing a jump from pinch back to one-finger pan.
    gesture.base = gesture.camera
    gesture.start = gestureMetrics(gesture.pointers)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  function changeZoom(delta) {
    gestureRef.current.pointers.clear()
    setView((current) => constrainCamera({ ...(current ?? camera), zoom: (current ?? camera).zoom + delta }))
  }

  function recenter() {
    gestureRef.current.pointers.clear()
    setView(null)
  }

  function navigateWithKeyboard(event) {
    if (event.key === '+' || event.key === '=') { event.preventDefault(); changeZoom(1); return }
    if (event.key === '-') { event.preventDefault(); changeZoom(-1); return }
    if (event.key === 'Home') { event.preventDefault(); recenter(); return }
    const direction = { ArrowLeft: [-80, 0], ArrowRight: [80, 0], ArrowUp: [0, -80], ArrowDown: [0, 80] }[event.key]
    if (!direction) return
    event.preventDefault()
    setView(constrainCamera({ ...camera, center: { x: camera.center.x + direction[0] / (2 ** camera.zoom), y: camera.center.y + direction[1] / (2 ** camera.zoom) } }))
  }

  const map = useMemo(() => {
    if (!points.length) return null
    const activeZoom = Math.floor(camera.zoom)
    const scale = 2 ** (camera.zoom - activeZoom)
    const centerPixel = { x: camera.center.x * (2 ** activeZoom), y: camera.center.y * (2 ** activeZoom) }
    const centerTileX = Math.floor(centerPixel.x / TILE_SIZE)
    const centerTileY = Math.floor(centerPixel.y / TILE_SIZE)
    const tileLimit = 2 ** activeZoom
    const tiles = []
    const columns = Math.ceil(size.width / (TILE_SIZE * scale) / 2) + 1
    const rows = Math.ceil(size.height / (TILE_SIZE * scale) / 2) + 1
    for (let y = -rows; y <= rows; y += 1) {
      for (let x = -columns; x <= columns; x += 1) {
        const tileX = ((centerTileX + x) % tileLimit + tileLimit) % tileLimit
        const tileY = centerTileY + y
        if (tileY < 0 || tileY >= tileLimit) continue
        tiles.push({
          key: `${activeZoom}-${centerTileX + x}-${tileY}`,
          src: `https://tile.openstreetmap.org/${activeZoom}/${tileX}/${tileY}.png`,
          left: ((centerTileX + x) * TILE_SIZE - centerPixel.x) * scale,
          top: ((centerTileY + y) * TILE_SIZE - centerPixel.y) * scale,
          size: TILE_SIZE * scale
        })
      }
    }
    return {
      tiles,
      markers: points.map((point) => {
        const pixel = project(point.latitude, point.longitude, activeZoom)
        const worldWidth = TILE_SIZE * tileLimit
        const dx = ((pixel.x - centerPixel.x + worldWidth / 2) % worldWidth + worldWidth) % worldWidth - worldWidth / 2
        return { ...point, left: dx * scale, top: (pixel.y - centerPixel.y) * scale }
      })
    }
  }, [points, camera.center.x, camera.center.y, camera.zoom, size.width, size.height])

  if (!map) return <div className="grid h-[25rem] place-items-center bg-gradient-to-br from-sky-100 via-cyan-50 to-emerald-100 p-8 text-center dark:from-sky-950 dark:via-slate-950 dark:to-emerald-950"><div><Navigation className="mx-auto text-sky-500" size={38} /><strong className="mt-3 block text-lg">La carte vous attend</strong><p className="mt-1 max-w-xs text-sm text-muted">Activez votre position ou attendez que votre partenaire partage la sienne.</p></div></div>

  return <div className="relative h-[25rem] overflow-hidden bg-sky-100 dark:bg-slate-900">
    <div ref={surfaceRef} role="region" aria-label="Carte interactive. Glissez pour déplacer, pincez pour zoomer. Clavier : flèches, plus, moins et Origine pour recentrer." tabIndex={0} onPointerDown={startPointer} onPointerMove={movePointer} onPointerUp={endPointer} onPointerCancel={endPointer} onLostPointerCapture={endPointer} onKeyDown={navigateWithKeyboard} className="absolute inset-0 cursor-grab select-none outline-none active:cursor-grabbing focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-sky-500" style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}>
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(15,23,42,.12))]" />
    {map.tiles.map((tile) => <img key={tile.key} src={tile.src} alt="" draggable="false" className="pointer-events-none absolute max-w-none select-none" style={{ width: tile.size + 0.5, height: tile.size + 0.5, left: `calc(50% + ${tile.left}px)`, top: `calc(50% + ${tile.top}px)` }} />)}
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-slate-950/10" />
    {map.markers.map((marker) => <div key={marker.uid} className="absolute z-10 -translate-x-1/2 -translate-y-full" style={{ left: `calc(50% + ${marker.left}px)`, top: `calc(50% + ${marker.top}px)` }}>
      {marker.live && <span className={`absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full opacity-20 ${marker.isMe ? 'bg-sky-500' : 'bg-violet-500'}`} />}
      <span className={`relative grid h-12 w-12 place-items-center rounded-full border-4 border-white font-black text-white shadow-xl ${marker.isMe ? 'bg-sky-600' : 'bg-violet-600'} ${marker.live ? '' : 'grayscale'}`}>{marker.initial}</span>
      <span className={`absolute left-1/2 top-[2.7rem] h-3 w-3 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-white ${marker.isMe ? 'bg-sky-600' : 'bg-violet-600'}`} />
      <span className="absolute left-1/2 top-[3.75rem] -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-950/85 px-2.5 py-1 text-[10px] font-black text-white shadow">{marker.label}</span>
    </div>)}
    </div>
    <div className="absolute right-3 top-3 z-20 overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      <button type="button" onClick={() => changeZoom(1)} disabled={camera.zoom >= 19} className="grid h-12 w-12 place-items-center border-b border-slate-200 text-slate-800 disabled:opacity-35 dark:border-slate-700 dark:text-white" aria-label="Zoomer"><Plus size={21} /></button>
      <button type="button" onClick={() => changeZoom(-1)} disabled={camera.zoom <= 3} className="grid h-12 w-12 place-items-center border-b border-slate-200 text-slate-800 disabled:opacity-35 dark:border-slate-700 dark:text-white" aria-label="Dézoomer"><Minus size={21} /></button>
      <button type="button" onClick={recenter} className="grid h-12 w-12 place-items-center text-sky-700 dark:text-sky-300" aria-label="Voir toutes les positions"><Maximize2 size={19} /></button>
    </div>
    <span className="pointer-events-none absolute left-3 top-3 z-20 rounded-full bg-slate-950/75 px-3 py-1.5 text-[10px] font-black text-white shadow">Zoom {Math.round(camera.zoom * 10) / 10}</span>
    <span className="pointer-events-none absolute bottom-9 left-3 z-20 rounded-full bg-slate-950/70 px-3 py-1.5 text-[10px] font-bold text-white">Glissez pour déplacer · Pincez pour zoomer</span>
    <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="absolute bottom-2 right-2 z-20 rounded-md bg-white/90 px-2 py-1 text-[9px] font-bold text-slate-700 shadow">© OpenStreetMap</a>
  </div>
}
