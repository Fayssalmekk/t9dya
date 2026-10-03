import { useEffect, useState } from 'react'
import { getClothingImage } from '../services/wardrobe'

const imageCache = new Map()
const normalizedCache = new Map()

function normalizeTransparentGarment(source, slot) {
  const cacheKey = `${slot}:${source.length}:${source.slice(-96)}`
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
        output.width = 360
        output.height = isBottom ? 280 : 220
        const maxWidth = isBottom ? 182 : 232
        const maxHeight = isBottom ? 274 : 212
        const scale = Math.min(maxWidth / cropWidth, maxHeight / cropHeight)
        const width = cropWidth * scale
        const height = cropHeight * scale
        const x = (output.width - width) / 2
        const y = isBottom ? 0 : output.height - height
        output.getContext('2d').drawImage(image, left, top, cropWidth, cropHeight, x, y, width, height)
        const normalized = output.toDataURL('image/webp', 0.92)
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

export default function ClothingImage({ ownerId, item, className = '', alt = item.name, normalizedSlot = '' }) {
  const cacheKey = `${ownerId}:${item.id}`
  const [source, setSource] = useState(() => imageCache.get(cacheKey) || item.thumb)
  const [normalizedSource, setNormalizedSource] = useState('')

  useEffect(() => {
    if (imageCache.has(cacheKey)) return undefined
    let cancelled = false
    getClothingImage(ownerId, item.id).then((image) => {
      if (!image || cancelled) return
      imageCache.set(cacheKey, image)
      setSource(image)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [cacheKey, item.id, ownerId])

  useEffect(() => {
    if (!normalizedSlot) return undefined
    let cancelled = false
    normalizeTransparentGarment(source, normalizedSlot).then((normalized) => {
      if (!cancelled) setNormalizedSource(normalized)
    })
    return () => { cancelled = true }
  }, [normalizedSlot, source])

  return <img src={normalizedSlot ? normalizedSource || source : source} alt={alt} loading="lazy" decoding="async" className={className} />
}
