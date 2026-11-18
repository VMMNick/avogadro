'use client'

import { useEffect, useRef, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import type { CropArea } from './image-processing'

/** Пропорція картки гравця на сайті */
export const PHOTO_ASPECT = 3 / 4

export function CropDialog({
  imageUrl,
  onApply,
  onSkip,
  onCancel,
  round = false,
}: {
  imageUrl: string
  /** Круглий логотип 1:1 */
  round?: boolean
  onApply: (area: CropArea) => void
  onSkip: () => void
  onCancel: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [area, setArea] = useState<Area | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className="adm-crop"
      aria-labelledby="crop-title"
      onCancel={(e) => {
        e.preventDefault()
        onCancel()
      }}
    >
      <div className="adm-crop-head">
        <h2 id="crop-title">{round ? 'Логотип у колі' : 'Обрізка фото'}</h2>
        <p className="adm-muted">
          {round
            ? 'Пересуньте й наблизьте, щоб емблема заповнила коло. Усе поза колом стане прозорим. Або впишіть логотип у коло повністю.'
            : 'Пересуньте фото й наблизьте, щоб гравець був у рамці 3:4 — як у картці на сайті. Або залиште фото повністю.'}
        </p>
      </div>

      <div className="adm-crop-area">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          minZoom={1}
          maxZoom={5}
          aspect={round ? 1 : PHOTO_ASPECT}
          cropShape={round ? 'round' : 'rect'}
          showGrid={!round}
          objectFit="contain"
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_, pixels) => setArea(pixels)}
        />
      </div>

      <label className="adm-crop-zoom">
        <span>Масштаб</span>
        <input
          type="range"
          min={1}
          max={5}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          aria-label="Масштаб"
        />
      </label>

      <div className="adm-actions adm-crop-actions">
        <button type="button" className="adm-btn adm-btn-primary" autoFocus onClick={() => area && onApply(area)}>
          {round ? 'Готово' : 'Обрізати'}
        </button>
        <button type="button" className="adm-btn" onClick={onSkip}>
          {round ? 'Вписати повністю' : 'Без обрізки'}
        </button>
        <button type="button" className="adm-btn adm-crop-cancel" onClick={onCancel}>
          Скасувати
        </button>
      </div>
    </dialog>
  )
}
