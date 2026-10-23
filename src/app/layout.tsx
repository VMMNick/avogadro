import type { Metadata, Viewport } from 'next'
import '@fontsource-variable/inter'
import '@fontsource-variable/oswald'
import '@fontsource/russo-one/cyrillic-400.css'
import '@fontsource/russo-one/latin-400.css'
import './styles/site.css'
import { SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'ВК Авогадро — Офіційний сайт волейбольного клубу',
    template: '%s — ВК Авогадро',
  },
  description:
    'Офіційний сайт волейбольного клубу «Авогадро»: склад команди, розклад і результати матчів, контакти.',
  openGraph: {
    type: 'website',
    locale: 'uk_UA',
    siteName: 'ВК Авогадро',
    title: 'ВК Авогадро — Офіційний сайт',
    description: 'Склад команди, розклад і результати матчів волейбольного клубу «Авогадро».',
    images: [{ url: '/images/emblem-1024.png', width: 1024, height: 1024, alt: 'Емблема ВК «Авогадро»' }],
  },
}

export const viewport: Viewport = {
  themeColor: '#050d22',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  )
}
