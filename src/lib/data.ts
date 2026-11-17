import 'server-only'
import { asc, desc, eq, sql } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import type { Match, Player, Settings, Venue } from '@/db/schema'

export type SiteContent = {
  players: Player[]
  matches: Match[]
  settings: Settings | null
  venues: Venue[]
  failed: boolean
}

/** Усі дані для головної сторінки. Помилка БД не ламає сторінку — показуємо порожній стан. */
export async function getSiteContent(): Promise<SiteContent> {
  try {
    const db = getDb()
    const [players, matches, settingsRows, venues] = await Promise.all([
      db
        .select()
        .from(schema.players)
        .orderBy(sql`${schema.players.number} ASC NULLS LAST`, asc(schema.players.name)),
      db.select().from(schema.matches).orderBy(asc(schema.matches.startsAt)),
      db.select().from(schema.settings).where(eq(schema.settings.id, 1)).limit(1),
      db.select().from(schema.venues),
    ])
    return { players, matches, settings: settingsRows[0] ?? null, venues, failed: false }
  } catch (err) {
    console.error('Не вдалося завантажити дані сайту', err)
    return { players: [], matches: [], settings: null, venues: [], failed: true }
  }
}

/** Гра вважається зіграною, якщо є рахунок або вона почалась понад 3 години тому. */
export function splitMatches(matches: Match[], now = Date.now()) {
  const isPast = (m: Match) => m.ourSets !== null || m.startsAt.getTime() < now - 3 * 3600_000
  return {
    // З запасом: на сайті ще є фільтр «Офіційні / Товариські», який показує до 6 у кожній колонці
    upcoming: matches.filter((m) => !isPast(m)).slice(0, 30),
    past: matches.filter(isPast).reverse().slice(0, 30),
  }
}

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
      matches: sql<number>`(select count(*)::int from ${schema.matches} where ${schema.matches.teamId} = ${schema.teams.id})`,
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
      matches: sql<number>`(select count(*)::int from ${schema.matches} where ${schema.matches.venueId} = ${schema.venues.id})`,
    })
    .from(schema.venues)
  return rows.sort((a, b) => byName.compare(a.name, b.name))
}

/** Короткі списки для випадаючих меню у формі матчу. */
export async function getDirectoryOptions() {
  const db = getDb()
  const [teams, venues] = await Promise.all([
    db.select({ id: schema.teams.id, name: schema.teams.name, city: schema.teams.city }).from(schema.teams),
    db.select({ id: schema.venues.id, name: schema.venues.name, address: schema.venues.address }).from(schema.venues),
  ])
  return {
    teams: teams.sort((a, b) => byName.compare(a.name, b.name)),
    venues: venues.sort((a, b) => byName.compare(a.name, b.name)),
  }
}
