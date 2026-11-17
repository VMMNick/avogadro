import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getMatchDetail, isPastMatch } from '@/lib/data'
import { formatMatchDate, getDict, localePrefix, type Locale } from '@/lib/i18n'
import { googleCalendarUrl } from '@/lib/calendar'
import { matchEvent, matchUrl } from '@/lib/public-data'
import { mapLinks, normalizeMapQuery } from '@/lib/maps'
import { seasonKey, seasonLabel } from '@/lib/seasons'
import { jsonLdScript, matchJsonLd, teamJsonLd } from '@/lib/seo'
import { SiteHeader } from './SiteHeader'
import { SiteFooter } from './HomePage'
import { MotionLayer } from './MotionLayer'
import { ShareButton } from './ShareButton'
import { EmblemSmall } from './Emblem'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function loadMatch(id: string) {
  if (!UUID_RE.test(id)) return null
  try {
    return await getMatchDetail(id)
  } catch (err) {
    console.error('Не вдалося завантажити матч', err)
    return null
  }
}

export async function matchMetadata(id: string, locale: Locale): Promise<Metadata> {
  const data = await loadMatch(id)
  if (!data) return {}
  const t = getDict(locale)
  const { match } = data
  const score = match.ourSets !== null ? ` ${match.ourSets}:${match.theirSets}` : ''
  const title = `${t.clubName} — ${match.opponent}${score}`
  const description = [
    formatMatchDate(match.startsAt, locale),
    match.location,
    data.tournament?.name,
    match.kind === 'friendly' ? t.matches.friendlyBadge : null,
  ]
    .filter(Boolean)
    .join(' · ')
  const path = `/matches/${match.id}`
  return {
    title,
    description,
    alternates: {
      canonical: `${localePrefix(locale)}${path}`,
      languages: { uk: path, en: `/en${path}` },
    },
    openGraph: { type: 'article', title, description, locale: t.ogLocale, url: `${localePrefix(locale)}${path}` },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export async function MatchPage({ id, locale }: { id: string; locale: Locale }) {
  const data = await loadMatch(id)
  if (!data) notFound()
  const t = getDict(locale)
  const { match, venue, tournament, h2h } = data
  const prefix = localePrefix(locale)
  const past = isPastMatch(match)
  const scored = match.ourSets !== null && match.theirSets !== null
  const won = scored && match.ourSets! > match.theirSets!
  const mapQuery = venue
    ? (normalizeMapQuery(venue.mapQuery) ?? normalizeMapQuery(venue.address) ?? venue.name)
    : match.location
  const event = matchEvent(match, { locale, venueAddress: venue?.address, tournament: tournament?.name })
  const url = matchUrl(match.id, locale)
  const otherLocale = locale === 'uk' ? 'en' : 'uk'

  const h2hScored = h2h.filter((m) => m.ourSets !== null && m.theirSets !== null)
  const h2hWins = h2hScored.filter((m) => m.ourSets! > m.theirSets!).length

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      teamJsonLd(null, locale),
      matchJsonLd({ ...match, venueAddress: venue?.address, tournament: tournament?.name }, locale),
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />
      <MotionLayer />
      <SiteHeader
        locale={locale}
        onHome={false}
        altHref={`${localePrefix(otherLocale)}/matches/${match.id}`}
      />
      <main id="top" className="section match-page">
        <div className="container">
          <a href={`${prefix}/#matches`} className="back-link">
            {t.detail.back}
          </a>

          <article className={`match-hero${match.kind === 'friendly' ? ' is-friendly' : ''}`} data-reveal>
            <div className="match-hero-meta">
              <span className="match-chip">{past ? t.detail.played : t.detail.upcoming}</span>
              {match.kind === 'friendly' && <span className="match-kind">{t.matches.friendlyBadge}</span>}
              {tournament && <span className="match-tournament">{tournament.name}</span>}
            </div>
            <h1 className="match-hero-teams">
              <span className="match-hero-team">
                <EmblemSmall size={64} className="match-hero-emblem" />
                <span>{t.clubName}</span>
              </span>
              {scored ? (
                <span className={`match-hero-score${won ? ' is-win' : ' is-loss'}`}>
                  {match.ourSets}:{match.theirSets}
                  <span className="sr-only"> — {won ? t.win : t.loss}</span>
                </span>
              ) : (
                <span className="match-hero-vs">{t.matches.vs}</span>
              )}
              <span className="match-hero-team">
                <span className="match-hero-initial" aria-hidden="true">
                  {match.opponent.trim().charAt(0).toUpperCase()}
                </span>
                <span>{match.opponent}</span>
              </span>
            </h1>
            {scored && <p className={`match-hero-result${won ? ' is-win' : ' is-loss'}`}>{won ? t.win : t.loss}</p>}

            <dl className="match-facts">
              <div>
                <dt>{t.detail.date}</dt>
                <dd>
                  <time dateTime={match.startsAt.toISOString()}>{formatMatchDate(match.startsAt, locale)}</time>
                </dd>
              </div>
              {match.location && (
                <div>
                  <dt>{t.detail.venue}</dt>
                  <dd>
                    {match.location}
                    {venue?.address && <span className="match-facts-sub">{venue.address}</span>}
                    {mapQuery && (
                      <a href={mapLinks(mapQuery).open} target="_blank" rel="noopener noreferrer" className="match-link">
                        📍 {t.detail.openMap}
                      </a>
                    )}
                  </dd>
                </div>
              )}
              {tournament && (
                <div>
                  <dt>{t.detail.tournament}</dt>
                  <dd>{tournament.name}</dd>
                </div>
              )}
              <div>
                <dt>{t.detail.season}</dt>
                <dd>{seasonLabel(seasonKey(match.startsAt))}</dd>
              </div>
            </dl>

            <div className="match-hero-actions">
              {!past && (
                <>
                  <a className="btn-primary" href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer">
                    📅 {t.calendar.eventGoogle}
                  </a>
                  <a className="btn-ghost" href={`${prefix}/matches/${match.id}/event.ics`} download>
                    {t.calendar.eventIcs}
                  </a>
                </>
              )}
              <ShareButton url={url} title={event.title} label={t.detail.share} copiedLabel={t.detail.copied} />
            </div>
          </article>

          <section className="h2h-card" data-reveal aria-labelledby="h2h-title">
            <div className="h2h-head">
              <h2 className="subsection-title" id="h2h-title">
                {t.detail.h2h}
              </h2>
              {h2hScored.length > 0 && (
                <p className="h2h-record">
                  <strong>{t.stats.h2hRecord(h2hWins, h2hScored.length - h2hWins)}</strong>
                </p>
              )}
            </div>
            {h2h.length === 0 ? (
              <p className="state-message">{t.detail.noH2h}</p>
            ) : (
              <ul className="h2h-list">
                {h2h.map((m) => {
                  const s = m.ourSets !== null && m.theirSets !== null
                  return (
                    <li key={m.id}>
                      <a href={`${prefix}/matches/${m.id}`}>
                        <time dateTime={m.startsAt.toISOString()}>{formatMatchDate(m.startsAt, locale)}</time>
                        {s ? (
                          <span className={`match-score${m.ourSets! > m.theirSets! ? ' is-win' : ' is-loss'}`}>
                            {m.ourSets}:{m.theirSets}
                          </span>
                        ) : (
                          <span className="vs-badge">{t.matches.vs}</span>
                        )}
                      </a>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </>
  )
}
