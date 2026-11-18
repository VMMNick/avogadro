'use client'

import { useEffect, useRef, useState } from 'react'
import { CropDialog } from './CropDialog'
import { exportImage, ImageReadError, loadImage, type CropArea, type LoadedImage } from './image-processing'

export function PhotoInput({
  current,
  error,
  logo = false,
}: {
  current: string | null
  error?: string
  /** Режим логотипа: круглий, з прозорим фоном, до 600 px */
  logo?: boolean
}) {
  // Видиме поле вибору — лише для вибору; на сервер іде підготовлений файл із прихованого поля
  const pickerRef = useRef<HTMLInputElement>(null)
  const uploadRef = useRef<HTMLInputElement>(null)
  const [image, setImage] = useState<LoadedImage | null>(null)
  const [cropping, setCropping] = useState(false)
  const [preview, setPreview] = useState<string | null>(current)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [remove, setRemove] = useState(false)

  // React скидає форму після відправки — повертаємо початковий стан
  useEffect(() => {
    const form = uploadRef.current?.form
    if (!form) return
    const onReset = () => {
      setPreview(current)
      setRemove(false)
      setInfo(null)
      setImage(null)
    }
    form.addEventListener('reset', onReset)
    return () => form.removeEventListener('reset', onReset)
  }, [current])

  // Звільняємо пам'ять від попереднього зображення
  useEffect(() => {
    return () => {
      if (image) {
        image.bitmap.close()
        URL.revokeObjectURL(image.url)
      }
    }
  }, [image])

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // дозволяє вибрати той самий файл ще раз
    if (!file) return
    setLocalError(null)
    setBusy(true)
    try {
      const loaded = await loadImage(file)
      setImage(loaded)
      setCropping(true)
    } catch (err) {
      setLocalError(err instanceof ImageReadError ? err.message : 'Не вдалося відкрити фото. Спробуйте інше.')
    } finally {
      setBusy(false)
    }
  }

  async function finish(crop: CropArea | null, img: LoadedImage | null = image) {
    if (!img) return
    setCropping(false)
    setBusy(true)
    try {
      const file = await exportImage(img, crop, logo ? { maxSide: 600, keepTransparency: true, circle: true } : {})
      const dt = new DataTransfer()
      dt.items.add(file)
      if (uploadRef.current) uploadRef.current.files = dt.files
      setPreview(URL.createObjectURL(file))
      setRemove(false)
      setInfo(
        `${logo ? 'Круглий логотип готовий' : crop ? 'Обрізано' : 'Повне фото'} · ${Math.max(1, Math.round(file.size / 1024))} КБ`,
      )
    } catch (err) {
      setLocalError(err instanceof ImageReadError ? err.message : 'Не вдалося обробити фото.')
    } finally {
      setBusy(false)
    }
  }

  function cancelCrop() {
    setCropping(false)
    // Якщо фото ще не було підготовлене — повністю скасовуємо вибір
    if (!uploadRef.current?.files?.length) setImage(null)
  }

  const shownError = localError ?? error
  const hasNewPhoto = Boolean(info)

  return (
    <div className="adm-field is-wide">
      <span className="adm-label">{logo ? 'Логотип' : 'Фото'}</span>
      <div className={`adm-photo${logo ? ' is-logo' : ''}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="adm-photo-preview"
          src={remove || !preview ? (logo ? '/images/icon-192.png' : '/default-player.svg') : preview}
          alt={logo ? 'Попередній перегляд логотипа' : 'Попередній перегляд фото'}
        />
        <div className="adm-photo-controls">
          <input ref={uploadRef} type="file" name="photo" hidden tabIndex={-1} aria-hidden="true" />
          <input ref={pickerRef} type="file" accept="image/*,.heic,.heif" onChange={onPick} disabled={busy} hidden />
          <div className="adm-actions">
            <button type="button" className="adm-btn" onClick={() => pickerRef.current?.click()} disabled={busy}>
              {busy
                ? 'Обробляю…'
                : logo
                  ? current || hasNewPhoto
                    ? 'Вибрати інший логотип'
                    : 'Вибрати логотип'
                  : current || hasNewPhoto
                    ? 'Вибрати інше фото'
                    : 'Вибрати фото'}
            </button>
            {image && hasNewPhoto && (
              <button type="button" className="adm-btn" onClick={() => setCropping(true)} disabled={busy}>
                {logo ? 'Змінити коло' : 'Обрізати ще раз'}
              </button>
            )}
          </div>
          <span className="adm-hint">
            {info ??
              (logo
                ? 'Логотип обрізається в коло, фон навколо — прозорий. Розмір підганяється автоматично.'
                : 'Будь-яке фото: JPG, PNG, WebP, HEIC з iPhone тощо. Розмір і якість підганяються автоматично.')}
          </span>
          {current && !hasNewPhoto && (
            <label className="adm-check">
              <input
                type="checkbox"
                name="removePhoto"
                checked={remove}
                onChange={(e) => setRemove(e.target.checked)}
              />
              {logo ? 'Прибрати логотип' : 'Прибрати фото'}
            </label>
          )}
          {shownError && (
            <span className="adm-error" role="alert">
              {shownError}
            </span>
          )}
        </div>
      </div>

      {cropping && image && (
        <CropDialog
          round={logo}
          imageUrl={image.url}
          onApply={(area) => finish(area)}
          onSkip={() => finish(null)}
          onCancel={cancelCrop}
        />
      )}
    </div>
  )
}
