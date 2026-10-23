'use client'

import { useEffect, useState } from 'react'
import { EmblemSmall } from './Emblem'

const LINKS = [
  { href: '#about', label: 'Про клуб' },
  { href: '#team', label: 'Склад команди' },
  { href: '#matches', label: 'Матчі' },
  { href: '#contacts', label: 'Контакти' },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)

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
          <a href="#top" className="logo" aria-label="ВК Авогадро — на початок сторінки">
            <EmblemSmall className="logo-emblem" size={48} />
            <span className="logo-text">
              <span className="logo-name">Авогадро</span>
              <span className="logo-sub">Волейбольний клуб</span>
            </span>
          </a>
          <button
            className="nav-toggle"
            type="button"
            aria-label={open ? 'Закрити меню' : 'Відкрити меню'}
            aria-expanded={open}
            aria-controls="site-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
          <nav className={`nav${open ? ' is-open' : ''}`} id="site-nav" aria-label="Головне меню">
            {LINKS.map((l, i) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                style={{ '--i': i } as React.CSSProperties}
              >
                {l.label}
              </a>
            ))}
            <a
              href="/admin"
              className="btn-admin"
              rel="nofollow"
              style={{ '--i': LINKS.length } as React.CSSProperties}
            >
              Адмін-панель
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
