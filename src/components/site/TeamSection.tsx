'use client'

import { useState } from 'react'
import type { PlayerRole } from '@/db/schema'
import { PLAYER_ROLES } from '@/db/schema'
import { getDict, type Locale } from '@/lib/i18n'

export type PublicPlayer = {
  id: string
  name: string
  number: number | null
  role: PlayerRole
  photoUrl: string | null
  /** Зіграно ігор (за відміченим складом) */
  games: number
  /** Скільки разів був MVP матчу */
  mvps: number
}

export function TeamSection({ players, locale }: { players: PublicPlayer[]; locale: Locale }) {
  const t = getDict(locale)
  const [role, setRole] = useState<PlayerRole | 'all'>('all')
  const visible = role === 'all' ? players : players.filter((p) => p.role === role)

  return (
    <>
      <div className="filters" data-reveal role="group" aria-label={t.team.filterLabel}>
        {(['all', ...PLAYER_ROLES] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={`filter-btn${role === value ? ' active' : ''}`}
            aria-pressed={role === value}
            onClick={() => setRole(value)}
          >
            {t.roleFilters[value]}
          </button>
        ))}
      </div>

      <div className="team-grid" data-reveal="stagger" aria-live="polite">
        {players.length === 0 ? (
          <p className="state-message">{t.team.empty}</p>
        ) : visible.length === 0 ? (
          <p className="state-message">{t.team.emptyRole}</p>
        ) : (
          visible.map((p) => (
            <article key={p.id} className="player-card">
              <div className="player-photo">
                {/* eslint-disable-next-line @next/next/no-img-element -- фото вже стиснуті при завантаженні */}
                <img
                  src={p.photoUrl ?? '/default-player.svg'}
                  alt={p.name}
                  loading="lazy"
                  width={480}
                  height={640}
                />
                {p.number !== null && <span className="player-number">#{p.number}</span>}
              </div>
              <div className="player-info">
                <h3>{p.name}</h3>
                <p className="player-role">{t.roles[p.role]}</p>
                {(p.games > 0 || p.mvps > 0) && (
                  <p className="player-stats">
                    {p.games > 0 && <span>{t.team.games(p.games)}</span>}
                    {p.mvps > 0 && <span className="player-mvp">★ {t.team.mvps(p.mvps)}</span>}
                  </p>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </>
  )
}
