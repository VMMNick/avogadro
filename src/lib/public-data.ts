import 'server-only'
import { getDb, schema } from '@/db'
import type { Match, Team, Tournament, Venue } from '@/db/schema'
import { normalizeMapQuery } from './maps'
import { seasonKey } from './seasons'
import { isPastMatch } from './data'
import type { PublicMatch } from './public-types'
import type { PublicStandings } from '@/components/site/StandingsSection'
import type { CalendarEvent } from './calendar'
import { getDict, localePrefix, type Locale } from './i18n'
import { SITE_URL } from './constants'

export function toPublicMatch(
  m: Match,
  venues: Map<string, Venue>,
  tournaments: Map<string, Tournament>,
  now: number,
  teams: Map<string, Team> = new Map(),
): PublicMatch {
  const venue = m.venueId ? venues.get(m.venueId) : undefined
  return {
    id: m.id,
    opponent: m.opponent,
    opponentKey: m.teamId ?? `name:${m.opponent.trim().toLowerCase()}`,
    opponentLogo: m.teamId ? (teams.get(m.teamId)?.logoUrl ?? null) : null,
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
    sets: m.setScores ?? null,
    mvpPlayerId: m.mvpPlayerId,
  }
}

/** Матчі для головної: з ознакою «зіграно», сезоном і сезоном за замовчуванням. */
export function prepareMatches(matches: Match[], venues: Venue[], tournaments: Tournament[], teams: Team[] = []) {
  const now = Date.now()
  const teamById = new Map(teams.map((t) => [t.id, t]))
  const venueById = new Map(venues.map((v) => [v.id, v]))
  const tournamentById = new Map(tournaments.map((tr) => [tr.id, tr]))
  const publicMatches = matches.map((m) => toPublicMatch(m, venueById, tournamentById, now, teamById))
  // Поточний сезон, а якщо в ньому ще немає ігор — останній, де вони були
  const seasons = [...new Set(publicMatches.map((m) => m.season))].sort()
  const current = seasonKey(new Date(now))
  const defaultSeason = seasons.includes(current) ? current : (seasons.at(-1) ?? 'all')
  // На сторінку одразу — поточний і минулий сезон та всі майбутні ігри; решта — архів на вимогу
  const cutoff = previousSeasonKey(current)
  const recent = publicMatches.filter((m) => !m.isPast || m.season >= cutoff)
  const allSeasons = [...seasons].reverse()
  const hasArchive = recent.length < publicMatches.length
  const usedTournaments = tournaments.filter((tr) => matches.some((m) => m.tournamentId === tr.id))
  return {
    publicMatches,
    recent,
    allSeasons,
    hasArchive,
    usedTournaments,
    defaultSeason,
    venueById,
    tournamentById,
    teamById,
  }
}

/** «2026-27» → «2025-26» */
export function previousSeasonKey(key: string) {
  const y = Number(key.slice(0, 4)) - 1
  return `${y}-${String((y + 1) % 100).padStart(2, '0')}`
}

/** Архівні матчі (старші за минулий сезон) — для довантаження на головній. */
export async function loadArchiveMatches(): Promise<PublicMatch[]> {
  const db = getDb()
  const [matches, venues, tournaments, teams] = await Promise.all([
    db.select().from(schema.matches),
    db.select().from(schema.venues),
    db.select().from(schema.tournaments),
    db.select().from(schema.teams),
  ])
  const { publicMatches, recent } = prepareMatches(matches, venues, tournaments, teams)
  const recentIds = new Set(recent.map((m) => m.id))
  return publicMatches.filter((m) => !recentIds.has(m.id))
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
  const notes = [m.kind === 'friendly' ? t.matches.friendlyBadge : null, opts.tournament ?? null].filter(Boolean)
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

/** Турнірні таблиці для сайту: відсортовані, з логотипами; спершу найсвіжіша. */
export function prepareStandings(tournaments: Tournament[], teams: Team[], clubName: string): PublicStandings[] {
  const teamById = new Map(teams.map((t) => [t.id, t]))
  const ratio = (f: number, a: number) => (a === 0 ? (f > 0 ? Infinity : 0) : f / a)
  return tournaments
    .filter((tr) => tr.standings && tr.standings.length > 0)
    .sort((a, b) => (b.standingsUpdatedAt?.getTime() ?? 0) - (a.standingsUpdatedAt?.getTime() ?? 0))
    .map((tr) => ({
      id: tr.id,
      name: tr.name,
      updatedAt: tr.standingsUpdatedAt?.toISOString() ?? null,
      rows: [...tr.standings!]
        .sort(
          (a, b) =>
            b.points - a.points ||
            b.wins - a.wins ||
            ratio(b.setsFor, b.setsAgainst) - ratio(a.setsFor, a.setsAgainst) ||
            b.setsFor - a.setsFor,
        )
        .map((r, i) => {
          const team = r.teamId ? teamById.get(r.teamId) : undefined
          return {
            key: `${i}-${r.teamId ?? r.name}`,
            name: r.us ? clubName : (team?.name ?? r.name),
            us: r.us,
            logo: team?.logoUrl ?? null,
            played: r.played,
            wins: r.wins,
            losses: r.losses,
            setsFor: r.setsFor,
            setsAgainst: r.setsAgainst,
            points: r.points,
          }
        }),
    }))
}
