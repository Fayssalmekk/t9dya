import { useEffect, useMemo, useState } from 'react'
import { getClothingImage } from '../services/wardrobe'
import ClothingImage from './ClothingImage'
import { normalizeManualOutfitLayout } from '../utils/manualOutfitLayout'

const composedCache = new Map()
const composedPromises = new Map()
const sourcePromises = new Map()

const CANVAS_WIDTH = 360
const CANVAS_HEIGHT = 540
const WAIST_Y = 236

function itemStamp(item) {
  return item?.updatedAt?.seconds || item?.updatedAt?.toMillis?.() || item?.thumb?.length || ''
}

function compositionKey(ownerId, top, bottom) {
  return `${ownerId}:${top.id}:${itemStamp(top)}:${bottom.id}:${itemStamp(bottom)}:v2`
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('IMAGE_DECODE_FAILED'))
    image.src = source
  })
}

function loadSource(ownerId, item) {
  const key = `${ownerId}:${item.id}:${itemStamp(item)}`
  if (sourcePromises.has(key)) return sourcePromises.get(key)
  const promise = getClothingImage(ownerId, item.id)
    .catch(() => null)
    .then((source) => source || item.thumb)
  sourcePromises.set(key, promise)
  return promise
}

function scanGarment(image) {
  const scanScale = Math.min(1, 360 / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.max(1, Math.round(image.naturalWidth * scanScale))
  const height = Math.max(1, Math.round(image.naturalHeight * scanScale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  context.drawImage(image, 0, 0, width, height)
  const pixels = context.getImageData(0, 0, width, height).data
  const corners = [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]].map(([x, y]) => {
    const index = (y * width + x) * 4
    return [pixels[index], pixels[index + 1], pixels[index + 2], pixels[index + 3]]
  })
  const background = [0, 1, 2].map((channel) => corners.reduce((sum, color) => sum + color[channel], 0) / corners.length)
  const cornersMatch = corners.every((color) => color[3] > 245 && Math.hypot(color[0] - background[0], color[1] - background[1], color[2] - background[2]) < 24)
  const visible = (index) => {
    if (pixels[index + 3] <= 22) return false
    if (!cornersMatch) return true
    return Math.hypot(pixels[index] - background[0], pixels[index + 1] - background[1], pixels[index + 2] - background[2]) > 18
  }
  let left = width
  let right = -1
  let top = height
  let bottom = -1
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!visible((y * width + x) * 4)) continue
      left = Math.min(left, x)
      right = Math.max(right, x)
      top = Math.min(top, y)
      bottom = Math.max(bottom, y)
    }
  }
  if (right < left || bottom < top) return { x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight, topAnchor: image.naturalWidth, bottomAnchor: image.naturalWidth }

  const bandWidth = (from, to) => {
    let bandLeft = width
    let bandRight = -1
    for (let y = Math.max(top, from); y <= Math.min(bottom, to); y += 1) {
      for (let x = left; x <= right; x += 1) {
        if (!visible((y * width + x) * 4)) continue
        bandLeft = Math.min(bandLeft, x)
        bandRight = Math.max(bandRight, x)
      }
    }
    return bandRight >= bandLeft ? bandRight - bandLeft + 1 : right - left + 1
  }
  const cropHeight = bottom - top + 1
  const bandDepth = Math.max(2, Math.round(cropHeight * 0.14))
  const inverseScale = 1 / scanScale
  return {
    x: left * inverseScale,
    y: top * inverseScale,
    width: (right - left + 1) * inverseScale,
    height: cropHeight * inverseScale,
    topAnchor: bandWidth(top, top + bandDepth) * inverseScale,
    bottomAnchor: bandWidth(bottom - bandDepth, bottom) * inverseScale,
  }
}

function maxBottomWidth(item) {
  if (item.subcategory === 'Jupe' || item.subcategory === 'Short') return 210
  return 194
}

