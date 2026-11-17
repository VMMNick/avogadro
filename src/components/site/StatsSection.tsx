'use client'

import { useState } from 'react'
import type { MatchKind } from '@/db/schema'
import { formatMatchDate, getDict, localePrefix, type Locale } from '@/lib/i18n'
import { hasScore, isWin, type PublicMatch, type PublicPlayerRef } from '@/lib/public-types'
import { seasonLabel } from '@/lib/seasons'
import { useMatches } from './MatchesStore'

type KindFilter = 'all' | MatchKind

export type Summary = {
  played: number
  wins: number
  losses: number
  setsFor: number
  setsAgainst: number
  /** Поточна серія: >0 — перемоги поспіль, <0 — поразки поспіль */
  streak: number
  /** Останні до 5 результатів, від найстарішого до найновішого */
  form: boolean[]
  /** Очки за матчами, де внесено рахунок по сетах */
  pointsFor: number
  pointsAgainst: number
  /** Сет з найбільшою сумою очок */
  longest: { our: number; their: number; opponent: string; matchId: string } | null
}

/** Підсумки за списком зіграних матчів з рахунком. */
export function summarize(list: PublicMatch[]): Summary {
  const played = list.filter((m) => m.isPast && hasScore(m)).sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  const results = played.map(isWin)
  let streak = 0
  for (let i = results.length - 1; i >= 0; i--) {
    if (streak === 0) streak = results[i] ? 1 : -1
    else if (results[i] === streak > 0) streak += streak > 0 ? 1 : -1
    else break
  }
  return {
    played: played.length,
    wins: results.filter(Boolean).length,
    losses: results.filter((r) => !r).length,
    setsFor: played.reduce((s, m) => s + m.ourSets!, 0),
    setsAgainst: played.reduce((s, m) => s + m.theirSets!, 0),
    streak,
    form: results.slice(-5),
    ...pointsSummary(played),
  }
}

function pointsSummary(list: PublicMatch[]) {
  let pointsFor = 0
  let pointsAgainst = 0
  let longest: Summary['longest'] = null
  for (const m of list) {
    for (const [our, their] of m.sets ?? []) {
      pointsFor += our
      pointsAgainst += their
      if (!longest || our + their > longest.our + longest.their)
        longest = { our, their, opponent: m.opponent, matchId: m.id }
    }
  }
  return { pointsFor, pointsAgainst, longest }
}

