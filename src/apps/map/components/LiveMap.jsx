import { useMemo, useState } from 'react'
import { Maximize2, Minus, Navigation, Plus } from 'lucide-react'

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
  const [zoom, setZoom] = useState(null)
  const suggestedZoom = useMemo(() => suitableZoom(points), [points])

  const map = useMemo(() => {
    if (!points.length) return null
    const activeZoom = zoom ?? suggestedZoom
    const center = {
      latitude: points.reduce((sum, point) => sum + point.latitude, 0) / points.length,
      longitude: points.reduce((sum, point) => sum + point.longitude, 0) / points.length
    }
    const centerPixel = project(center.latitude, center.longitude, activeZoom)
    const centerTileX = Math.floor(centerPixel.x / TILE_SIZE)
    const centerTileY = Math.floor(centerPixel.y / TILE_SIZE)
    const tileLimit = 2 ** activeZoom
    const tiles = []
    for (let y = -2; y <= 2; y += 1) {
      for (let x = -2; x <= 2; x += 1) {
        const tileX = (centerTileX + x + tileLimit) % tileLimit
        const tileY = Math.max(0, Math.min(tileLimit - 1, centerTileY + y))
        tiles.push({
          key: `${tileX}-${tileY}`,
          src: `https://tile.openstreetmap.org/${activeZoom}/${tileX}/${tileY}.png`,
          left: (centerTileX + x) * TILE_SIZE - centerPixel.x,
          top: (centerTileY + y) * TILE_SIZE - centerPixel.y
        })
      }
    }
    return {
      tiles,
      markers: points.map((point) => {
        const pixel = project(point.latitude, point.longitude, activeZoom)
        return { ...point, left: pixel.x - centerPixel.x, top: pixel.y - centerPixel.y }
      })
    }
  }, [points, suggestedZoom, zoom])

  if (!map) return <div className="grid h-[25rem] place-items-center bg-gradient-to-br from-sky-100 via-cyan-50 to-emerald-100 p-8 text-center dark:from-sky-950 dark:via-slate-950 dark:to-emerald-950"><div><Navigation className="mx-auto text-sky-500" size={38} /><strong className="mt-3 block text-lg">La carte vous attend</strong><p className="mt-1 max-w-xs text-sm text-muted">Activez votre position ou attendez que votre partenaire partage la sienne.</p></div></div>

  return <div className="relative h-[25rem] overflow-hidden bg-sky-100 dark:bg-slate-900">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(15,23,42,.12))]" />
    {map.tiles.map((tile) => <img key={tile.key} src={tile.src} alt="" draggable="false" className="absolute h-64 w-64 max-w-none select-none" style={{ left: `calc(50% + ${tile.left}px)`, top: `calc(50% + ${tile.top}px)` }} />)}
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-slate-950/10" />
    {map.markers.map((marker) => <div key={marker.uid} className="absolute z-10 -translate-x-1/2 -translate-y-full" style={{ left: `calc(50% + ${marker.left}px)`, top: `calc(50% + ${marker.top}px)` }}>
      {marker.live && <span className={`absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full opacity-20 ${marker.isMe ? 'bg-sky-500' : 'bg-violet-500'}`} />}
      <span className={`relative grid h-12 w-12 place-items-center rounded-full border-4 border-white font-black text-white shadow-xl ${marker.isMe ? 'bg-sky-600' : 'bg-violet-600'} ${marker.live ? '' : 'grayscale'}`}>{marker.initial}</span>
      <span className={`absolute left-1/2 top-[2.7rem] h-3 w-3 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-white ${marker.isMe ? 'bg-sky-600' : 'bg-violet-600'}`} />
      <span className="absolute left-1/2 top-[3.75rem] -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-950/85 px-2.5 py-1 text-[10px] font-black text-white shadow">{marker.label}</span>
    </div>)}
    <div className="absolute right-3 top-3 z-20 overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      <button type="button" onClick={() => setZoom((value) => Math.min(19, (value ?? suggestedZoom) + 1))} disabled={(zoom ?? suggestedZoom) >= 19} className="grid h-12 w-12 place-items-center border-b border-slate-200 text-slate-800 disabled:opacity-35 dark:border-slate-700 dark:text-white" aria-label="Zoomer"><Plus size={21} /></button>
      <button type="button" onClick={() => setZoom((value) => Math.max(3, (value ?? suggestedZoom) - 1))} disabled={(zoom ?? suggestedZoom) <= 3} className="grid h-12 w-12 place-items-center border-b border-slate-200 text-slate-800 disabled:opacity-35 dark:border-slate-700 dark:text-white" aria-label="Dézoomer"><Minus size={21} /></button>
      <button type="button" onClick={() => setZoom(suggestedZoom)} className="grid h-12 w-12 place-items-center text-sky-700 dark:text-sky-300" aria-label="Voir toutes les positions"><Maximize2 size={19} /></button>
    </div>
    <span className="absolute left-3 top-3 z-20 rounded-full bg-slate-950/75 px-3 py-1.5 text-[10px] font-black text-white shadow">Zoom {zoom ?? suggestedZoom}</span>
    <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="absolute bottom-2 right-2 rounded-md bg-white/90 px-2 py-1 text-[9px] font-bold text-slate-700 shadow">© OpenStreetMap</a>
  </div>
}
