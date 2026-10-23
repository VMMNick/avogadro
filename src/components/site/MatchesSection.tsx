'use client'

import { useState } from 'react'
import type { MatchKind } from '@/db/schema'
import { CLUB_NAME } from '@/lib/constants'
import { formatDateTime } from '@/lib/format'
import { mapLinks } from '@/lib/maps'

export type PublicMatch = {
  id: string
  opponent: string
  startsAt: string // ISO
  location: string | null
  ourSets: number | null
  theirSets: number | null
  kind: MatchKind
}

type Filter = 'all' | MatchKind

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Усі' },
  { value: 'official', label: 'Офіційні' },
  { value: 'friendly', label: 'Товариські' },
]

const LIMIT = 6

function MatchCard({ match, past }: { match: PublicMatch; past: boolean }) {
  const hasScore = match.ourSets !== null && match.theirSets !== null
  const result = hasScore ? (match.ourSets! > match.theirSets! ? ' is-win' : ' is-loss') : ''
  const friendly = match.kind === 'friendly'
  return (
    <article className={`match-card${past ? ' is-past' : ''}${friendly ? ' is-friendly' : ''}`}>
      <div className="match-meta">
        <time className="match-date" dateTime={match.startsAt}>
          {formatDateTime(new Date(match.startsAt))}
        </time>
        {friendly && <span className="match-kind">Товариська</span>}
      </div>
      <div className="teams-vs">
        <span className="team-title">{CLUB_NAME}</span>
        {hasScore ? (
          <span className={`match-score${result}`}>
            {match.ourSets}:{match.theirSets}
          </span>
        ) : (
          <span className="vs-badge">{past ? '—' : 'VS'}</span>
        )}
        <span className="team-title">{match.opponent}</span>
      </div>
      {match.location && (
        <div className="match-location">
          <a href={mapLinks(match.location).open} target="_blank" rel="noopener noreferrer">
            📍 {match.location}
          </a>
        </div>
      )}
    </article>
  )
}

export function MatchesSection({ upcoming, past }: { upcoming: PublicMatch[]; past: PublicMatch[] }) {
  const [filter, setFilter] = useState<Filter>('all')
  const pick = (list: PublicMatch[]) =>
    (filter === 'all' ? list : list.filter((m) => m.kind === filter)).slice(0, LIMIT)
  const shownUpcoming = pick(upcoming)
  const shownPast = pick(past)
  const label = filter === 'friendly' ? 'товариських ігор' : filter === 'official' ? 'офіційних матчів' : 'ігор'

  return (
    <>
      <div className="filters" role="group" aria-label="Тип матчів">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`filter-btn${filter === f.value ? ' active' : ''}`}
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="matches-columns" aria-live="polite">
        <div>
          <h3 className="subsection-title">Найближчі ігри</h3>
          <div className="match-list">
            {shownUpcoming.length ? (
              shownUpcoming.map((m) => <MatchCard key={m.id} match={m} past={false} />)
            ) : (
              <p className="state-message">Найближчих {label} поки не заплановано.</p>
            )}
          </div>
        </div>
        <div>
          <h3 className="subsection-title">Результати</h3>
          <div className="match-list">
            {shownPast.length ? (
              shownPast.map((m) => <MatchCard key={m.id} match={m} past />)
            ) : (
              <p className="state-message">Результатів {label} ще немає.</p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
