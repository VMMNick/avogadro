import { AnalyticsClient } from './AnalyticsClient'

/**
 * Безкоштовна статистика відвідувань і швидкості від Vercel.
 * Працює лише на Vercel (локально й у тестах скрипти не підключаються).
 * Дані з'являться після увімкнення Analytics і Speed Insights у панелі проєкту.
 */
export function SiteAnalytics() {
  if (!process.env.VERCEL) return null
  return <AnalyticsClient />
}
