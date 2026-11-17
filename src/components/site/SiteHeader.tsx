'use client'

import { useEffect, useState } from 'react'
import { EmblemSmall } from './Emblem'
import { getDict, localePrefix, type Locale } from '@/lib/i18n'

const SECTIONS = ['about', 'team', 'matches', 'stats', 'contacts'] as const

/**
 * Шапка сайту. На головній посилання ведуть до розділів сторінки (#matches),
 * на інших сторінках — на головну з потрібним розділом (/#matches).
 */
export function SiteHeader({
  locale,
  onHome = true,
  altHref,
}: {
  locale: Locale
  onHome?: boolean
  /** Та сама сторінка іншою мовою */
  altHref: string
}) {
  const t = getDict(locale)
  const [open, setOpen] = useState(false)
  const base = onHome ? '' : `${localePrefix(locale)}/`

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <header className="header">
        <div className="container header-container">
          <a href={onHome ? '#top' : `${localePrefix(locale)}/`} className="logo" aria-label={t.logoLabel}>
            <EmblemSmall className="logo-emblem" size={48} />
            <span className="logo-text">
              <span className="logo-name">{t.clubName}</span>
              <span className="logo-sub">{t.logoSub}</span>
            </span>
          </a>
          <button
            className="nav-toggle"
            type="button"
            aria-label={open ? t.menuClose : t.menuOpen}
            aria-expanded={open}
            aria-controls="site-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
          <nav className={`nav${open ? ' is-open' : ''}`} id="site-nav" aria-label={t.mainMenu}>
            {SECTIONS.map((id, i) => (
              <a
                key={id}
                href={`${base}#${id}`}
                onClick={() => setOpen(false)}
                style={{ '--i': i } as React.CSSProperties}
              >
                {t.nav[id]}
              </a>
            ))}
            <a
              href={altHref}
              className="lang-switch"
              hrefLang={locale === 'uk' ? 'en' : 'uk'}
              lang={locale === 'uk' ? 'en' : 'uk'}
              aria-label={`${t.langSwitch.label}: ${t.langSwitch.otherFull}`}
              style={{ '--i': SECTIONS.length } as React.CSSProperties}
            >
              {t.langSwitch.other}
            </a>
          </nav>
        </div>
        <span className="scroll-progress" aria-hidden="true" />
      </header>
      {/* Поза шапкою: backdrop-filter шапки інакше обмежив би затемнення її висотою */}
      <div className={`nav-backdrop${open ? ' is-open' : ''}`} aria-hidden="true" onClick={() => setOpen(false)} />
    </>
  )
}
