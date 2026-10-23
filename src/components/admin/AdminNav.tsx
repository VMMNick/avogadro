'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/admin', label: 'Огляд', exact: true },
  { href: '/admin/players', label: 'Гравці та штаб' },
  { href: '/admin/matches', label: 'Матчі' },
  { href: '/admin/settings', label: 'Налаштування сайту' },
  { href: '/admin/admins', label: 'Адміністратори' },
]

export function AdminNav() {
  const pathname = usePathname()
  return (
    <>
      {LINKS.map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href)
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`adm-nav-link${active ? ' is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            {l.label}
          </Link>
        )
      })}
    </>
  )
}
