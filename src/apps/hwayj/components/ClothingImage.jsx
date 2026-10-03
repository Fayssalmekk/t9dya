import { useEffect, useState } from 'react'
import { getClothingImage } from '../services/wardrobe'

const imageCache = new Map()
const normalizedCache = new Map()
const normalizedPromises = new Map()
const transparentPixel = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='

function getPixelRatio() {
  return Math.min(3, Math.max(2, Math.ceil(window.devicePixelRatio || 1)))
}

function getNormalizedKey(ownerId, itemId, slot) {
  return `${ownerId}:${itemId}:${slot}:${getPixelRatio()}`
}

async function loadClothingSource(ownerId, item) {
  const cacheKey = `${ownerId}:${item.id}`
  if (imageCache.has(cacheKey)) return imageCache.get(cacheKey)
  const image = await getClothingImage(ownerId, item.id).catch(() => null)
  const source = image || item.thumb
  imageCache.set(cacheKey, source)
  return source
}

function decodeImage(source) {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => resolve()
    image.onerror = () => resolve()
    image.src = source
    if (image.decode) image.decode().then(resolve).catch(() => {})
  })
}

function normalizeTransparentGarment(source, slot) {
  // The normalized image is displayed at roughly the logical canvas size, but
  // Android phones commonly render at 2x or 3x density. Keep that extra pixel
  // information so the browser never has to enlarge a low-resolution canvas.
  const pixelRatio = getPixelRatio()
  const cacheKey = `${slot}:${pixelRatio}:${source.length}:${source.slice(-96)}`
  if (normalizedCache.has(cacheKey)) return Promise.resolve(normalizedCache.get(cacheKey))
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => {
      try {
        const scan = document.createElement('canvas')
        scan.width = image.naturalWidth
        scan.height = image.naturalHeight
        const scanContext = scan.getContext('2d', { willReadFrequently: true })
        scanContext.drawImage(image, 0, 0)
        const pixels = scanContext.getImageData(0, 0, scan.width, scan.height).data
        let left = scan.width
        let right = -1
        let top = scan.height
        let bottom = -1
        for (let y = 0; y < scan.height; y += 1) {
          for (let x = 0; x < scan.width; x += 1) {
            if (pixels[(y * scan.width + x) * 4 + 3] <= 20) continue
            left = Math.min(left, x)
            right = Math.max(right, x)
            top = Math.min(top, y)
            bottom = Math.max(bottom, y)
          }
        }
        if (right < left || bottom < top) { resolve(source); return }
        const sourceWidth = right - left + 1
        const sourceHeight = bottom - top + 1
        const padding = Math.max(2, Math.round(Math.max(sourceWidth, sourceHeight) * 0.018))
        left = Math.max(0, left - padding)
        top = Math.max(0, top - padding)
        right = Math.min(scan.width - 1, right + padding)
        bottom = Math.min(scan.height - 1, bottom + padding)
        const cropWidth = right - left + 1
        const cropHeight = bottom - top + 1
        const isBottom = slot === 'bottom'
        const output = document.createElement('canvas')
        const logicalWidth = 360
        const logicalHeight = isBottom ? 280 : 220
        output.width = logicalWidth * pixelRatio
        output.height = logicalHeight * pixelRatio
        const maxWidth = isBottom ? 182 : 232
        const maxHeight = isBottom ? 274 : 212
        const scale = Math.min(maxWidth / cropWidth, maxHeight / cropHeight)
        const width = cropWidth * scale * pixelRatio
        const height = cropHeight * scale * pixelRatio
        const x = (output.width - width) / 2
        const y = isBottom ? 0 : output.height - height
        const outputContext = output.getContext('2d')
        outputContext.imageSmoothingEnabled = true
        outputContext.imageSmoothingQuality = 'high'
        outputContext.drawImage(image, left, top, cropWidth, cropHeight, x, y, width, height)
        const normalized = output.toDataURL('image/webp', 0.98)
        normalizedCache.set(cacheKey, normalized)
        resolve(normalized)
      } catch {
        resolve(source)
      }
    }
    image.onerror = () => resolve(source)
    image.src = source
  })
}

// Shared with the composer so a garment is ready before its swipe animation starts.
// eslint-disable-next-line react-refresh/only-export-components
export function preloadNormalizedClothingImage(ownerId, item, slot) {
  if (!ownerId || !item?.id || !slot) return Promise.resolve(item?.thumb || '')
  const key = getNormalizedKey(ownerId, item.id, slot)
  if (normalizedCache.has(key)) return Promise.resolve(normalizedCache.get(key))
  if (normalizedPromises.has(key)) return normalizedPromises.get(key)
  const promise = loadClothingSource(ownerId, item)
    .then((source) => normalizeTransparentGarment(source, slot))
    .then(async (normalized) => {
      await decodeImage(normalized)
      normalizedCache.set(key, normalized)
      return normalized
    })
    .finally(() => normalizedPromises.delete(key))
  normalizedPromises.set(key, promise)
  return promise
}

export default function ClothingImage({ ownerId, item, className = '', alt = item.name, normalizedSlot = '' }) {
  const cacheKey = `${ownerId}:${item.id}`
  const [source, setSource] = useState(() => imageCache.get(cacheKey) || item.thumb)
  const normalizedKey = normalizedSlot ? getNormalizedKey(ownerId, item.id, normalizedSlot) : ''
  const [normalizedSource, setNormalizedSource] = useState(() => normalizedCache.get(normalizedKey) || '')

  useEffect(() => {
    if (normalizedSlot) return undefined
    if (imageCache.has(cacheKey)) return undefined
    let cancelled = false
    getClothingImage(ownerId, item.id).then((image) => {
      if (!image || cancelled) return
      imageCache.set(cacheKey, image)
      setSource(image)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [cacheKey, item.id, normalizedSlot, ownerId])

  useEffect(() => {
    if (!normalizedSlot) return undefined
    let cancelled = false
    preloadNormalizedClothingImage(ownerId, item, normalizedSlot).then((normalized) => {
      if (!cancelled) setNormalizedSource(normalized)
    })
    return () => { cancelled = true }
  }, [item, normalizedSlot, ownerId])

  return <img src={normalizedSlot ? normalizedSource || transparentPixel : source} alt={alt} loading="lazy" decoding="async" className={className} />
}
