import { revalidatePath } from 'next/cache'
import { sql } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import { hashPassword } from '@/lib/auth'
import { seasonStartYear } from '@/lib/seasons'

/**
 * Лише для автотестів: очищає базу й (за бажанням) наповнює демо-даними.
 * Працює тільки якщо сервер запущено з E2E_TEST_MODE=1 і НЕ на Vercel — на сайті цієї адреси не існує.
 */
export const dynamic = 'force-dynamic'

const notFound = () => new Response('Not found', { status: 404 })

export async function POST(request: Request) {
  if (process.env.E2E_TEST_MODE !== '1' || process.env.VERCEL) return notFound()
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) return new Response('ADMIN_EMAIL / ADMIN_PASSWORD не задані', { status: 500 })

  const { seed } = (await request.json().catch(() => ({}))) as { seed?: 'demo' | 'archive' }
  const db = getDb()
  await db.execute(
    sql`TRUNCATE ${schema.matches}, ${schema.players}, ${schema.teams}, ${schema.venues}, ${schema.tournaments}, ${schema.loginAttempts}, ${schema.admins}, ${schema.achievements}, ${schema.trainings}, ${schema.applications} RESTART IDENTITY CASCADE`,
  )
  await db.delete(schema.settings)
  await db.insert(schema.settings).values({ id: 1 })
  await db.insert(schema.admins).values({ name: 'Адміністратор', email, passwordHash: await hashPassword(password) })

  // archive — демо-дані плюс гра двома сезонами раніше (перевірка довантаження архіву)
  if (seed === 'demo' || seed === 'archive') await seedDemo()
  if (seed === 'archive') await seedArchive()

  revalidatePath('/', 'layout')
  return Response.json({ ok: true })
}

const DAY = 86_400_000

