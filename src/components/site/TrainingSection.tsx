import type { Training, Venue } from '@/db/schema'
import { getDict, type Locale } from '@/lib/i18n'
import { mapLinks, normalizeMapQuery } from '@/lib/maps'
import { JoinForm } from './JoinForm'
import { PinIcon } from './Icons'

/** Назва дня тижня мовою сайту (1 — понеділок). */
function weekdayName(weekday: number, intl: string) {
  // 2024-01-01 — понеділок
  const d = new Date(Date.UTC(2024, 0, weekday, 12))
  const name = new Intl.DateTimeFormat(intl, { weekday: 'long', timeZone: 'UTC' }).format(d)
  return name.charAt(0).toUpperCase() + name.slice(1)
}

export function TrainingSection({
  trainings,
  venues,
  locale,
}: {
  trainings: Training[]
  venues: Map<string, Venue>
  locale: Locale
}) {
  const t = getDict(locale)
  return (
    <div className="join-grid">
      <div className="join-schedule" data-reveal>
        <h3 className="subsection-title">{t.join.schedule}</h3>
        {trainings.length === 0 ? (
          <p className="state-message">{t.join.noSchedule}</p>
        ) : (
          <ul className="training-list">
            {trainings.map((tr) => {
              const venue = tr.venueId ? venues.get(tr.venueId) : undefined
              const q = venue
                ? (normalizeMapQuery(venue.mapQuery) ?? normalizeMapQuery(venue.address) ?? venue.name)
                : tr.location
              return (
                <li key={tr.id} className="training-item">
                  <span className="training-day">{weekdayName(tr.weekday, t.intl)}</span>
                  <span className="training-time">
                    {tr.startTime}–{tr.endTime}
                  </span>
                  {tr.location && (
                    <span className="training-place">
                      {q ? (
                        <a href={mapLinks(q).open} target="_blank" rel="noopener noreferrer">
                          <PinIcon /> {tr.location}
                        </a>
                      ) : (
                        tr.location
                      )}
                    </span>
                  )}
                  {tr.note && locale === 'uk' && <span className="training-note">{tr.note}</span>}
                </li>
              )
            })}
          </ul>
        )}
      </div>
      <div className="join-card" data-reveal>
        <h3 className="subsection-title">{t.join.formTitle}</h3>
        <p className="join-lead">{t.join.formText}</p>
        <JoinForm locale={locale} />
      </div>
    </div>
  )
}
