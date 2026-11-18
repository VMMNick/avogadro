import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { formatMatchDate, getDict, localePrefix, type Locale } from '@/lib/i18n'
import { SITE_URL } from '@/lib/constants'
import { qrSvg } from '@/lib/qr'
import { loadMatch } from './MatchPage'
import { EmblemSmall } from './Emblem'
import { PrintButton } from './PrintButton'

export async function posterMetadata(id: string, locale: Locale): Promise<Metadata> {
  const data = await loadMatch(id)
  const t = getDict(locale)
  return {
    title: data ? `${t.poster.title}: ${t.clubName} — ${data.match.opponent}` : t.poster.title,
    robots: { index: false, follow: false },
  }
}

/** Афіша матчу А4 для друку з QR-кодом підписки на календар клубу. */
export async function PosterPage({ id, locale }: { id: string; locale: Locale }) {
  const data = await loadMatch(id)
  if (!data) notFound()
  const t = getDict(locale)
  const prefix = localePrefix(locale)
  const { match, venue, tournament, team } = data
  const calendarUrl = `${SITE_URL}${prefix}/calendar`
  const qr = await qrSvg(calendarUrl)
  const scored = match.ourSets !== null && match.theirSets !== null
  return (
    <main className="poster-page">
      <div className="poster-toolbar">
        <a href={`${prefix}/matches/${match.id}`} className="back-link">
          {t.detail.back}
        </a>
        <PrintButton label={t.poster.print} />
      </div>
      <article className="poster-sheet" aria-label={t.poster.title}>
        <header className="poster-head">
          <EmblemSmall size={96} className="poster-emblem" />
          <div>
            <p className="poster-club">{t.clubFull}</p>
            {(tournament || match.kind === 'friendly') && (
              <p className="poster-tournament">{tournament?.name ?? t.matches.friendlyBadge}</p>
            )}
          </div>
        </header>
        <h1 className="poster-teams">
          <span className="poster-opponent">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/emblem-192.png" alt="" width={88} height={88} />
            {t.clubName}
          </span>
          <span className="poster-vs">{scored ? `${match.ourSets}:${match.theirSets}` : t.matches.vs}</span>
          <span className="poster-opponent">
            {team?.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={team.logoUrl} alt="" width={88} height={88} />
            )}
            {match.opponent}
          </span>
        </h1>
        <p className="poster-date">
          <time dateTime={match.startsAt.toISOString()}>{formatMatchDate(match.startsAt, locale)}</time>
        </p>
        {match.location && (
          <p className="poster-venue">
            {match.location}
            {venue?.address && <span>{venue.address}</span>}
          </p>
        )}
        <footer className="poster-foot">
          <div className="poster-qr" dangerouslySetInnerHTML={{ __html: qr }} />
          <div>
            <p className="poster-scan">{t.poster.scan}</p>
            <p className="poster-url">{calendarUrl.replace(/^https?:\/\//, '')}</p>
          </div>
        </footer>
      </article>
    </main>
  )
}
