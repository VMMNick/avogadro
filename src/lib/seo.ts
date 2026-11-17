import 'server-only'
import type { Settings } from '@/db/schema'
import { SITE_URL } from './constants'
import { getDict, localePrefix, type Locale } from './i18n'
import { MATCH_DURATION_MS } from './calendar'

/** Розмітка schema.org: клуб як спортивна команда. */
export function teamJsonLd(settings: Settings | null, locale: Locale) {
  const t = getDict(locale)
  const sameAs = [settings?.instagram, settings?.facebook, settings?.telegram].filter(Boolean)
  return {
    '@type': 'SportsTeam',
    '@id': `${SITE_URL}/#team`,
    name: t.clubFull,
    alternateName: ['ВК «Авогадро»', 'Avogadro'],
    sport: 'Volleyball',
    url: `${SITE_URL}${localePrefix(locale)}/`,
    logo: `${SITE_URL}/images/emblem-512.png`,
    image: `${SITE_URL}/images/emblem-1024.png`,
    ...(settings?.email ? { email: settings.email } : {}),
    ...(settings?.phone ? { telephone: settings.phone } : {}),
    ...(settings?.address
      ? { location: { '@type': 'Place', name: settings.address, address: settings.address } }
      : {}),
    ...(sameAs.length ? { sameAs } : {}),
  }
}

export type EventInput = {
  id: string
  opponent: string
  startsAt: Date
  location: string | null
  venueAddress?: string | null
  ourSets: number | null
  theirSets: number | null
  tournament?: string | null
}

/** Розмітка schema.org: матч як спортивна подія. */
export function matchJsonLd(m: EventInput, locale: Locale) {
  const t = getDict(locale)
  const url = `${SITE_URL}${localePrefix(locale)}/matches/${m.id}`
  return {
    '@type': 'SportsEvent',
    '@id': `${url}#event`,
    name: `${t.clubName} — ${m.opponent}`,
    sport: 'Volleyball',
    url,
    startDate: m.startsAt.toISOString(),
    endDate: new Date(m.startsAt.getTime() + MATCH_DURATION_MS).toISOString(),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    image: `${url}/opengraph-image`,
    description: [m.tournament, m.ourSets !== null ? `${m.ourSets}:${m.theirSets}` : null].filter(Boolean).join(' · ') || undefined,
    location: {
      '@type': 'Place',
      name: m.location ?? t.clubFull,
      address: m.venueAddress ?? m.location ?? undefined,
    },
    competitor: [
      { '@id': `${SITE_URL}/#team` },
      { '@type': 'SportsTeam', name: m.opponent },
    ],
    organizer: { '@id': `${SITE_URL}/#team` },
  }
}

/** Безпечне вбудовування JSON-LD у <script>. */
export function jsonLdScript(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, '\\u003c') }
}
