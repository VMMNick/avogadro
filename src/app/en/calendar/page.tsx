import { CalendarPage, calendarMetadata } from '@/components/site/CalendarPage'
import { HtmlLang } from '@/components/site/HtmlLang'

export const revalidate = 600
export const metadata = calendarMetadata('en')

export default function Page() {
  return (
    <div lang="en">
      <HtmlLang lang="en" />
      <CalendarPage locale="en" />
    </div>
  )
}
