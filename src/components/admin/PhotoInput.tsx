'use client'

import { useEffect, useRef, useState } from 'react'

const MAX_SIDE = 1200
const QUALITY = 0.85

/** Стискає фото в браузері перед відправкою: менше трафіку і місця у сховищі. */
async function compress(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', QUALITY))
  if (!blob || blob.type !== 'image/webp') {
    const jpeg = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY))
    return jpeg ? new File([jpeg], 'photo.jpg', { type: 'image/jpeg' }) : file
  }
  return new File([blob], 'photo.webp', { type: 'image/webp' })
}

export function PhotoInput({ current, error }: { current: string | null; error?: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(current)
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [remove, setRemove] = useState(false)

  // React скидає форму після відправки — синхронізуємо прев'ю з порожнім полем файлу
  useEffect(() => {
    const form = inputRef.current?.form
    if (!form) return
    const onReset = () => {
      setPreview(current)
      setRemove(false)
    }
    form.addEventListener('reset', onReset)
    return () => form.removeEventListener('reset', onReset)
  }, [current])

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    setLocalError(null)
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setLocalError('Оберіть фото у форматі JPG, PNG або WebP.')
      e.target.value = ''
      return
    }
    setBusy(true)
    try {
      const small = await compress(file)
      const dt = new DataTransfer()
      dt.items.add(small)
      if (inputRef.current) inputRef.current.files = dt.files
      setPreview(URL.createObjectURL(small))
      setRemove(false)
    } catch {
      setLocalError('Не вдалося обробити фото. Спробуйте інше.')
      e.target.value = ''
    } finally {
      setBusy(false)
    }
  }

  const shownError = localError ?? error
  return (
    <div className="adm-field is-wide">
      <span className="adm-label">Фото</span>
      <div className="adm-photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="adm-photo-preview"
          src={remove || !preview ? '/default-player.svg' : preview}
          alt="Попередній перегляд фото"
        />
        <div style={{ display: 'grid', gap: 10 }}>
          <input
            ref={inputRef}
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp"
            onChange={onChange}
            disabled={busy}
            aria-invalid={shownError ? true : undefined}
          />
          <span className="adm-hint">
            {busy ? 'Обробляю фото…' : 'Бажано вертикальне фото 3:4. Стискається автоматично.'}
          </span>
          {current && (
            <label className="adm-check">
              <input
                type="checkbox"
                name="removePhoto"
                checked={remove}
                onChange={(e) => {
                  setRemove(e.target.checked)
                  if (e.target.checked && inputRef.current) {
                    inputRef.current.value = ''
                    setPreview(current)
                  }
                }}
              />
              Прибрати фото
            </label>
          )}
          {shownError && (
            <span className="adm-error" role="alert">
              {shownError}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
