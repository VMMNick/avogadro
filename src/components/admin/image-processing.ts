// Обробка фото в браузері: будь-який формат → (обрізка) → зменшення → WebP.

/** Найбільша сторона готового фото. Картка гравця на сайті ≤ 480 px, тож з запасом для retina. */
export const OUTPUT_MAX_SIDE = 1200
/** Найбільша сторона зображення в редакторі обрізки — щоб величезні фото не «вішали» телефон. */
const EDITOR_MAX_SIDE = 2400
const QUALITY = 0.85

export class ImageReadError extends Error {}

function isHeicFile(file: File) {
  return /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name)
}

async function decode(blob: Blob): Promise<ImageBitmap> {
  try {
    // from-image — враховує орієнтацію з EXIF (фото з телефона не будуть «боком»)
    return await createImageBitmap(blob, { imageOrientation: 'from-image' })
  } catch {
    // Запасний шлях для браузерів, які не декодують формат через createImageBitmap
    const url = URL.createObjectURL(blob)
    try {
      const img = new Image()
      img.decoding = 'async'
      img.src = url
      await img.decode()
      return await createImageBitmap(img)
    } finally {
      URL.revokeObjectURL(url)
    }
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
}

function drawScaled(source: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, maxSide: number) {
  const scale = Math.min(1, maxSide / Math.max(sw, sh))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(sw * scale))
  canvas.height = Math.max(1, Math.round(sh * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new ImageReadError('Браузер не зміг обробити фото.')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
  return canvas
}

export type LoadedImage = {
  /** Зображення для редактора (вже з правильною орієнтацією і обмеженим розміром) */
  bitmap: ImageBitmap
  /** URL того ж зображення для показу в редакторі обрізки */
  url: string
  width: number
  height: number
}

/** Читає фото будь-якого формату, який підтримує браузер, плюс HEIC/HEIF з iPhone. */
export async function loadImage(file: File): Promise<LoadedImage> {
  let source: Blob = file
  if (isHeicFile(file)) {
    try {
      // Бібліотека велика — завантажуємо лише коли справді потрібна
      const { heicTo } = await import('heic-to/next')
      source = await heicTo({ blob: file, type: 'image/jpeg', quality: 0.92 })
    } catch {
      throw new ImageReadError('Не вдалося відкрити фото HEIC. Спробуйте зберегти його як JPG.')
    }
  }

  let original: ImageBitmap
  try {
    original = await decode(source)
  } catch {
    throw new ImageReadError('Цей файл не схожий на фото або формат не підтримується браузером.')
  }

  // Зменшуємо дуже великі фото ще до редактора
  const canvas = drawScaled(original, 0, 0, original.width, original.height, EDITOR_MAX_SIDE)
  original.close()
  const bitmap = await createImageBitmap(canvas)
  const blob = await toBlob(canvas, 'image/jpeg', 0.92)
  if (!blob) throw new ImageReadError('Браузер не зміг обробити фото.')
  return { bitmap, url: URL.createObjectURL(blob), width: bitmap.width, height: bitmap.height }
}

export type CropArea = { x: number; y: number; width: number; height: number }

/** Готує файл для завантаження: обрізка (необов'язково) + зменшення + WebP (або JPEG). */
export async function exportImage(image: LoadedImage, crop: CropArea | null): Promise<File> {
  const area = crop ?? { x: 0, y: 0, width: image.width, height: image.height }
  const canvas = drawScaled(image.bitmap, area.x, area.y, area.width, area.height, OUTPUT_MAX_SIDE)

  const webp = await toBlob(canvas, 'image/webp', QUALITY)
  if (webp && webp.type === 'image/webp') return new File([webp], 'photo.webp', { type: 'image/webp' })

  const jpeg = await toBlob(canvas, 'image/jpeg', QUALITY)
  if (!jpeg) throw new ImageReadError('Браузер не зміг стиснути фото.')
  return new File([jpeg], 'photo.jpg', { type: 'image/jpeg' })
}
