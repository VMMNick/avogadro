import { calendarFeedResponse } from '@/lib/calendar-feed'

// Календар оновлюється разом із сайтом (після змін в адмінці) і щонайменше раз на 10 хвилин
export const revalidate = 600

export function GET() {
  return calendarFeedResponse('en')
}
