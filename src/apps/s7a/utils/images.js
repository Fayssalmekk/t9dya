const loadImage = (source) => new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = source })
const readFile = (file) => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file) })

export async function prepareMealPhoto(file) {
  if (!file?.type.startsWith('image/')) throw new Error('INVALID_IMAGE')
  const image = await loadImage(await readFile(file))
  const ratio = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio)); canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio))
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
  let quality = 0.68
  let result = canvas.toDataURL('image/jpeg', quality)
  while (result.length > 450000 && quality > 0.4) {
    quality -= 0.08
    result = canvas.toDataURL('image/jpeg', quality)
  }
  if (result.length > 500000) throw new Error('IMAGE_TOO_LARGE')
  return result
}
