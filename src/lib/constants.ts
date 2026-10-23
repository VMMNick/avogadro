import type { PlayerRole } from '@/db/schema'

export const CLUB_NAME = 'Авогадро'
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://avohadro.vercel.app'
export const TIME_ZONE = 'Europe/Kyiv'

export const ROLE_LABELS: Record<PlayerRole, string> = {
  setter: "Зв'язуючий",
  spiker: 'Догравальник',
  middle: 'Центральний блокуючий',
  opposite: 'Діагональний',
  libero: 'Ліберо',
  staff: 'Тренерський штаб',
}

export const ROLE_FILTERS: { value: PlayerRole | 'all'; label: string }[] = [
  { value: 'all', label: 'Усі' },
  { value: 'setter', label: "Зв'язуючі" },
  { value: 'spiker', label: 'Догравальники' },
  { value: 'middle', label: 'Центральні' },
  { value: 'opposite', label: 'Діагональні' },
  { value: 'libero', label: 'Ліберо' },
  { value: 'staff', label: 'Штаб' },
]

export const DEFAULT_TAGLINE = 'Сила, характер та жага до перемоги на кожному майданчику.'
export const DEFAULT_ABOUT =
  "Волейбольний клуб «Авогадро» — команда, яка об'єднує людей, що люблять волейбол. Ми тренуємося, граємо в чемпіонатах і турнірах та запрошуємо всіх уболівати за нас."