async function composeManualOutfit(ownerId, topItem, bottomItem) {
  const key = compositionKey(ownerId, topItem, bottomItem)
  if (composedCache.has(key)) return composedCache.get(key)
  if (composedPromises.has(key)) return composedPromises.get(key)
  const promise = Promise.all([loadSource(ownerId, topItem), loadSource(ownerId, bottomItem)])
    .then(([topSource, bottomSource]) => Promise.all([loadImage(topSource), loadImage(bottomSource)]))
    .then(([topImage, bottomImage]) => {
      const topCrop = scanGarment(topImage)
      const bottomCrop = scanGarment(bottomImage)
      const topMaxWidth = topItem.category === 'Vestes' || topItem.subcategory === 'Veste de sport' ? 228 : 208
      const topMaxHeight = 220
      const bottomMaxHeight = 286
      let topScale = Math.min(topMaxWidth / topCrop.width, topMaxHeight / topCrop.height)
      let bottomScale = Math.min(maxBottomWidth(bottomItem) / bottomCrop.width, bottomMaxHeight / bottomCrop.height)

      const desiredJoinRatio = topItem.category === 'Vestes' || topItem.subcategory === 'Veste de sport' ? 1.16 : 1.04
      const currentJoinRatio = (topCrop.bottomAnchor * topScale) / Math.max(1, bottomCrop.topAnchor * bottomScale)
      const lowerRatio = desiredJoinRatio * 0.9
      const upperRatio = desiredJoinRatio * 1.1
      if (currentJoinRatio > upperRatio) topScale *= Math.max(0.74, upperRatio / currentJoinRatio)
      else if (currentJoinRatio < lowerRatio) bottomScale *= Math.max(0.74, currentJoinRatio / lowerRatio)

      const renderScale = Math.min(1.5, Math.max(1, window.devicePixelRatio || 1))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(CANVAS_WIDTH * renderScale)
      canvas.height = Math.round(CANVAS_HEIGHT * renderScale)
      const context = canvas.getContext('2d')
      context.scale(renderScale, renderScale)
      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'high'

      const topWidth = topCrop.width * topScale
      const topHeight = topCrop.height * topScale
      const bottomWidth = bottomCrop.width * bottomScale
      const bottomHeight = bottomCrop.height * bottomScale
      const bottomY = WAIST_Y - 1
      const topY = WAIST_Y + 5 - topHeight

      context.drawImage(bottomImage, bottomCrop.x, bottomCrop.y, bottomCrop.width, bottomCrop.height, (CANVAS_WIDTH - bottomWidth) / 2, bottomY, bottomWidth, bottomHeight)
      context.drawImage(topImage, topCrop.x, topCrop.y, topCrop.width, topCrop.height, (CANVAS_WIDTH - topWidth) / 2, topY, topWidth, topHeight)
      const result = canvas.toDataURL('image/webp', 0.92)
      composedCache.set(key, result)
      return result
    })
    .finally(() => composedPromises.delete(key))
  composedPromises.set(key, promise)
  return promise
}

export default function ManualOutfitPreview({ ownerId, top, bottom, className = '', alt = '', layout, selectedSlot = '' }) {
  const cacheKey = useMemo(() => top && bottom ? compositionKey(ownerId, top, bottom) : '', [bottom, ownerId, top])
  const [result, setResult] = useState(() => ({ key: cacheKey, source: composedCache.get(cacheKey) || '', failed: false }))

  useEffect(() => {
    if (!top || !bottom) return undefined
    let cancelled = false
    composeManualOutfit(ownerId, top, bottom)
      .then((image) => { if (!cancelled) setResult({ key: cacheKey, source: image, failed: false }) })
      .catch(() => { if (!cancelled) setResult({ key: cacheKey, source: '', failed: true }) })
    return () => { cancelled = true }
  }, [bottom, cacheKey, ownerId, top])

  const source = result.key === cacheKey ? result.source : composedCache.get(cacheKey) || ''
  const failed = result.key === cacheKey && result.failed
  if (layout && top && bottom) return <LayeredManualOutfit ownerId={ownerId} top={top} bottom={bottom} layout={layout} selectedSlot={selectedSlot} className={className} />
  if (!top || !bottom) return <div className={`${className} grid place-items-center text-xs font-bold text-muted`}>Tenue incomplète</div>
  if (failed) return <div className={`${className} flex flex-col items-center justify-center gap-0`}><ClothingImage ownerId={ownerId} item={top} normalizedSlot="top" className="h-[43%] w-full object-contain" /><ClothingImage ownerId={ownerId} item={bottom} normalizedSlot="bottom" className="h-[51%] w-full object-contain" /></div>
  if (!source) return <div className={`${className} animate-pulse rounded-2xl bg-violet-100/50 dark:bg-violet-950/30`} />
  return <div className={className}><img src={source} alt={alt || `${top.name} avec ${bottom.name}`} loading="lazy" decoding="async" className="h-full w-full object-contain" /></div>
}

function LayeredManualOutfit({ ownerId, top, bottom, layout, selectedSlot, className }) {
  const normalized = normalizeManualOutfitLayout(layout)
  const items = { top, bottom }
  const bases = {
    top: { top: 2.96, height: 40.74, origin: '50% 100%' },
    bottom: { top: 43.52, height: 51.85, origin: '50% 0%' },
  }
  const order = normalized.front === 'top' ? ['bottom', 'top'] : ['top', 'bottom']

  return <div className={`${className} relative overflow-hidden`}>
    {order.map((slot) => {
      const part = normalized[slot]
      const base = bases[slot]
      return <div key={slot} className={`pointer-events-none absolute w-full select-none ${selectedSlot === slot ? 'outline outline-2 outline-dashed outline-violet-500/70 -outline-offset-4' : ''}`} style={{ left: `${part.x}%`, top: `${base.top + part.y}%`, height: `${base.height}%`, transform: `scale(${part.scale})`, transformOrigin: base.origin }}><ClothingImage ownerId={ownerId} item={items[slot]} normalizedSlot={slot} className="h-full w-full object-contain" /></div>
    })}
  </div>
}
