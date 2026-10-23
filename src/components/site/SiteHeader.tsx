'use client'

import { useState } from 'react'
import { EmblemSmall } from './Emblem'

const LINKS = [
  { href: '#about', label: 'Про клуб' },
  { href: '#team', label: 'Склад команди' },
  { href: '#matches', label: 'Матчі' },
  { href: '#contacts', label: 'Контакти' },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
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
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <a href="/admin" className="btn-admin" rel="nofollow">
            Адмін-панель
          </a>
        </nav>
      </div>
    </header>
  )
}
