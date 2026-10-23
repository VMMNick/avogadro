import { sql } from 'drizzle-orm'
import { getDb } from '@/db'
import { getDatabaseUrl } from '@/lib/env'

export const dynamic = 'force-dynamic'

/**
 * Діагностика конфігурації. Показує лише наявність змінних (true/false)
 * і код помилки БД — жодних значень чи секретів.
 */
export async function GET() {
  const env = {
    database: Boolean(getDatabaseUrl()),
    blob: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    sessionSecret: (process.env.SESSION_SECRET?.length ?? 0) >= 32,
    adminSeed: Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD),
  }

  let database: { ok: boolean; tables?: boolean; admins?: number; error?: string } = { ok: false }
  if (env.database) {
    try {
      const db = getDb()
      const res = await db.execute(sql`select to_regclass('public.admins') is not null as tables`)
      const tables = Boolean((res.rows[0] as { tables: boolean }).tables)
      let admins: number | undefined
      if (tables) {
        const r = await db.execute(sql`select count(*)::int as n from admins`)
        admins = (r.rows[0] as { n: number }).n
      }
      database = { ok: true, tables, admins }
    } catch (err) {
      const e = err as { code?: string; name?: string }
      database = { ok: false, error: e.code ?? e.name ?? 'unknown' }
    }
  }

  const ok = env.database && env.blob && env.sessionSecret && database.ok && database.tables === true
  return Response.json({ ok, env, database }, { status: ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } })
}
