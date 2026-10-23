import {
  check,
  index,
  integer,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const PLAYER_ROLES = ['setter', 'spiker', 'middle', 'opposite', 'libero', 'staff'] as const
export type PlayerRole = (typeof PLAYER_ROLES)[number]

export const MATCH_KINDS = ['official', 'friendly'] as const
export type MatchKind = (typeof MATCH_KINDS)[number]

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}

export const players = pgTable(
  'players',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 80 }).notNull(),
    number: smallint('number'),
    role: varchar('role', { length: 16 }).$type<PlayerRole>().notNull(),
    photoUrl: text('photo_url'),
    ...timestamps,
  },
  (t) => [
    check('players_number_range', sql`${t.number} IS NULL OR ${t.number} BETWEEN 0 AND 99`),
    check(
      'players_role_valid',
      sql`${t.role} IN ('setter','spiker','middle','opposite','libero','staff')`,
    ),
  ],
)

export const matches = pgTable(
  'matches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    opponent: varchar('opponent', { length: 80 }).notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    location: varchar('location', { length: 120 }),
    // Сети «Авогадро» та суперника; обидва null, поки гра не зіграна
    ourSets: smallint('our_sets'),
    theirSets: smallint('their_sets'),
    // Офіційний матч чи товариська гра
    kind: varchar('kind', { length: 16 }).$type<MatchKind>().notNull().default('official'),
    ...timestamps,
  },
  (t) => [
    index('matches_starts_at_idx').on(t.startsAt),
    check('matches_kind_valid', sql`${t.kind} IN ('official','friendly')`),
    check(
      'matches_score_valid',
      sql`(${t.ourSets} IS NULL AND ${t.theirSets} IS NULL) OR (${t.ourSets} BETWEEN 0 AND 3 AND ${t.theirSets} BETWEEN 0 AND 3)`,
    ),
  ],
)

// Один рядок з id = 1
export const settings = pgTable(
  'settings',
  {
    id: integer('id').primaryKey().default(1),
    tagline: varchar('tagline', { length: 160 }),
    about: text('about'),
    phone: varchar('phone', { length: 40 }),
    email: varchar('email', { length: 120 }),
    address: varchar('address', { length: 200 }),
    // Що показувати на карті: адреса, назва залу або координати «50.45, 30.52»
    mapQuery: varchar('map_query', { length: 200 }),
    instagram: text('instagram'),
    facebook: text('facebook'),
    telegram: text('telegram'),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [check('settings_singleton', sql`${t.id} = 1`)],
)

export const admins = pgTable(
  'admins',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 120 }).notNull(),
    name: varchar('name', { length: 80 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    // Збільшується при зміні пароля — інвалідовує старі сесії
    sessionVersion: integer('session_version').notNull().default(1),
    ...timestamps,
  },
  (t) => [uniqueIndex('admins_email_unique').on(sql`lower(${t.email})`)],
)

export const loginAttempts = pgTable(
  'login_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    key: varchar('key', { length: 200 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('login_attempts_key_idx').on(t.key, t.createdAt)],
)

export type Player = typeof players.$inferSelect
export type Match = typeof matches.$inferSelect
export type Settings = typeof settings.$inferSelect
export type Admin = typeof admins.$inferSelect
