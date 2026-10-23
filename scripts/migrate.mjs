// Застосовує міграції БД і створює початкові дані.
// Запускається автоматично перед кожною збіркою (npm run build).
import 'dotenv/config'
import pg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import bcrypt from 'bcryptjs'

const url = process.env.DATABASE_URL
if (!url) {
  console.warn('[migrate] DATABASE_URL не задано — міграції пропущено')
  process.exit(0)
}

const pool = new pg.Pool({ connectionString: url, max: 1, connectionTimeoutMillis: 30_000 })

try {
  await migrate(drizzle(pool), { migrationsFolder: './drizzle' })
  console.log('[migrate] міграції застосовано')

  await pool.query('INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING')

  const { rows } = await pool.query('SELECT count(*)::int AS n FROM admins')
  if (rows[0].n === 0) {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
    const password = process.env.ADMIN_PASSWORD
    if (email && password && password.length >= 10) {
      const hash = await bcrypt.hash(password, 12)
      await pool.query(
        'INSERT INTO admins (email, name, password_hash) VALUES ($1, $2, $3)',
        [email, 'Адміністратор', hash],
      )
      console.log(`[migrate] створено першого адміністратора ${email}`)
    } else {
      console.warn('[migrate] адміністраторів немає: задайте ADMIN_EMAIL і ADMIN_PASSWORD (мін. 10 символів)')
    }
  }
} catch (err) {
  console.error('[migrate] помилка:', err)
  process.exitCode = 1
} finally {
  await pool.end()
}
