import 'server-only'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { attachDatabasePool } from '@vercel/functions'
import * as schema from './schema'

type DB = NodePgDatabase<typeof schema>

// Один пул на інстанс функції; у dev переживає hot reload
const globalForDb = globalThis as unknown as { __db?: DB }

function createDb(): DB {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL не задано')
  const pool = new Pool({
    connectionString,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 15_000, // запас на «пробудження» безкоштовного Neon
  })
  // На Vercel коректно закриває простоюючі з'єднання між викликами
  attachDatabasePool(pool)
  return drizzle(pool, { schema })
}

export function getDb(): DB {
  globalForDb.__db ??= createDb()
  return globalForDb.__db
}

export { schema }