export function StatsSection({
  defaultSeason,
  locale,
  players,
}: {
  defaultSeason: string
  locale: Locale
  players: PublicPlayerRef[]
}) {
  const t = getDict(locale)
  const { matches, seasons, archiveState, ensureArchive } = useMatches()
  const loadedSeasons = new Set(matches.map((m) => m.season))
  const needsArchive = (s: string) => s === 'all' || !loadedSeasons.has(s)
  const [season, setSeason] = useState(defaultSeason)
  const [kind, setKind] = useState<KindFilter>('all')

  const scoped = matches.filter((m) => (kind === 'all' || m.kind === kind) && (season === 'all' || m.season === season))
  const s = summarize(scoped)
  const winRate = s.played ? Math.round((s.wins / s.played) * 100) : 0

  // MVP: хто найчастіше був найкращим у вибраних іграх
  const playerById = new Map(players.map((p) => [p.id, p]))
  const mvpCounts = new Map<string, number>()
  for (const m of scoped) {
    if (m.isPast && m.mvpPlayerId && playerById.has(m.mvpPlayerId)) {
      mvpCounts.set(m.mvpPlayerId, (mvpCounts.get(m.mvpPlayerId) ?? 0) + 1)
    }
  }
  const mvpTop = [...mvpCounts.entries()]
    .sort((a, b) => b[1] - a[1] || playerById.get(a[0])!.name.localeCompare(playerById.get(b[0])!.name, t.intl))
    .slice(0, 3)

  // Суперники, з якими вже грали (за весь час)
  const opponentMap = new Map<string, { key: string; name: string; last: string }>()
  for (const m of matches) {
    if (!m.isPast || !hasScore(m)) continue
    const prev = opponentMap.get(m.opponentKey)
    if (!prev || prev.last < m.startsAt)
      opponentMap.set(m.opponentKey, { key: m.opponentKey, name: m.opponent, last: m.startsAt })
  }
  const opponents = [...opponentMap.values()].sort((a, b) => a.name.localeCompare(b.name, t.intl))
  const [opponent, setOpponent] = useState('')
  const h2hMatches = opponent
    ? matches
        .filter((m) => m.opponentKey === opponent && m.isPast && hasScore(m))
        .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
    : []
  const h2h = summarize(h2hMatches)

  return (
    <>
      <div className="match-filters" data-reveal>
        <div className="filters" role="group" aria-label={t.matches.kindLabel}>
          {(['all', 'official', 'friendly'] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={`filter-btn${kind === value ? ' active' : ''}`}
              aria-pressed={kind === value}
              onClick={() => setKind(value)}
            >
              {t.matches.kinds[value]}
            </button>
          ))}
        </div>
        {seasons.length > 0 && (
          <label className="select-pill">
            <span>{t.matches.season}</span>
            <select
              value={season}
              onChange={(e) => {
                setSeason(e.target.value)
                if (needsArchive(e.target.value)) ensureArchive()
              }}
            >
              <option value="all">{t.matches.allSeasons}</option>
              {seasons.map((key) => (
                <option key={key} value={key}>
                  {seasonLabel(key)}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {archiveState === 'loading' && needsArchive(season) && (
        <p className="archive-status" role="status">
          {t.archive.loading}
        </p>
      )}
      {s.played === 0 ? (
        <p className="state-message" data-reveal>
          {t.stats.empty}
        </p>
      ) : (
        <div className="stats-grid" data-reveal="stagger" aria-live="polite">
          <div className="stat-tile">
            <span className="stat-value">{s.played}</span>
            <span className="stat-label">{t.stats.played}</span>
          </div>
          <div className="stat-tile is-win">
            <span className="stat-value">{s.wins}</span>
            <span className="stat-label">{t.stats.wins}</span>
          </div>
          <div className="stat-tile is-loss">
            <span className="stat-value">{s.losses}</span>
            <span className="stat-label">{t.stats.losses}</span>
          </div>
          <div className="stat-tile">
            <span className="stat-value">{winRate}</span>
            <span className="stat-label">{t.stats.winRate}</span>
            <span className="stat-bar" aria-hidden="true">
              <span style={{ transform: `scaleX(${winRate / 100})` }} />
            </span>
          </div>
          <div className="stat-tile">
            <span className="stat-value">
              {s.setsFor}:{s.setsAgainst}
            </span>
            <span className="stat-label">{t.stats.sets}</span>
          </div>
          <div className="stat-tile is-wide">
            <span className="stat-label">{t.stats.form}</span>
            <span className="form-row">
              {s.form.map((w, i) => (
                <span
                  key={i}
                  className={`form-pill${w ? ' is-win' : ' is-loss'}`}
                  title={w ? t.stats.formWinTitle : t.stats.formLossTitle}
                >
                  {w ? t.stats.formWin : t.stats.formLoss}
                </span>
              ))}
            </span>
            <span className="stat-sub">
              {t.stats.streak}: {s.streak > 0 ? t.stats.streakWin(s.streak) : t.stats.streakLoss(-s.streak)}
            </span>
          </div>
        </div>
      )}
      {s.played > 0 && (s.pointsFor + s.pointsAgainst > 0 || s.longest || mvpTop.length > 0) && (
        <div className="stats-extra" data-reveal="stagger">
          {s.pointsFor + s.pointsAgainst > 0 && (
            <div className="stat-tile">
              <span className="stat-value">
                {s.pointsFor}:{s.pointsAgainst}
              </span>
              <span className="stat-label">{t.stats.points}</span>
            </div>
          )}
          {s.longest && (
            <a className="stat-tile is-link" href={`${localePrefix(locale)}/matches/${s.longest.matchId}`}>
              <span className="stat-value">
                {s.longest.our}:{s.longest.their}
              </span>
              <span className="stat-label">{t.stats.longestSet}</span>
              <span className="stat-sub">{t.stats.longestSetVs(s.longest.opponent)}</span>
            </a>
          )}
          {mvpTop.length > 0 && (
            <div className="stat-tile is-mvp">
              <span className="stat-label">★ {season === 'all' ? t.stats.mvpAll : t.stats.mvpTitle}</span>
              <ol className="mvp-list">
                {mvpTop.map(([id, n]) => {
                  const p = playerById.get(id)!
                  return (
                    <li key={id}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.photoUrl ?? '/default-player.svg'} alt="" width={40} height={40} loading="lazy" />
                      <span className="mvp-name">
                        {p.number !== null && <span className="mvp-number">#{p.number}</span>} {p.name}
                      </span>
                      <span className="mvp-count">{t.stats.mvpTimes(n)}</span>
                    </li>
                  )
                })}
              </ol>
            </div>
          )}
        </div>
      )}
      <p className="stats-note">{t.stats.note}</p>

      {opponents.length > 0 && (
        <div className="h2h-card" data-reveal>
          <div className="h2h-head">
            <h3 className="subsection-title">{t.stats.h2hTitle}</h3>
            <label className="select-pill">
              <span className="sr-only">{t.stats.h2hPick}</span>
              <select
                value={opponent}
                onFocus={ensureArchive}
                onChange={(e) => {
                  setOpponent(e.target.value)
                  ensureArchive()
                }}
                aria-label={t.stats.h2hPick}
              >
                <option value="">{t.stats.h2hPick}…</option>
                {opponents.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {opponent &&
            (h2h.played === 0 ? (
              <p className="state-message">{t.stats.h2hEmpty}</p>
            ) : (
              <div className="h2h-body" aria-live="polite">
                <p className="h2h-record">
                  <strong>{t.stats.h2hRecord(h2h.wins, h2h.losses)}</strong>
                  <span>
                    {' · '}
                    {t.stats.h2hSets} {h2h.setsFor}:{h2h.setsAgainst}
                  </span>
                </p>
                <ul className="h2h-list">
                  {h2hMatches.map((m) => (
                    <li key={m.id}>
                      <a href={`${localePrefix(locale)}/matches/${m.id}`}>
                        <time dateTime={m.startsAt}>{formatMatchDate(m.startsAt, locale)}</time>
                        <span className={`match-score${isWin(m) ? ' is-win' : ' is-loss'}`}>
                          {m.ourSets}:{m.theirSets}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      )}
    </>
  )
}
