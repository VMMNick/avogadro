import { CalendarPage, calendarMetadata } from '@/components/site/CalendarPage'

export const revalidate = 600
export const metadata = calendarMetadata('uk')

export default function Page() {
  return <CalendarPage locale="uk" />
}
