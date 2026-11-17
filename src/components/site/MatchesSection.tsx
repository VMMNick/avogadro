'use client'

import { useMemo, useState } from 'react'
import type { MatchKind } from '@/db/schema'
import { mapLinks } from '@/lib/maps'
import { googleCalendarUrl } from '@/lib/calendar'
import { formatMatchDate, getDict, localePrefix, type Locale } from '@/lib/i18n'
import { hasScore, isWin, type PublicMatch } from '@/lib/public-types'
import { seasonLabel } from '@/lib/seasons'

export type { PublicMatch }

type KindFilter = 'all' | MatchKind

const STEP = 6

export function MatchCard({ match, locale, siteUrl }: { match: PublicMatch; locale: Locale; siteUrl: string }) {
  const t = getDict(locale)
  const scored = hasScore(match)
  const result = scored ? (isWin(match) ? ' is-win' : ' is-loss') : ''
  const friendly = match.kind === 'friendly'
  const detailsHref = `${localePrefix(locale)}/matches/${match.id}`
  return (
    <article className={`match-card${match.isPast ? ' is-past' : ''}${friendly ? ' is-friendly' : ''}`}>
      <div className="match-meta">
        <time className="match-date" dateTime={match.startsAt}>
          {formatMatchDate(match.startsAt, locale)}
        </time>
        {friendly && <span className="match-kind">{t.matches.friendlyBadge}</span>}
        {match.tournament && <span className="match-tournament">{match.tournament}</span>}
      </div>
      <div className="teams-vs">
        <span className="team-title">{t.clubName}</span>
        {scored ? (
          <span className={`match-score${result}`}>
            {match.ourSets}:{match.theirSets}
          </span>
        ) : (
          <span className="vs-badge">{match.isPast ? '—' : t.matches.vs}</span>
        )}
        <span className="team-title">{match.opponent}</span>
      </div>
      {match.location && (
        <div className="match-location">
          <a href={mapLinks(match.mapQuery ?? match.location).open} target="_blank" rel="noopener noreferrer">
            📍 {match.location}
          </a>
        </div>
      )}
      <div className="match-actions">
        <a href={detailsHref} className="match-link">
          {t.matches.details} →
        </a>
        {!match.isPast && (
          <a
            className="match-link"
            href={googleCalendarUrl({
              uid: match.id,
              title: `🏐 ${t.clubName} — ${match.opponent}`,
              start: new Date(match.startsAt),
              location: match.location,
              url: `${siteUrl}${detailsHref}`,
            })}
            target="_blank"
            rel="noopener noreferrer"
          >
            📅 {t.matches.addToCalendar}
          </a>
        )}
      </div>
    </article>
  )
}

export function MatchesSection({
  matches,
  defaultSeason,
  tournaments,
  locale,
  siteUrl,
}: {
  matches: PublicMatch[]
  defaultSeason: string
  tournaments: { id: string; name: string }[]
  locale: Locale
  siteUrl: string
}) {
  const t = getDict(locale)
  const [kind, setKind] = useState<KindFilter>('all')
  const [season, setSeason] = useState(defaultSeason)
  const [tournament, setTournament] = useState('all')
  const [shownPast, setShownPast] = useState(STEP)
  const [shownUpcoming, setShownUpcoming] = useState(STEP)

  const seasons = useMemo(() => [...new Set(matches.map((m) => m.season))].sort().reverse(), [matches])
  const usedTournaments = useMemo(
    () => tournaments.filter((tr) => matches.some((m) => m.tournamentId === tr.id)),
    [matches, tournaments],
  )

  const filtered = matches.filter(
    (m) =>
      (kind === 'all' || m.kind === kind) &&
      (season === 'all' || m.season === season) &&
      (tournament === 'all' || m.tournamentId === tournament),
  )
  const upcoming = filtered.filter((m) => !m.isPast).sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  const past = filtered.filter((m) => m.isPast).sort((a, b) => b.startsAt.localeCompare(a.startsAt))

  const resetPaging = () => {
    setShownPast(STEP)
    setShownUpcoming(STEP)
  }

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
              onClick={() => {
                setKind(value)
                resetPaging()
              }}
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
                resetPaging()
              }}
            >
              <option value="all">{t.matches.allSeasons}</option>
              {seasons.map((s) => (
                <option key={s} value={s}>
                  {seasonLabel(s)}
                </option>
              ))}
            </select>
          </label>
        )}
        {usedTournaments.length > 0 && (
          <label className="select-pill">
            <span>{t.matches.tournament}</span>
            <select
              value={tournament}
              onChange={(e) => {
                setTournament(e.target.value)
                resetPaging()
              }}
            >
              <option value="all">{t.matches.allTournaments}</option>
              {usedTournaments.map((tr) => (
                <option key={tr.id} value={tr.id}>
                  {tr.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="matches-columns" aria-live="polite">
        <div>
          <h3 className="subsection-title" data-reveal>
            {t.matches.upcoming}
          </h3>
          <div className="match-list" data-reveal="stagger">
            {upcoming.length ? (
              upcoming.slice(0, shownUpcoming).map((m) => <MatchCard key={m.id} match={m} locale={locale} siteUrl={siteUrl} />)
            ) : (
              <p className="state-message">{t.matches.noUpcoming}</p>
            )}
          </div>
          {upcoming.length > shownUpcoming && (
            <button type="button" className="btn-ghost show-more" onClick={() => setShownUpcoming((n) => n + STEP)}>
              {t.matches.showMore} ({upcoming.length - shownUpcoming})
            </button>
          )}
        </div>
        <div>
          <h3 className="subsection-title" data-reveal>
            {t.matches.results}
          </h3>
          <div className="match-list" data-reveal="stagger">
            {past.length ? (
              past.slice(0, shownPast).map((m) => <MatchCard key={m.id} match={m} locale={locale} siteUrl={siteUrl} />)
            ) : (
              <p className="state-message">{t.matches.noResults}</p>
            )}
          </div>
          {past.length > shownPast && (
            <button type="button" className="btn-ghost show-more" onClick={() => setShownPast((n) => n + STEP)}>
              {t.matches.showMore} ({past.length - shownPast})
            </button>
          )}
        </div>
      </div>
    </>
  )
}
