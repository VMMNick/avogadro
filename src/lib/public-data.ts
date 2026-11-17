import 'server-only'
import type { Match, Tournament, Venue } from '@/db/schema'
import { normalizeMapQuery } from './maps'
import { seasonKey } from './seasons'
import { isPastMatch } from './data'
import type { PublicMatch } from './public-types'
import type { CalendarEvent } from './calendar'
import { getDict, localePrefix, type Locale } from './i18n'
import { SITE_URL } from './constants'

export function toPublicMatch(
  m: Match,
  venues: Map<string, Venue>,
  tournaments: Map<string, Tournament>,
  now: number,
): PublicMatch {
  const venue = m.venueId ? venues.get(m.venueId) : undefined
  return {
    id: m.id,
    opponent: m.opponent,
    opponentKey: m.teamId ?? `name:${m.opponent.trim().toLowerCase()}`,
    startsAt: m.startsAt.toISOString(),
    location: m.location,
    mapQuery: venue ? (normalizeMapQuery(venue.mapQuery) ?? normalizeMapQuery(venue.address) ?? venue.name) : null,
    ourSets: m.ourSets,
    theirSets: m.theirSets,
    kind: m.kind,
    tournamentId: m.tournamentId,
    tournament: m.tournamentId ? (tournaments.get(m.tournamentId)?.name ?? null) : null,
    season: seasonKey(m.startsAt),
    isPast: isPastMatch(m, now),
  }
}

/** Матчі для головної: з ознакою «зіграно», сезоном і сезоном за замовчуванням. */
export function prepareMatches(matches: Match[], venues: Venue[], tournaments: Tournament[]) {
  const now = Date.now()
  const venueById = new Map(venues.map((v) => [v.id, v]))
  const tournamentById = new Map(tournaments.map((tr) => [tr.id, tr]))
  const publicMatches = matches.map((m) => toPublicMatch(m, venueById, tournamentById, now))
  // Поточний сезон, а якщо в ньому ще немає ігор — останній, де вони були
  const seasons = [...new Set(publicMatches.map((m) => m.season))].sort()
  const current = seasonKey(new Date(now))
  const defaultSeason = seasons.includes(current) ? current : (seasons.at(-1) ?? 'all')
  return { publicMatches, defaultSeason, venueById, tournamentById }
}

export const matchUrl = (id: string, locale: Locale = 'uk') => `${SITE_URL}${localePrefix(locale)}/matches/${id}`

/** Подія календаря для матчу. */
export function matchEvent(
  m: Pick<Match, 'id' | 'opponent' | 'startsAt' | 'location' | 'ourSets' | 'theirSets' | 'kind' | 'updatedAt'>,
  opts: { locale?: Locale; venueAddress?: string | null; tournament?: string | null } = {},
): CalendarEvent {
  const locale = opts.locale ?? 'uk'
  const t = getDict(locale)
  const score = m.ourSets !== null && m.theirSets !== null ? ` ${m.ourSets}:${m.theirSets}` : ''
  const title = `🏐 ${t.clubName} — ${m.opponent}${score}`
  const notes = [
    m.kind === 'friendly' ? t.matches.friendlyBadge : null,
    opts.tournament ?? null,
  ].filter(Boolean)
  const location = [m.location, opts.venueAddress].filter(Boolean).join(', ')
  return {
    uid: `${m.id}@avogadro`,
    title,
    start: m.startsAt,
    location: location || null,
    description: notes.length ? notes.join(' · ') : null,
    url: matchUrl(m.id, locale),
    updatedAt: m.updatedAt,
  }
}
