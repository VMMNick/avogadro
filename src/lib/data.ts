import 'server-only'
import { asc, desc, eq, sql } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import type { Match, Player, Settings, Tournament, Venue } from '@/db/schema'

export type SiteContent = {
  players: Player[]
  matches: Match[]
  settings: Settings | null
  venues: Venue[]
  tournaments: Tournament[]
  failed: boolean
}

/** Усі дані для головної сторінки. Помилка БД не ламає сторінку — показуємо порожній стан. */
export async function getSiteContent(): Promise<SiteContent> {
  try {
    const db = getDb()
    const [players, matches, settingsRows, venues, tournaments] = await Promise.all([
      db
        .select()
        .from(schema.players)
        .orderBy(sql`${schema.players.number} ASC NULLS LAST`, asc(schema.players.name)),
      db.select().from(schema.matches).orderBy(asc(schema.matches.startsAt)),
      db.select().from(schema.settings).where(eq(schema.settings.id, 1)).limit(1),
      db.select().from(schema.venues),
      db.select().from(schema.tournaments),
    ])
    return { players, matches, settings: settingsRows[0] ?? null, venues, tournaments, failed: false }
  } catch (err) {
    console.error('Не вдалося завантажити дані сайту', err)
    return { players: [], matches: [], settings: null, venues: [], tournaments: [], failed: true }
  }
}

/** Гра вважається зіграною, якщо є рахунок або вона почалась понад 3 години тому. */
export const isPastMatch = (m: Pick<Match, 'ourSets' | 'startsAt'>, now = Date.now()) =>
  m.ourSets !== null || m.startsAt.getTime() < now - 3 * 3600_000

export async function getAdminStats() {
  const db = getDb()
  const [[p], [m], [u]] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(schema.players),
    db.select({ n: sql<number>`count(*)::int` }).from(schema.matches),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.matches)
      .where(sql`${schema.matches.startsAt} > now() AND ${schema.matches.ourSets} IS NULL`),
  ])
  return { players: p.n, matches: m.n, upcoming: u.n }
}

export async function listPlayers() {
  return getDb()
    .select()
    .from(schema.players)
    .orderBy(sql`${schema.players.number} ASC NULLS LAST`, asc(schema.players.name))
}

export type MatchStatus = 'played' | 'upcoming' | 'no-score'

export async function listMatches() {
  const rows = await getDb().select().from(schema.matches).orderBy(desc(schema.matches.startsAt))
  const now = Date.now()
  return rows.map((m) => ({
    ...m,
    status: (m.ourSets !== null ? 'played' : m.startsAt.getTime() > now ? 'upcoming' : 'no-score') as MatchStatus,
  }))
}

export async function getSettings() {
  const [row] = await getDb().select().from(schema.settings).where(eq(schema.settings.id, 1)).limit(1)
  return row ?? null
}

// ---------- Довідники ----------

const byName = new Intl.Collator('uk', { sensitivity: 'base', numeric: true })

export async function listTeams() {
  const rows = await getDb()
    .select({
      id: schema.teams.id,
      name: schema.teams.name,
      city: schema.teams.city,
      matches: sql<number>`(select count(*)::int from matches m where m.team_id = "teams"."id")`,
    })
    .from(schema.teams)
  return rows.sort((a, b) => byName.compare(a.name, b.name))
}

export async function listVenues() {
  const rows = await getDb()
    .select({
      id: schema.venues.id,
      name: schema.venues.name,
      address: schema.venues.address,
      mapQuery: schema.venues.mapQuery,
      matches: sql<number>`(select count(*)::int from matches m where m.venue_id = "venues"."id")`,
    })
    .from(schema.venues)
  return rows.sort((a, b) => byName.compare(a.name, b.name))
}

/** Короткі списки для випадаючих меню у формі матчу. */
export async function getDirectoryOptions() {
  const db = getDb()
  const [teams, venues, tournaments] = await Promise.all([
    db.select({ id: schema.teams.id, name: schema.teams.name, city: schema.teams.city }).from(schema.teams),
    db.select({ id: schema.venues.id, name: schema.venues.name, address: schema.venues.address }).from(schema.venues),
    db.select({ id: schema.tournaments.id, name: schema.tournaments.name }).from(schema.tournaments),
  ])
  return {
    teams: teams.sort((a, b) => byName.compare(a.name, b.name)),
    venues: venues.sort((a, b) => byName.compare(a.name, b.name)),
    tournaments: tournaments.sort((a, b) => byName.compare(a.name, b.name)),
  }
}

export async function listTournaments() {
  const rows = await getDb()
    .select({
      id: schema.tournaments.id,
      name: schema.tournaments.name,
      matches: sql<number>`(select count(*)::int from matches m where m.tournament_id = "tournaments"."id")`,
    })
    .from(schema.tournaments)
  return rows.sort((a, b) => byName.compare(a.name, b.name))
}


/** Матч для окремої сторінки: з залом, турніром і всіма зустрічами з тим самим суперником. */
export async function getMatchDetail(id: string) {
  const db = getDb()
  const [match] = await db.select().from(schema.matches).where(eq(schema.matches.id, id)).limit(1)
  if (!match) return null
  const [[venue], [tournament], h2h] = await Promise.all([
    match.venueId
      ? db.select().from(schema.venues).where(eq(schema.venues.id, match.venueId)).limit(1)
      : Promise.resolve([] as Venue[]),
    match.tournamentId
      ? db.select().from(schema.tournaments).where(eq(schema.tournaments.id, match.tournamentId)).limit(1)
      : Promise.resolve([] as Tournament[]),
    db
      .select()
      .from(schema.matches)
      .where(
        match.teamId
          ? eq(schema.matches.teamId, match.teamId)
          : sql`lower(btrim(${schema.matches.opponent})) = lower(btrim(${match.opponent}))`,
      )
      .orderBy(desc(schema.matches.startsAt)),
  ])
  return { match, venue: venue ?? null, tournament: tournament ?? null, h2h: h2h.filter((m) => m.id !== match.id) }
}