async function seedDemo() {
  const db = getDb()
  const now = Date.now()
  const [barkom, epicenter, azot] = await db
    .insert(schema.teams)
    .values([
      { name: 'Барком', city: 'Львів' },
      { name: 'Епіцентр', city: 'Подоляни' },
      { name: 'Азот', city: 'Черкаси' },
    ])
    .returning()
  const [hall] = await db
    .insert(schema.venues)
    .values([{ name: 'СК Юність', address: 'вул. Прикладна, 1, Київ', mapQuery: '50.4332, 30.5214' }])
    .returning()
  const [league] = await db
    .insert(schema.tournaments)
    .values([{ name: 'Чемпіонат області' }])
    .returning()
  // Гра минулого сезону: за 40 днів до початку поточного
  const seasonStart = Date.UTC(seasonStartYear(new Date(now)), 7, 1)
  const at = (ms: number) => new Date(Math.round(ms / 60_000) * 60_000)
  const official = { kind: 'official' as const, venueId: hall.id, location: hall.name, tournamentId: league.id }
  const players = await db
    .insert(schema.players)
    .values([
      { name: 'Олег Коваль', number: 7, role: 'spiker' },
      { name: 'Ігор Мельник', number: 12, role: 'middle' },
      { name: 'Андрій Бондар', number: 3, role: 'setter' },
      { name: 'Тарас Ткач', number: 9, role: 'opposite' },
      { name: 'Віктор Лис', number: 1, role: 'libero' },
      { name: 'Петро Гук', number: null, role: 'staff' },
    ])
    .returning()
  const [oleh, ihor, andrii, taras, viktor] = players
  const squad = [oleh, ihor, andrii, taras, viktor]
  const matches = await db
    .insert(schema.matches)
    .values([
      { ...official, opponent: barkom.name, teamId: barkom.id, startsAt: at(now + 3 * DAY) },
      {
        opponent: epicenter.name,
        teamId: epicenter.id,
        startsAt: at(now + 10 * DAY),
        kind: 'friendly',
        venueId: hall.id,
        location: hall.name,
      },
      {
        ...official,
        opponent: azot.name,
        teamId: azot.id,
        startsAt: at(now - 5 * DAY),
        ourSets: 3,
        theirSets: 1,
        setScores: [
          [25, 20],
          [23, 25],
          [25, 18],
          [25, 22],
        ],
        mvpPlayerId: oleh.id,
      },
      {
        ...official,
        opponent: barkom.name,
        teamId: barkom.id,
        startsAt: at(now - 12 * DAY),
        ourSets: 3,
        theirSets: 2,
        setScores: [
          [25, 23],
          [20, 25],
          [25, 21],
          [22, 25],
          [15, 13],
        ],
        mvpPlayerId: oleh.id,
      },
      {
        ...official,
        opponent: epicenter.name,
        teamId: epicenter.id,
        startsAt: at(now - 19 * DAY),
        ourSets: 0,
        theirSets: 3,
        setScores: [
          [19, 25],
          [22, 25],
          [30, 32],
        ],
        mvpPlayerId: andrii.id,
      },
      {
        ...official,
        opponent: barkom.name,
        teamId: barkom.id,
        startsAt: at(seasonStart - 40 * DAY),
        ourSets: 1,
        theirSets: 3,
        tournamentId: null,
      },
    ])
    .returning()
  // Склад на три зіграні гри цього сезону
  await db
    .insert(schema.matchPlayers)
    .values(matches.slice(2, 5).flatMap((m) => squad.map((p) => ({ matchId: m.id, playerId: p.id }))))
  await db
    .update(schema.tournaments)
    .set({
      standingsUpdatedAt: new Date(now - DAY),
      standings: [
        {
          teamId: epicenter.id,
          us: false,
          name: epicenter.name,
          played: 4,
          wins: 4,
          losses: 0,
          setsFor: 12,
          setsAgainst: 2,
          points: 11,
        },
        {
          teamId: null,
          us: true,
          name: 'Авогадро',
          played: 3,
          wins: 2,
          losses: 1,
          setsFor: 6,
          setsAgainst: 6,
          points: 5,
        },
        {
          teamId: azot.id,
          us: false,
          name: azot.name,
          played: 3,
          wins: 1,
          losses: 2,
          setsFor: 5,
          setsAgainst: 7,
          points: 3,
        },
        {
          teamId: null,
          us: false,
          name: 'Політехнік',
          played: 3,
          wins: 1,
          losses: 2,
          setsFor: 4,
          setsAgainst: 7,
          points: 3,
        },
        {
          teamId: barkom.id,
          us: false,
          name: barkom.name,
          played: 3,
          wins: 0,
          losses: 3,
          setsFor: 4,
          setsAgainst: 9,
          points: 1,
        },
      ],
    })
    .where(sql`${schema.tournaments.id} = ${league.id}`)
  await db
    .update(schema.settings)
    .set({
      phone: '+380 67 000 00 00',
      email: 'club@example.com',
      address: 'Київ, вул. Хрещатик, 1',
      mapQuery: '50.4501, 30.5234',
    })
    .where(sql`${schema.settings.id} = 1`)
  const season = (shift: number) => {
    const y = seasonStartYear(new Date(now)) + shift
    return `${y}-${String((y + 1) % 100).padStart(2, '0')}`
  }
  await db.insert(schema.achievements).values([
    { season: season(-1), title: 'Чемпіонат області', titleEn: 'Regional championship', kind: 'gold' },
    { season: season(-1), title: 'Кубок міста', titleEn: 'City cup', kind: 'bronze', note: 'Фінальна четвірка' },
    { season: season(-2), title: 'Найкращий ліберо турніру', kind: 'award' },
  ])
  await db.insert(schema.trainings).values([
    { weekday: 2, startTime: '19:00', endTime: '21:00', venueId: hall.id, location: hall.name },
    {
      weekday: 4,
      startTime: '19:00',
      endTime: '21:00',
      venueId: hall.id,
      location: hall.name,
      note: 'Ігрове тренування',
    },
  ])
}

async function seedArchive() {
  const db = getDb()
  const old = Date.UTC(seasonStartYear(new Date()) - 2, 10, 15, 16, 0)
  await db.insert(schema.matches).values({
    opponent: 'Старий Суперник',
    startsAt: new Date(old),
    kind: 'official',
    ourSets: 3,
    theirSets: 0,
  })
}
