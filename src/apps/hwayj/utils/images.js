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
  let quality = 0.82
  let main = canvasDataUrl(image, 600, 'image/webp', quality)
  while (main.length > 800000 && quality > 0.42) { quality -= 0.08; main = canvasDataUrl(image, 600, 'image/webp', quality) }
  if (main.length > 850000) throw new Error('IMAGE_TOO_LARGE')
  return { image: main, thumb: canvasDataUrl(image, 150, 'image/webp', 0.76) }
}

export async function createVisionImage(dataUrl) {
  const image = await loadImage(dataUrl)
  return canvasDataUrl(image, 512, 'image/jpeg', 0.72)
}
