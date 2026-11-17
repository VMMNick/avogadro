/** Календарні посилання та файли .ics (RFC 5545) для матчів. */

/** Тривалість гри для календаря, якщо час завершення невідомий. */
export const MATCH_DURATION_MS = 2 * 60 * 60 * 1000

export type CalendarEvent = {
  uid: string
  title: string
  start: Date
  end?: Date
  location?: string | null
  description?: string | null
  url?: string | null
  updatedAt?: Date
}

/** 20261205T163000Z */
const icsDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

/** Посилання «Додати в Google Календар» для однієї події. */
export function googleCalendarUrl(e: CalendarEvent) {
  const end = e.end ?? new Date(e.start.getTime() + MATCH_DURATION_MS)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${icsDate(e.start)}/${icsDate(end)}`,
  })
  if (e.location) params.set('location', e.location)
  const details = [e.description, e.url].filter(Boolean).join('\n\n')
  if (details) params.set('details', details)
  return `https://calendar.google.com/calendar/render?${params}`
}

/** Посилання для підписки на весь календар у Google і в Apple/Outlook. */
export function subscribeUrls(feedUrl: string) {
  const webcal = feedUrl.replace(/^https?:\/\//, 'webcal://')
  return {
    webcal,
    google: `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcal)}`,
  }
}

const escapeText = (s: string) =>
  s.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,')

/** Розбиває рядки довші за 75 байт (вимога формату), не розриваючи символи UTF-8. */
function fold(line: string) {
  const enc = new TextEncoder()
  if (enc.encode(line).length <= 75) return line
  const out: string[] = []
  let cur = ''
  let bytes = 0
  for (const ch of line) {
    const b = enc.encode(ch).length
    const limit = out.length === 0 ? 75 : 74 // продовження починається з пробілу
    if (bytes + b > limit) {
      out.push(cur)
      cur = ''
      bytes = 0
    }
    cur += ch
    bytes += b
  }
  out.push(cur)
  return out.join('\r\n ')
}

export function buildIcs(events: CalendarEvent[], opts: { name: string; description?: string }) {
  const now = icsDate(new Date())
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//VK Avogadro//Matches//UK',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(opts.name)}`,
    'X-WR-TIMEZONE:Europe/Kyiv',
    // Як часто календарі перевіряють оновлення
    'REFRESH-INTERVAL;VALUE=DURATION:PT6H',
    'X-PUBLISHED-TTL:PT6H',
  ]
  if (opts.description) lines.push(`X-WR-CALDESC:${escapeText(opts.description)}`)
  for (const e of events) {
    const end = e.end ?? new Date(e.start.getTime() + MATCH_DURATION_MS)
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}`,
      `DTSTAMP:${e.updatedAt ? icsDate(e.updatedAt) : now}`,
      `DTSTART:${icsDate(e.start)}`,
      `DTEND:${icsDate(end)}`,
      `SUMMARY:${escapeText(e.title)}`,
    )
    if (e.location) lines.push(`LOCATION:${escapeText(e.location)}`)
    if (e.description) lines.push(`DESCRIPTION:${escapeText(e.description)}`)
    if (e.url) lines.push(`URL:${e.url}`)
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.map(fold).join('\r\n') + '\r\n'
}
