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

  const { seed } = (await request.json().catch(() => ({}))) as { seed?: string }
  const db = getDb()
  await db.execute(
    sql`TRUNCATE ${schema.matches}, ${schema.players}, ${schema.teams}, ${schema.venues}, ${schema.tournaments}, ${schema.loginAttempts}, ${schema.admins} RESTART IDENTITY CASCADE`,
  )
  await db.delete(schema.settings)
  await db.insert(schema.settings).values({ id: 1 })
  await db.insert(schema.admins).values({ name: 'Адміністратор', email, passwordHash: await hashPassword(password) })

  if (seed === 'demo') await seedDemo()

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
  const [league] = await db.insert(schema.tournaments).values([{ name: 'Чемпіонат області' }]).returning()
  // Гра минулого сезону: за 40 днів до початку поточного
  const seasonStart = Date.UTC(seasonStartYear(new Date(now)), 7, 1)
  const at = (ms: number) => new Date(Math.round(ms / 60_000) * 60_000)
  const official = { kind: 'official' as const, venueId: hall.id, location: hall.name, tournamentId: league.id }
  await db.insert(schema.matches).values([
    { ...official, opponent: barkom.name, teamId: barkom.id, startsAt: at(now + 3 * DAY) },
    { opponent: epicenter.name, teamId: epicenter.id, startsAt: at(now + 10 * DAY), kind: 'friendly', venueId: hall.id, location: hall.name },
    { ...official, opponent: azot.name, teamId: azot.id, startsAt: at(now - 5 * DAY), ourSets: 3, theirSets: 1 },
    { ...official, opponent: barkom.name, teamId: barkom.id, startsAt: at(now - 12 * DAY), ourSets: 3, theirSets: 2 },
    { ...official, opponent: epicenter.name, teamId: epicenter.id, startsAt: at(now - 19 * DAY), ourSets: 0, theirSets: 3 },
    { ...official, opponent: barkom.name, teamId: barkom.id, startsAt: at(seasonStart - 40 * DAY), ourSets: 1, theirSets: 3, tournamentId: null },
  ])
  await db.insert(schema.players).values([
    { name: 'Олег Коваль', number: 7, role: 'spiker' },
    { name: 'Ігор Мельник', number: 12, role: 'middle' },
    { name: 'Андрій Бондар', number: 3, role: 'setter' },
    { name: 'Тарас Ткач', number: 9, role: 'opposite' },
    { name: 'Віктор Лис', number: 1, role: 'libero' },
    { name: 'Петро Гук', number: null, role: 'staff' },
  ])
  await db
    .update(schema.settings)
    .set({ phone: '+380 67 000 00 00', email: 'club@example.com', address: 'Київ, вул. Хрещатик, 1', mapQuery: '50.4501, 30.5234' })
    .where(sql`${schema.settings.id} = 1`)
}
