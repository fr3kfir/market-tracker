// Downscale a photo in the browser so uploads stay small and fast.
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('לא ניתן לקרוא את התמונה')) }
    img.src = url
  })
}

function toJpegDataUrl(img, maxSide, quality) {
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.naturalWidth * scale)
  canvas.height = Math.round(img.naturalHeight * scale)
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', quality)
}

// Returns { preview, thumb, payload } — payload is what the API receives.
export async function prepareImage(file) {
  const img = await loadImage(file)
  const preview = toJpegDataUrl(img, 1280, 0.85)
  const thumb = toJpegDataUrl(img, 320, 0.75)
  return {
    preview,
    thumb,
    payload: { mediaType: 'image/jpeg', data: preview.split(',')[1] },
  }
}
