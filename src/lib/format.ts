import { TIME_ZONE } from './constants'

const dateTime = new Intl.DateTimeFormat('uk-UA', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: TIME_ZONE,
})

const dateShort = new Intl.DateTimeFormat('uk-UA', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: TIME_ZONE,
})

export const formatDateTime = (d: Date) => dateTime.format(d)
export const formatDateShort = (d: Date) => dateShort.format(d)

/** Зсув часового поясу Києва (у хвилинах) для конкретної дати — з урахуванням літнього часу. */
function kyivOffsetMinutes(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date)
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value)
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return Math.round((asUtc - date.getTime()) / 60_000)
}

/** Значення для <input type="datetime-local"> у київському часі. */
export function toKyivInputValue(date: Date) {
  const local = new Date(date.getTime() + kyivOffsetMinutes(date) * 60_000)
  return local.toISOString().slice(0, 16)
}

/** Розбирає значення з <input type="datetime-local"> як київський час. */
export function fromKyivInputValue(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null
  const naiveUtc = new Date(`${value}:00Z`)
  if (Number.isNaN(naiveUtc.getTime())) return null
  // Двічі уточнюємо зсув — коректно поблизу переходу на літній/зимовий час
  let result = new Date(naiveUtc.getTime() - kyivOffsetMinutes(naiveUtc) * 60_000)
  result = new Date(naiveUtc.getTime() - kyivOffsetMinutes(result) * 60_000)
  return result
}
