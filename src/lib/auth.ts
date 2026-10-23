import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { and, count, eq, gte, lt, sql } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { getDb, schema } from '@/db'
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession, verifySession } from './session'

const MAX_FAILED_ATTEMPTS = 5
const LOCK_WINDOW_MINUTES = 15
// Хеш-заглушка, щоб час відповіді не видавав, чи існує email
const DUMMY_HASH = '$2b$12$D3sRH.MSh55n9Mi8.5IoLOteuEjQesvQcXhevn4JeONywXPjgfhX6'

export type CurrentAdmin = { id: string; email: string; name: string }

export const getCurrentAdmin = cache(async (): Promise<CurrentAdmin | null> => {
  const jar = await cookies()
  const session = await verifySession(jar.get(SESSION_COOKIE)?.value)
  if (!session) return null

  const [admin] = await getDb()
    .select({
      id: schema.admins.id,
      email: schema.admins.email,
      name: schema.admins.name,
      sessionVersion: schema.admins.sessionVersion,
    })
    .from(schema.admins)
    .where(eq(schema.admins.id, session.sub))
    .limit(1)

  if (!admin || admin.sessionVersion !== session.v) return null
  return { id: admin.id, email: admin.email, name: admin.name }
})

/** Для сторінок і server actions адмінки: повертає адміна або перенаправляє на вхід. */
export async function requireAdmin(): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin()
  if (!admin) redirect('/admin/login')
  return admin
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

async function startSession(adminId: string, version: number) {
  const token = await signSession({ sub: adminId, v: version })
  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
}

export async function endSession() {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
}

export type LoginResult = { ok: true } | { ok: false; error: string }

export async function login(emailRaw: string, password: string, ip: string): Promise<LoginResult> {
  const db = getDb()
  const email = emailRaw.trim().toLowerCase()
  const key = `${email}|${ip}`.slice(0, 200)
  const since = new Date(Date.now() - LOCK_WINDOW_MINUTES * 60_000)

  // Прибираємо старі записи, щоб таблиця не росла
  await db.delete(schema.loginAttempts).where(lt(schema.loginAttempts.createdAt, since))

  const [{ value: failed }] = await db
    .select({ value: count() })
    .from(schema.loginAttempts)
    .where(and(eq(schema.loginAttempts.key, key), gte(schema.loginAttempts.createdAt, since)))

  if (failed >= MAX_FAILED_ATTEMPTS) {
    return {
      ok: false,
      error: `Забагато невдалих спроб. Спробуйте через ${LOCK_WINDOW_MINUTES} хвилин.`,
    }
  }

  const [admin] = await db
    .select()
    .from(schema.admins)
    .where(sql`lower(${schema.admins.email}) = ${email}`)
    .limit(1)

  const valid = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH)
  if (!admin || !valid) {
    await db.insert(schema.loginAttempts).values({ key })
    return { ok: false, error: 'Невірний email або пароль.' }
  }

  await db.delete(schema.loginAttempts).where(eq(schema.loginAttempts.key, key))
  await startSession(admin.id, admin.sessionVersion)
  return { ok: true }
}

/** Змінює пароль і завершує всі інші сесії цього адміністратора. */
export async function changePassword(adminId: string, current: string, next: string) {
  const db = getDb()
  const [admin] = await db
    .select()
    .from(schema.admins)
    .where(eq(schema.admins.id, adminId))
    .limit(1)
  if (!admin) return { ok: false as const, error: 'Адміністратора не знайдено.' }

  const valid = await bcrypt.compare(current, admin.passwordHash)
  if (!valid) return { ok: false as const, error: 'Поточний пароль невірний.' }

  const version = admin.sessionVersion + 1
  await db
    .update(schema.admins)
    .set({ passwordHash: await hashPassword(next), sessionVersion: version })
    .where(eq(schema.admins.id, adminId))
  await startSession(adminId, version)
  return { ok: true as const }
}
