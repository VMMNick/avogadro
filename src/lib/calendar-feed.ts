import 'server-only'
import { eq } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import { buildIcs } from './calendar'
import { getDict, type Locale } from './i18n'
import { matchEvent } from './public-data'

const ICS_HEADERS = {
  'Content-Type': 'text/calendar; charset=utf-8',
  'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600',
}

/** Календар усіх матчів клубу (для підписки). */
export async function calendarFeedResponse(locale: Locale) {
  const t = getDict(locale)
  const db = getDb()
  const [matches, venues, tournaments] = await Promise.all([
    db.select().from(schema.matches),
    db.select().from(schema.venues),
    db.select().from(schema.tournaments),
  ])
  const venueById = new Map(venues.map((v) => [v.id, v]))
  const tournamentById = new Map(tournaments.map((tr) => [tr.id, tr]))
  const events = matches
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
    .map((m) =>
      matchEvent(m, {
        locale,
        venueAddress: m.venueId ? venueById.get(m.venueId)?.address : null,
        tournament: m.tournamentId ? tournamentById.get(m.tournamentId)?.name : null,
      }),
    )
  const body = buildIcs(events, { name: `${t.clubFull} — ${t.matches.title}`, description: t.siteDescription })
  return new Response(body, { headers: { ...ICS_HEADERS, 'Content-Disposition': 'inline; filename="avogadro.ics"' } })
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Один матч як файл .ics — для кнопки «Завантажити подію». */
export async function matchIcsResponse(id: string, locale: Locale) {
  if (!UUID_RE.test(id)) return new Response('Not found', { status: 404 })
  const db = getDb()
  const [m] = await db.select().from(schema.matches).where(eq(schema.matches.id, id)).limit(1)
  if (!m) return new Response('Not found', { status: 404 })
  const [venue] = m.venueId ? await db.select().from(schema.venues).where(eq(schema.venues.id, m.venueId)) : []
  const [tournament] = m.tournamentId
    ? await db.select().from(schema.tournaments).where(eq(schema.tournaments.id, m.tournamentId))
    : []
  const t = getDict(locale)
  const body = buildIcs([matchEvent(m, { locale, venueAddress: venue?.address, tournament: tournament?.name })], {
    name: t.clubFull,
  })
  return new Response(body, {
    headers: { ...ICS_HEADERS, 'Content-Disposition': `attachment; filename="avogadro-${m.startsAt.toISOString().slice(0, 10)}.ics"` },
  })
}
