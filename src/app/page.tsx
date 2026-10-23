import { SiteHeader } from '@/components/site/SiteHeader'
import { TeamSection } from '@/components/site/TeamSection'
import { EmblemLarge, EmblemSmall } from '@/components/site/Emblem'
import { getSiteContent, splitMatches } from '@/lib/data'
import { CLUB_NAME, DEFAULT_ABOUT, DEFAULT_TAGLINE } from '@/lib/constants'
import { formatDateTime } from '@/lib/format'
import type { Match } from '@/db/schema'

// Сторінка кешується і оновлюється одразу після змін в адмінці;
// раз на 10 хвилин — додатково, щоб матчі вчасно переходили в «Результати».
export const revalidate = 600

function MatchCard({ match, past }: { match: Match; past: boolean }) {
  const hasScore = match.ourSets !== null && match.theirSets !== null
  const result = hasScore ? (match.ourSets! > match.theirSets! ? ' is-win' : ' is-loss') : ''
  return (
    <article className={`match-card${past ? ' is-past' : ''}`}>
      <div className="match-date">
        <time dateTime={match.startsAt.toISOString()}>{formatDateTime(match.startsAt)}</time>
      </div>
      <div className="teams-vs">
        <span className="team-title">{CLUB_NAME}</span>
        {hasScore ? (
          <span className={`match-score${result}`}>
            {match.ourSets}:{match.theirSets}
          </span>
        ) : (
          <span className="vs-badge">{past ? '—' : 'VS'}</span>
        )}
        <span className="team-title">{match.opponent}</span>
      </div>
      {match.location && <div className="match-location">📍 {match.location}</div>}
    </article>
  )
}

export default async function HomePage() {
  const { players, matches, settings, failed } = await getSiteContent()
  const { upcoming, past } = splitMatches(matches)
  const about = (settings?.about || DEFAULT_ABOUT)
    .split(/\r?\n\s*\r?\n/)
    .filter((p) => p.trim())

  const contacts: { label: string; value: React.ReactNode }[] = []
  if (settings?.phone) {
    contacts.push({
      label: 'Телефон',
      value: <a href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`}>{settings.phone}</a>,
    })
  }
  if (settings?.email) {
    contacts.push({ label: 'Email', value: <a href={`mailto:${settings.email}`}>{settings.email}</a> })
  }
  if (settings?.address) contacts.push({ label: 'Адреса', value: settings.address })
  const socials = (
    [
      ['Instagram', settings?.instagram],
      ['Facebook', settings?.facebook],
      ['Telegram', settings?.telegram],
    ] as const
  ).filter(([, url]) => url)
  if (socials.length) {
    contacts.push({
      label: 'Соцмережі',
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

  return (
    <>
      <a className="skip-link" href="#about">
        Перейти до вмісту
      </a>
      <SiteHeader />

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
              <p className="hero-kicker">Волейбольний клуб</p>
              <h1>{CLUB_NAME}</h1>
              <p className="hero-tagline">{settings?.tagline || DEFAULT_TAGLINE}</p>
              <div className="hero-actions">
                <a href="#matches" className="btn-primary">
                  Найближчі матчі
                </a>
                <a href="#team" className="btn-ghost">
                  Склад команди
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
            <h2 className="section-title">Про клуб</h2>
            <div className="about-card">
              {about.map((paragraph, i) => (
                <p key={i}>{paragraph.trim()}</p>
              ))}
            </div>
          </div>
        </section>

        <section id="team" className="section team-section">
          <div className="container">
            <h2 className="section-title">Склад команди</h2>
            {failed ? (
              <p className="state-message is-error">Не вдалося завантажити дані. Спробуйте пізніше.</p>
            ) : (
              <TeamSection
                players={players.map(({ id, name, number, role, photoUrl }) => ({
                  id,
                  name,
                  number,
                  role,
                  photoUrl,
                }))}
              />
            )}
          </div>
        </section>

        <section id="matches" className="section matches-section">
          <div className="container">
            <h2 className="section-title">Матчі</h2>
            <div className="matches-columns">
              <div>
                <h3 className="subsection-title">Найближчі ігри</h3>
                <div className="match-list">
                  {upcoming.length ? (
                    upcoming.map((m) => <MatchCard key={m.id} match={m} past={false} />)
                  ) : (
                    <p className="state-message">Найближчих ігор поки не заплановано.</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="subsection-title">Результати</h3>
                <div className="match-list">
                  {past.length ? (
                    past.map((m) => <MatchCard key={m.id} match={m} past />)
                  ) : (
                    <p className="state-message">Результатів ще немає.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="contacts" className="section contacts-section">
          <div className="container">
            <h2 className="section-title">Контакти</h2>
            <div className="contacts-grid">
              {contacts.length ? (
                contacts.map((c) => (
                  <div key={c.label} className="contact-card">
                    <span className="contact-label">{c.label}</span>
                    <span className="contact-value">{c.value}</span>
                  </div>
                ))
              ) : (
                <p className="state-message">Контакти з&apos;являться незабаром.</p>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-container">
          <EmblemSmall className="footer-emblem" size={72} />
          <p className="footer-name">ВК «{CLUB_NAME}»</p>
          <p>© {new Date().getFullYear()} Усі права захищено.</p>
        </div>
      </footer>
    </>
  )
}
