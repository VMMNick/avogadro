'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { AdminRole } from '@/db/schema'

const LINKS: { href: string; label: string; exact?: boolean; adminOnly?: boolean; badge?: 'applications' }[] = [
  { href: '/admin', label: 'Огляд', exact: true },
  { href: '/admin/players', label: 'Гравці та штаб' },
  { href: '/admin/matches', label: 'Матчі' },
  { href: '/admin/teams', label: 'Команди' },
  { href: '/admin/venues', label: 'Зали' },
  { href: '/admin/tournaments', label: 'Турніри' },
  { href: '/admin/achievements', label: 'Досягнення' },
  { href: '/admin/trainings', label: 'Тренування' },
  { href: '/admin/applications', label: 'Заявки', badge: 'applications' },
  { href: '/admin/settings', label: 'Налаштування сайту', adminOnly: true },
  { href: '/admin/admins', label: 'Адміністратори', adminOnly: true },
  { href: '/admin/account', label: 'Мій акаунт' },
]

export function AdminNav({ role, newApplications }: { role: AdminRole; newApplications: number }) {
  const pathname = usePathname()
  return (
    <>
      {LINKS.filter((l) => !l.adminOnly || role === 'admin').map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href)
        const badge = l.badge === 'applications' && newApplications > 0 ? newApplications : null
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`adm-nav-link${active ? ' is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            {l.label}
            {badge !== null && (
              <span className="adm-nav-badge" aria-label={`нових: ${badge}`}>
                {badge}
              </span>
            )}
          </Link>
        )
      })}
    </>
  )
}
