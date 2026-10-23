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

const blobEnabled = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN)
const LOCAL_PREFIX = '/uploads/'

export class UploadError extends Error {}

/** Зберігає фото у Vercel Blob (або в public/uploads під час локальної розробки). */
export async function savePhoto(file: File, folder: 'players'): Promise<string> {
  const ext = ALLOWED_TYPES[file.type]
  if (!ext) throw new UploadError('Підтримуються лише JPG, PNG або WebP.')
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError('Файл завеликий (максимум 3 МБ).')

  const name = `${folder}/${randomUUID()}.${ext}`

  if (blobEnabled()) {
    const blob = await put(name, file, {
      access: 'public',
      contentType: file.type,
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    })
    return blob.url
  }

  if (process.env.VERCEL) {
    throw new UploadError('Сховище фото не підключено: додайте Vercel Blob у Storage проєкту.')
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
      await del(url)
    }
  } catch (err) {
    console.error('Не вдалося видалити фото', url, err)
  }
}
