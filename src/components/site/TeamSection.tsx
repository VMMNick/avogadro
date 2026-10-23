'use client'

import { useState } from 'react'
import type { PlayerRole } from '@/db/schema'
import { ROLE_FILTERS, ROLE_LABELS } from '@/lib/constants'

export type PublicPlayer = {
  id: string
  name: string
  number: number | null
  role: PlayerRole
  photoUrl: string | null
}

export function TeamSection({ players }: { players: PublicPlayer[] }) {
  const [role, setRole] = useState<PlayerRole | 'all'>('all')
  const visible = role === 'all' ? players : players.filter((p) => p.role === role)

  return (
    <>
      <div className="filters" data-reveal role="group" aria-label="Фільтр за амплуа">
        {ROLE_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`filter-btn${role === f.value ? ' active' : ''}`}
            aria-pressed={role === f.value}
            onClick={() => setRole(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="team-grid" data-reveal="stagger" aria-live="polite">
        {players.length === 0 ? (
          <p className="state-message">Склад команди ще не додано.</p>
        ) : visible.length === 0 ? (
          <p className="state-message">У цій категорії поки нікого немає.</p>
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
                <p className="player-role">{ROLE_LABELS[p.role]}</p>
              </div>
            </article>
          ))
        )}
      </div>
    </>
  )
}
