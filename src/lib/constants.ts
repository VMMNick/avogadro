import type { PlayerRole } from '@/db/schema'

export const CLUB_NAME = 'Авогадро'
/** Адреса сайту: власний домен (NEXT_PUBLIC_SITE_URL), або основний домен проєкту на Vercel. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000')
).replace(/\/$/, '')
export const TIME_ZONE = 'Europe/Kyiv'

export const ROLE_LABELS: Record<PlayerRole, string> = {
  setter: "Зв'язуючий",
  spiker: 'Догравальник',
  middle: 'Центральний блокуючий',
  opposite: 'Діагональний',
  libero: 'Ліберо',
  staff: 'Тренерський штаб',
}

export const DEFAULT_TAGLINE = 'Сила, характер та жага до перемоги на кожному майданчику.'
export const DEFAULT_ABOUT =
  "Волейбольний клуб «Авогадро» — команда, яка об'єднує людей, що люблять волейбол. Ми тренуємося, граємо в чемпіонатах і турнірах та запрошуємо всіх уболівати за нас."
