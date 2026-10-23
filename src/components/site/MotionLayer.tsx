'use client'

import { useEffect } from 'react'

// Частинки фону: фіксовані значення, щоб сервер і браузер малювали однаково.
// [позиція по горизонталі %, розмір px, тривалість s, затримка s, зсув убік px]
const PARTICLES: [number, number, number, number, number][] = [
  [6, 3, 19, 0, 30],
  [14, 2, 23, 6, -20],
  [22, 4, 17, 11, 25],
  [31, 2, 25, 3, -35],
  [39, 3, 21, 14, 20],
  [47, 2, 18, 8, -15],
  [55, 4, 24, 1, 35],
  [63, 2, 20, 12, -25],
  [71, 3, 22, 5, 15],
  [79, 2, 26, 16, -30],
  [87, 4, 19, 9, 20],
  [94, 2, 23, 2, -20],
  [10, 2, 27, 18, 15],
  [50, 3, 28, 20, -10],
  [84, 2, 29, 22, 25],
]

/**
 * Анімований фон і плавна поява блоків під час прокручування.
 * Блоки з атрибутом data-reveal з'являються, коли доходять до екрана;
 * data-reveal="stagger" — дочірні картки з'являються по черзі.
 */
export function MotionLayer() {
  useEffect(() => {
    const root = document.documentElement
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const items = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))

    let observer: IntersectionObserver | null = null
    if (reduce || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-in'))
    } else {
      // Те, що вже на екрані, не ховаємо — інакше воно б «блимнуло»
      const vh = window.innerHeight
      observer = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              e.target.classList.add('is-in')
              observer?.unobserve(e.target)
            }
          }
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
      )
      for (const el of items) {
        const r = el.getBoundingClientRect()
        if (r.top < vh * 0.92 && r.bottom > 0) el.classList.add('is-in')
        else observer.observe(el)
      }
      root.classList.add('motion-ready')
    }

    // Шапка стає щільнішою після прокручування + смужка прогресу
    let frame = 0
    const update = () => {
      frame = 0
      const y = window.scrollY
      const max = document.documentElement.scrollHeight - window.innerHeight
      root.toggleAttribute('data-scrolled', y > 24)
      root.style.setProperty('--scroll-progress', max > 0 ? Math.min(1, y / max).toFixed(4) : '0')
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    return () => {
      observer?.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
      root.classList.remove('motion-ready')
    }
  }, [])

  return (
    <div className="bg-fx" aria-hidden="true">
      <span className="bg-blob bg-blob-1" />
      <span className="bg-blob bg-blob-2" />
      <span className="bg-blob bg-blob-3" />
      <svg className="bg-atom" viewBox="-300 -300 600 600" focusable="false">
        <g>
          <ellipse rx="280" ry="92" />
          <ellipse rx="280" ry="92" transform="rotate(60)" />
          <ellipse rx="280" ry="92" transform="rotate(-60)" />
          <circle cx="280" cy="0" r="6" />
          <circle cx="-140" cy="242" r="5" />
        </g>
      </svg>
      <span className="bg-stripes" />
      <div className="bg-particles">
        {PARTICLES.map(([x, size, dur, delay, dx], i) => (
          <span
            key={i}
            style={
              {
                left: `${x}%`,
                width: size,
                height: size,
                animationDuration: `${dur}s`,
                animationDelay: `-${delay}s`,
                '--dx': `${dx}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </div>
  )
}
