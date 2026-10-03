const loadImage = (source) => new Promise((resolve, reject) => {
  const image = new Image()
  image.onload = () => resolve(image)
  image.onerror = () => reject(new Error('IMAGE_DECODE_FAILED'))
  image.src = source
})

const canvasDataUrl = (image, maxSize, type, quality) => {
  const ratio = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio))
  canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio))
  const context = canvas.getContext('2d', { alpha: type !== 'image/jpeg' })
  if (type === 'image/jpeg') { context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height) }
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL(type, quality)
}

export const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.onerror = reject
  reader.readAsDataURL(file)
})

export async function prepareUpload(file) {
  if (!file?.type.startsWith('image/')) throw new Error('INVALID_IMAGE')
  const source = await fileToDataUrl(file)
  const image = await loadImage(source)
  let quality = 0.88
  let result = canvasDataUrl(image, 1024, 'image/jpeg', quality)
  while (result.length > 950000 && quality > 0.5) { quality -= 0.1; result = canvasDataUrl(image, 1024, 'image/jpeg', quality) }
  if (result.length > 1000000) throw new Error('IMAGE_TOO_LARGE')
  return result
}

export async function finalizeImages(dataUrl) {
  const image = await loadImage(dataUrl)
  let quality = 0.9
  let main = canvasDataUrl(image, 900, 'image/webp', quality)
  while (main.length > 800000 && quality > 0.42) { quality -= 0.08; main = canvasDataUrl(image, 900, 'image/webp', quality) }
  if (main.length > 850000) throw new Error('IMAGE_TOO_LARGE')
  let thumbSize = 320
  let thumbQuality = 0.86
  let thumb = canvasDataUrl(image, thumbSize, 'image/webp', thumbQuality)
  while (thumb.length > 220000 && thumbQuality > 0.42) { thumbQuality -= 0.08; thumb = canvasDataUrl(image, thumbSize, 'image/webp', thumbQuality) }
  while (thumb.length > 235000 && thumbSize > 240) { thumbSize = Math.max(240, Math.round(thumbSize * 0.85)); thumb = canvasDataUrl(image, thumbSize, 'image/webp', 0.58) }
  if (thumb.length >= 245000) throw new Error('THUMB_TOO_LARGE')
  return { image: main, thumb }
}

export async function finalizeOutfitImage(dataUrl) {
  const image = await loadImage(dataUrl)
  let quality = 0.9
  let main = canvasDataUrl(image, 1400, 'image/webp', quality)
  while (main.length > 800000 && quality > 0.42) { quality -= 0.08; main = canvasDataUrl(image, 1400, 'image/webp', quality) }
  if (main.length > 850000) throw new Error('IMAGE_TOO_LARGE')
  return { image: main, thumb: canvasDataUrl(image, 420, 'image/webp', 0.88) }
}

export async function hasSafeTransparentMargins(dataUrl, minimumRatio = 0.02) {
  const image = await loadImage(dataUrl)
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  const context = canvas.getContext('2d', { willReadFrequently: true })
  context.drawImage(image, 0, 0)
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
  let left = canvas.width
  let right = -1
  let top = canvas.height
  let bottom = -1
  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      if (pixels[(y * canvas.width + x) * 4 + 3] <= 40) continue
      left = Math.min(left, x)
      right = Math.max(right, x)
      top = Math.min(top, y)
      bottom = Math.max(bottom, y)
    }
  }
  if (right < 0) return false
  return left >= canvas.width * minimumRatio
    && top >= canvas.height * minimumRatio
    && right <= canvas.width * (1 - minimumRatio)
    && bottom <= canvas.height * (1 - minimumRatio)
}

export async function createVisionImage(dataUrl, { maxSize = 768, maxChars = 900000 } = {}) {
  const image = await loadImage(dataUrl)
  let size = maxSize
  let quality = 0.86
  let result = canvasDataUrl(image, size, 'image/jpeg', quality)
  while (result.length > maxChars && quality > 0.5) {
    quality -= 0.08
    result = canvasDataUrl(image, size, 'image/jpeg', quality)
  }
  while (result.length > maxChars && size > 384) {
    size = Math.max(384, Math.round(size * 0.82))
    result = canvasDataUrl(image, size, 'image/jpeg', 0.7)
  }
  if (result.length > maxChars) throw new Error('IMAGE_TOO_LARGE')
  return result
}
