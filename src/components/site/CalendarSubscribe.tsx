'use client'

import { CalendarBadge } from './Icons'
import { useState } from 'react'
import { subscribeUrls } from '@/lib/calendar'
import { getDict, type Locale } from '@/lib/i18n'

/** Підписка на календар усіх матчів клубу. */
export function CalendarSubscribe({ feedUrl, locale }: { feedUrl: string; locale: Locale }) {
  const t = getDict(locale)
  const urls = subscribeUrls(feedUrl)
  const [copied, setCopied] = useState(false)
  return (
    <div className="calendar-card" data-reveal>
      <div className="calendar-copy">
        <h3 className="subsection-title">
          <CalendarBadge />
          {t.calendar.title}
        </h3>
        <p>{t.calendar.text}</p>
      </div>
      <div className="calendar-actions">
        <a className="btn-primary" href={urls.google} target="_blank" rel="noopener noreferrer">
          {t.calendar.google}
        </a>
        <a className="btn-ghost" href={urls.webcal}>
          {t.calendar.apple}
        </a>
        <button
          type="button"
          className="btn-ghost"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(feedUrl)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            } catch {
              window.prompt(t.calendar.copy, feedUrl)
            }
          }}
        >
          {copied ? `✓ ${t.calendar.copied}` : t.calendar.copy}
        </button>
      </div>
    </div>
  )
}
