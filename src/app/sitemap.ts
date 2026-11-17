import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/constants'

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = { uk: SITE_URL, en: `${SITE_URL}/en` }
  return [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1, alternates: { languages } },
    { url: `${SITE_URL}/en`, changeFrequency: 'weekly', priority: 0.8, alternates: { languages } },
  ]
}
