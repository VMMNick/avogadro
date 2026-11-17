import type { MetadataRoute } from 'next'
import { desc } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import { SITE_URL } from '@/lib/constants'

// Карта сайту оновлюється разом із сайтом і щонайменше раз на годину
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const home = { uk: SITE_URL, en: `${SITE_URL}/en` }
  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1, alternates: { languages: home } },
    { url: `${SITE_URL}/en`, changeFrequency: 'weekly', priority: 0.8, alternates: { languages: home } },
    { url: `${SITE_URL}/calendar`, changeFrequency: 'weekly', priority: 0.5 },
  ]
  try {
    const matches = await getDb()
      .select({ id: schema.matches.id, updatedAt: schema.matches.updatedAt })
      .from(schema.matches)
      .orderBy(desc(schema.matches.startsAt))
      .limit(2000)
    for (const m of matches) {
      const languages = { uk: `${SITE_URL}/matches/${m.id}`, en: `${SITE_URL}/en/matches/${m.id}` }
      entries.push(
        {
          url: languages.uk,
          lastModified: m.updatedAt,
          changeFrequency: 'monthly',
          priority: 0.6,
          alternates: { languages },
        },
        {
          url: languages.en,
          lastModified: m.updatedAt,
          changeFrequency: 'monthly',
          priority: 0.4,
          alternates: { languages },
        },
      )
    }
  } catch (err) {
    // Без бази — хоча б головні сторінки
    console.error('sitemap: не вдалося отримати матчі', err)
  }
  return entries
}
