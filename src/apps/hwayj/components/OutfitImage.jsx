import { useEffect, useState } from 'react'
import { getOutfitImage } from '../services/wardrobe'

const imageCache = new Map()

export default function OutfitImage({ ownerId, outfit, className = '', alt = outfit.name }) {
  const cacheKey = `${ownerId}:${outfit.id}`
  const [source, setSource] = useState(() => imageCache.get(cacheKey) || outfit.previewThumb)

  useEffect(() => {
    let cancelled = false
    const cached = imageCache.get(cacheKey)
    if (cached) {
      Promise.resolve().then(() => { if (!cancelled) setSource(cached) })
      return () => { cancelled = true }
    }
    Promise.resolve().then(() => { if (!cancelled) setSource(outfit.previewThumb) })
    getOutfitImage(ownerId, outfit.id).then((image) => {
      if (!image || cancelled) return
      imageCache.set(cacheKey, image)
      setSource(image)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [cacheKey, outfit.id, outfit.previewThumb, ownerId])

  return <img src={source} alt={alt} className={className} loading="lazy" decoding="async" />
}
