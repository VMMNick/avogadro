import { SiteHeader } from './SiteHeader'
import { TeamSection } from './TeamSection'
import { EmblemLarge, EmblemSmall } from './Emblem'
import { HallMap } from './HallMap'
import { MotionLayer } from './MotionLayer'
import { MatchesSection } from './MatchesSection'
import { StatsSection } from './StatsSection'
import { CalendarSubscribe } from './CalendarSubscribe'
import { mapLinks, normalizeMapQuery } from '@/lib/maps'
import { getSiteContent } from '@/lib/data'
import { prepareMatches, prepareStandings } from '@/lib/public-data'
import { StandingsSection } from './StandingsSection'
import { getDict, localePrefix, type Locale } from '@/lib/i18n'
import { SITE_URL } from '@/lib/constants'
import { jsonLdScript, matchJsonLd, teamJsonLd } from '@/lib/seo'

/** Головна сторінка сайту — однакова для української та англійської версій. */
export async function HomePage({ locale }: { locale: Locale }) {
  const t = getDict(locale)
  const { players, matches, settings, venues, tournaments, teams, gamesByPlayer, failed } = await getSiteContent()

  const { publicMatches, defaultSeason, venueById, tournamentById } = prepareMatches(
    matches,
    venues,
    tournaments,
    teams,
  )

  const standings = prepareStandings(tournaments, teams, t.clubName)

  const tagline = (locale === 'en' ? settings?.taglineEn : settings?.tagline) || t.hero.tagline
  const about = ((locale === 'en' ? settings?.aboutEn : settings?.about) || t.about.text)
    .split(/\r?\n\s*\r?\n/)
    .filter((p) => p.trim())

  const mapQuery = normalizeMapQuery(settings?.mapQuery) ?? normalizeMapQuery(settings?.address)

  const contacts: { label: string; value: React.ReactNode }[] = []
  if (settings?.phone) {
    contacts.push({
      label: t.contacts.phone,
      value: <a href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`}>{settings.phone}</a>,
    })
  }
  if (settings?.email) {
    contacts.push({ label: t.contacts.email, value: <a href={`mailto:${settings.email}`}>{settings.email}</a> })
  }
  if (settings?.address) {
    contacts.push({
      label: t.contacts.address,
      value: mapQuery ? (
        <a href={mapLinks(mapQuery).open} target="_blank" rel="noopener noreferrer">
          {settings.address}
        </a>
      ) : (
        settings.address
      ),
    })
  }
  const socials = (
    [
      ['Instagram', settings?.instagram],
      ['Facebook', settings?.facebook],
      ['Telegram', settings?.telegram],
    ] as const
  ).filter(([, url]) => url)
  if (socials.length) {
    contacts.push({
      label: t.contacts.socials,
      value: socials.map(([label, url], i) => (
        <span key={label}>
          {i > 0 && ' · '}
          <a href={url!} target="_blank" rel="noopener noreferrer">
            {label}
          </a>
        </span>
      )),
    })
  }

  // Розмітка для пошуковиків: клуб + найближчі ігри
  const upcoming = matches.filter((m) => !publicMatches.find((p) => p.id === m.id)?.isPast).slice(0, 10)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      teamJsonLd(settings, locale),
      ...upcoming.map((m) =>
        matchJsonLd(
          {
            ...m,
            venueAddress: m.venueId ? venueById.get(m.venueId)?.address : null,
            tournament: m.tournamentId ? tournamentById.get(m.tournamentId)?.name : null,
          },
          locale,
        ),
      ),
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />
      <a className="skip-link" href="#about">
        {t.skipLink}
      </a>
      <MotionLayer />
      <SiteHeader locale={locale} altHref={locale === 'uk' ? '/en' : '/'} />

      <main id="top">
        <section className="hero">
          <svg className="hero-orbits" viewBox="-300 -300 600 600" aria-hidden="true" focusable="false">
            <g className="orbit-spin">
              <ellipse rx="280" ry="92" />
              <ellipse rx="280" ry="92" transform="rotate(60)" />
              <ellipse rx="280" ry="92" transform="rotate(-60)" />
              <circle className="electron" cx="280" cy="0" r="7" />
              <circle className="electron" cx="-140" cy="-242" r="6" />
              <circle className="electron" cx="-140" cy="242" r="5" />
            </g>
          </svg>
          <div className="container hero-container">
            <div className="hero-copy">
              <p className="hero-kicker">{t.hero.kicker}</p>
              <h1>{t.clubName}</h1>
              <p className="hero-tagline">{tagline}</p>
              <div className="hero-actions">
                <a href="#matches" className="btn-primary">
                  {t.hero.ctaMatches}
                </a>
                <a href="#team" className="btn-ghost">
                  {t.hero.ctaTeam}
                </a>
              </div>
            </div>
            <div className="hero-emblem">
              <EmblemLarge />
            </div>
          </div>
        </section>

        <section id="about" className="section about-section">
          <div className="container">
            <h2 className="section-title" data-reveal="ribbon">
              {t.about.title}
            </h2>
            <div className="about-card" data-reveal>
              {about.map((paragraph, i) => (
                <p key={i}>{paragraph.trim()}</p>
              ))}
            </div>
          </div>
        </section>

        <section id="team" className="section team-section">
          <div className="container">
            <h2 className="section-title" data-reveal="ribbon">
              {t.team.title}
            </h2>
            {failed ? (
              <p className="state-message is-error">{t.team.loadError}</p>
            ) : (
              <TeamSection
                locale={locale}
                players={players.map(({ id, name, number, role, photoUrl }) => ({
                  id,
                  name,
                  number,
                  role,
                  photoUrl,
                  games: gamesByPlayer[id] ?? 0,
                  mvps: matches.filter((m) => m.mvpPlayerId === id).length,
                }))}
              />
            )}
          </div>
        </section>

        <section id="matches" className="section matches-section">
          <div className="container">
            <h2 className="section-title" data-reveal="ribbon">
              {t.matches.title}
            </h2>
            <MatchesSection
              matches={publicMatches}
              defaultSeason={defaultSeason}
              tournaments={tournaments.map(({ id, name }) => ({ id, name }))}
              locale={locale}
              siteUrl={SITE_URL}
            />
            <CalendarSubscribe feedUrl={`${SITE_URL}${localePrefix(locale)}/calendar.ics`} locale={locale} />
          </div>
        </section>

        <section id="stats" className="section stats-section">
          <div className="container">
            <h2 className="section-title" data-reveal="ribbon">
              {t.stats.title}
            </h2>
            <StatsSection
              matches={publicMatches}
              defaultSeason={defaultSeason}
              locale={locale}
              players={players.map(({ id, name, number, photoUrl }) => ({ id, name, number, photoUrl }))}
            />
          </div>
        </section>

        {standings.length > 0 && (
          <section id="standings" className="section standings-section">
            <div className="container">
              <h2 className="section-title" data-reveal="ribbon">
                {t.standings.title}
              </h2>
              <StandingsSection tables={standings} locale={locale} />
            </div>
          </section>
        )}

        <section id="contacts" className="section contacts-section">
          <div className="container">
            <h2 className="section-title" data-reveal="ribbon">
              {t.contacts.title}
            </h2>
            <div className="contacts-grid" data-reveal="stagger">
              {contacts.length ? (
                contacts.map((c) => (
                  <div key={c.label} className="contact-card">
                    <span className="contact-label">{c.label}</span>
                    <span className="contact-value">{c.value}</span>
                  </div>
                ))
              ) : (
                <p className="state-message">{t.contacts.soon}</p>
              )}
            </div>
            {mapQuery && <HallMap query={mapQuery} label={settings?.address ?? null} locale={locale} />}
          </div>
        </section>
      </main>

      <SiteFooter locale={locale} />
    </>
  )
}

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = getDict(locale)
  return (
    <footer className="footer">
      <div className="container footer-container">
        <EmblemSmall className="footer-emblem" size={72} />
        <p className="footer-name">{t.clubFull}</p>
        <p>
          © {new Date().getFullYear()} {t.footer.rights}
        </p>
      </div>
    </footer>
  )
}
