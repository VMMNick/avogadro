'use client'

import { CalendarIcon, PinIcon } from './Icons'
import { useState } from 'react'
import type { MatchKind } from '@/db/schema'
import { mapLinks } from '@/lib/maps'
import { googleCalendarUrl } from '@/lib/calendar'
import { formatMatchDate, getDict, localePrefix, type Locale } from '@/lib/i18n'
import { hasScore, isWin, type PublicMatch } from '@/lib/public-types'
import { seasonLabel } from '@/lib/seasons'
import { useMatches } from './MatchesStore'

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
        <span className="team-title">
          <span className="team-title-with-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="team-logo team-logo-ours"
              src="/images/emblem-96.png"
              srcSet="/images/emblem-96.png 1x, /images/emblem-192.png 2x"
              alt=""
              width={40}
              height={40}
              loading="lazy"
            />
            {t.clubName}
          </span>
        </span>
        {scored ? (
          <span className={`match-score${result}`}>
            {match.ourSets}:{match.theirSets}
          </span>
        ) : (
          <span className="vs-badge">{match.isPast ? '—' : t.matches.vs}</span>
        )}
        <span className="team-title">
          <span className="team-title-with-logo">
            {match.opponentLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="team-logo" src={match.opponentLogo} alt="" width={40} height={40} loading="lazy" />
            ) : (
              // Літера — через CSS, щоб не потрапляла в текст назви команди
              <span
                className="team-initial"
                aria-hidden="true"
                data-initial={match.opponent.trim().charAt(0).toUpperCase()}
              />
            )}
            {match.opponent}
          </span>
        </span>
      </div>
      {match.sets && match.sets.length > 0 && (
        <p className="match-sets" aria-label={t.detail.sets}>
          {match.sets.map(([a, b], i) => (
            <span key={i}>
              {i > 0 && ' · '}
              {a > b ? (
                <b>
                  {a}:{b}
                </b>
              ) : (
                `${a}:${b}`
              )}
            </span>
          ))}
        </p>
      )}
      {match.location && (
        <div className="match-location">
          <a href={mapLinks(match.mapQuery ?? match.location).open} target="_blank" rel="noopener noreferrer">
            <PinIcon /> {match.location}
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
            <CalendarIcon /> {t.matches.addToCalendar}
          </a>
        )}
      </div>
    </article>
  )
}

export function MatchesSection({
  defaultSeason,
  tournaments,
  locale,
  siteUrl,
}: {
  defaultSeason: string
  /** Турніри, у яких є хоча б одна гра (за весь час) */
  tournaments: { id: string; name: string }[]
  locale: Locale
  siteUrl: string
}) {
  const t = getDict(locale)
  const { matches, seasons, archiveState, ensureArchive } = useMatches()
  const loadedSeasons = new Set(matches.map((m) => m.season))
  const [kind, setKind] = useState<KindFilter>('all')
  const [season, setSeason] = useState(defaultSeason)
  const [tournament, setTournament] = useState('all')
  const [shownPast, setShownPast] = useState(STEP)
  const [shownUpcoming, setShownUpcoming] = useState(STEP)

  const usedTournaments = tournaments
  // Архів потрібен для «Усіх сезонів» і для старих сезонів, яких ще немає на сторінці
  const needsArchive = (s: string) => s === 'all' || !loadedSeasons.has(s)
  const waiting = archiveState === 'loading' && needsArchive(season)

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
                if (needsArchive(e.target.value)) ensureArchive()
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
                if (season === 'all') ensureArchive()
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
      {(waiting || archiveState === 'error') && (
        <p className="archive-status" role="status">
          {archiveState === 'error' ? (
            <>
              {t.archive.error}{' '}
              <button type="button" className="match-link" onClick={ensureArchive}>
                ↻
              </button>
            </>
          ) : (
            t.archive.loading
          )}
        </p>
      )}
      <div className="matches-columns" aria-live="polite" aria-busy={waiting || undefined}>
        <div>
          <h3 className="subsection-title" data-reveal>
            {t.matches.upcoming}
          </h3>
          <div className="match-list" data-reveal="stagger">
            {upcoming.length ? (
              upcoming
                .slice(0, shownUpcoming)
                .map((m) => <MatchCard key={m.id} match={m} locale={locale} siteUrl={siteUrl} />)
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
