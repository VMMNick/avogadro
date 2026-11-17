import type { Metadata } from 'next'
import { getSiteContent } from '@/lib/data'
import { getDict, localePrefix, type Locale } from '@/lib/i18n'
import { prepareMatches } from '@/lib/public-data'
import { SITE_URL } from '@/lib/constants'
import { qrSvg } from '@/lib/qr'
import { SiteHeader } from './SiteHeader'
import { SiteFooter } from './HomePage'
import { MotionLayer } from './MotionLayer'
import { CalendarSubscribe } from './CalendarSubscribe'
import { MatchCard } from './MatchesSection'

export function calendarMetadata(locale: Locale): Metadata {
  const t = getDict(locale)
  return {
    title: t.calendarPage.title,
    description: t.calendarPage.lead,
    alternates: { canonical: `${localePrefix(locale)}/calendar`, languages: { uk: '/calendar', en: '/en/calendar' } },
  }
}

/** Сторінка підписки на календар — сюди веде QR-код з афіш. */
export async function CalendarPage({ locale }: { locale: Locale }) {
  const t = getDict(locale)
  const prefix = localePrefix(locale)
  let upcoming: ReturnType<typeof prepareMatches>['publicMatches'] = []
  try {
    const content = await getSiteContent()
    upcoming = prepareMatches(content.matches, content.venues, content.tournaments, content.teams)
      .publicMatches.filter((m) => !m.isPast)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
      .slice(0, 6)
  } catch (err) {
    console.error('Календар: не вдалося отримати матчі', err)
  }
  const qr = await qrSvg(`${SITE_URL}${prefix}/calendar`)
  return (
    <>
      <MotionLayer />
      <SiteHeader locale={locale} onHome={false} altHref={`${localePrefix(locale === 'uk' ? 'en' : 'uk')}/calendar`} />
      <main id="top" className="section calendar-page">
        <div className="container">
          <a href={`${prefix}/`} className="back-link">
            ← {t.calendarPage.toSite}
          </a>
          <h1 className="section-title" data-reveal>
            {t.calendarPage.title}
          </h1>
          <p className="calendar-lead" data-reveal>
            {t.calendarPage.lead}
          </p>
          <div className="calendar-page-grid">
            <CalendarSubscribe feedUrl={`${SITE_URL}${prefix}/calendar.ics`} locale={locale} />
            <figure className="calendar-qr" data-reveal>
              <div className="qr-box" dangerouslySetInnerHTML={{ __html: qr }} />
              <figcaption>{t.poster.scan}</figcaption>
            </figure>
          </div>
          <h2 className="subsection-title" data-reveal>
            {t.calendarPage.upcoming}
          </h2>
          <div className="match-list calendar-upcoming" data-reveal="stagger">
            {upcoming.length ? (
              upcoming.map((m) => <MatchCard key={m.id} match={m} locale={locale} siteUrl={SITE_URL} />)
            ) : (
              <p className="state-message">{t.calendarPage.none}</p>
            )}
          </div>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </>
  )
}
