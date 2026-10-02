import { useEffect, useState } from 'react'
import { getClothingImage } from '../services/wardrobe'

const imageCache = new Map()

export default function ClothingImage({ ownerId, item, className = '', alt = item.name }) {
  const cacheKey = `${ownerId}:${item.id}`
  const [source, setSource] = useState(() => imageCache.get(cacheKey) || item.thumb)

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

  return <img src={source} alt={alt} loading="lazy" decoding="async" className={className} />
}
