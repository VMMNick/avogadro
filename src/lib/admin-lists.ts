import 'server-only'
import { asc, desc } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import { seasonStartYear } from './seasons'

/** Сезони для вибору: від наступного до 15 років тому. */
export function seasonOptions() {
  const now = seasonStartYear(new Date())
  return Array.from({ length: 17 }, (_, i) => {
    const y = now + 1 - i
    return `${y}-${String((y + 1) % 100).padStart(2, '0')}`
  })
}

export async function listAchievements() {
  return getDb()
    .select()
    .from(schema.achievements)
    .orderBy(desc(schema.achievements.season), asc(schema.achievements.kind))
}

export async function listTrainings() {
  return getDb().select().from(schema.trainings).orderBy(asc(schema.trainings.weekday), asc(schema.trainings.startTime))
}

export async function listApplications() {
  return getDb().select().from(schema.applications).orderBy(desc(schema.applications.createdAt))
}
