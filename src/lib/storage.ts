import 'server-only'
import { put, del } from '@vercel/blob'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

/**
 * Токен Vercel Blob. Стандартна назва — BLOB_READ_WRITE_TOKEN, але якщо сховище підключили
 * з префіксом (напр. VK_AVOGADRO_READ_WRITE_TOKEN), знаходимо його за значенням.
 */
function blobToken(): string | undefined {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN
  for (const [key, value] of Object.entries(process.env)) {
    if (key.endsWith('READ_WRITE_TOKEN') && value?.startsWith('vercel_blob_rw_')) return value
  }
  return undefined
}

// На Vercel завжди пробуємо Blob (SDK вміє й без токена, через підключене сховище); локально — лише з токеном
const blobEnabled = () => Boolean(blobToken()) || Boolean(process.env.VERCEL)
const LOCAL_PREFIX = '/uploads/'

export class UploadError extends Error {}

/** Зберігає фото у Vercel Blob (або в public/uploads під час локальної розробки). */
export async function savePhoto(file: File, folder: 'players' | 'teams'): Promise<string> {
  const ext = ALLOWED_TYPES[file.type]
  if (!ext) throw new UploadError('Підтримуються лише JPG, PNG або WebP.')
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError('Файл завеликий (максимум 3 МБ).')

  const name = `${folder}/${randomUUID()}.${ext}`

  if (blobEnabled()) {
    try {
      const blob = await put(name, file, {
        access: 'public',
        contentType: file.type,
        cacheControlMaxAge: 60 * 60 * 24 * 365,
        token: blobToken(),
      })
      return blob.url
    } catch (err) {
      console.error('Vercel Blob: не вдалося зберегти файл', err)
      throw new UploadError(
        blobToken()
          ? 'Сховище фото відхилило файл. Спробуйте ще раз за хвилину.'
          : 'Сховище фото не підключено: у Vercel → Storage підключіть Blob до проєкту й зробіть Redeploy.',
      )
    }
  }
  const target = path.join(process.cwd(), 'public', 'uploads', name)
  await mkdir(path.dirname(target), { recursive: true })
  await writeFile(target, Buffer.from(await file.arrayBuffer()))
  return `${LOCAL_PREFIX}${name}`
}

/** Видаляє фото; помилки лише логуються, щоб не блокувати збереження даних. */
export async function deletePhoto(url: string | null | undefined) {
  if (!url) return
  try {
    if (url.startsWith(LOCAL_PREFIX)) {
      if (process.env.VERCEL) return
      await unlink(path.join(process.cwd(), 'public', url))
    } else if (blobEnabled() && url.includes('.blob.vercel-storage.com/')) {
      await del(url, { token: blobToken() })
    }
  } catch (err) {
    console.error('Не вдалося видалити фото', url, err)
  }
}
