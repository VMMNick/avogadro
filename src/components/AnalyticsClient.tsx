'use client'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

// Адмін-панель у статистику не потрапляє
const skipAdmin = <T extends { url: string }>(event: T) => (new URL(event.url).pathname.startsWith('/admin') ? null : event)

export function AnalyticsClient() {
  return (
    <>
      <Analytics beforeSend={skipAdmin} />
      <SpeedInsights beforeSend={skipAdmin} />
    </>
  )
}
