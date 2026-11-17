/** Іконки в стилі сайту: тонкий контур кольору тексту (золотий у посиланнях), без емодзі. */

type IconProps = { className?: string; size?: number }

export function CalendarIcon({ className = 'icon', size = 18 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="3" y="4.5" width="18" height="16.5" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 9.5h18" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 2.5v4M16 2.5v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {/* «м'яч» на даті гри — як ядро атома з емблеми */}
      <circle cx="12" cy="15.25" r="3" fill="currentColor" />
      <ellipse cx="12" cy="15.25" rx="5.2" ry="1.7" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.7" transform="rotate(-25 12 15.25)" />
    </svg>
  )
}

export function PinIcon({ className = 'icon', size = 16 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 21.5s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0c0 5-6.5 11.2-6.5 11.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10.2" r="2.4" fill="currentColor" />
    </svg>
  )
}

/** Велика іконка в золотому «щиті», як на емблемі клубу. */
export function CalendarBadge() {
  return (
    <span className="icon-badge" aria-hidden="true">
      <CalendarIcon size={26} />
    </span>
  )
}
