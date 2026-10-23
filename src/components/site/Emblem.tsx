/* eslint-disable @next/next/no-img-element -- статичні файли емблеми вже оптимізовані */

/** Мала емблема (шапка, підвал): PNG 96/192 для звичайних і retina-екранів. */
export function EmblemSmall({ className, size }: { className: string; size: number }) {
  return (
    <img
      className={className}
      src="/images/emblem-96.png"
      srcSet="/images/emblem-96.png 1x, /images/emblem-192.png 2x"
      alt=""
      width={size}
      height={size}
    />
  )
}

/** Велика емблема для головного екрана: WebP з PNG-запасом. */
export function EmblemLarge() {
  return (
    <picture>
      <source type="image/webp" srcSet="/images/emblem-512.webp 1x, /images/emblem-1024.webp 2x" />
      <img
        src="/images/emblem-512.png"
        alt="Емблема волейбольної команди «Авогадро»"
        width={512}
        height={512}
        fetchPriority="high"
      />
    </picture>
  )
}
