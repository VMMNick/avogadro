import type { Metadata } from 'next'
import { HomePage } from '@/components/site/HomePage'
import { HtmlLang } from '@/components/site/HtmlLang'
import { getDict } from '@/lib/i18n'

export const revalidate = 600

const t = getDict('en')

export const metadata: Metadata = {
  title: { absolute: t.siteTitle },
  description: t.siteDescription,
  alternates: { canonical: '/en', languages: { uk: '/', en: '/en', 'x-default': '/' } },
  openGraph: {
    locale: t.ogLocale,
    siteName: t.clubFull,
    title: t.siteTitle,
    description: t.siteDescription,
    url: '/en',
  },
}

export default function Page() {
  return (
    <div lang="en">
      <HtmlLang lang="en" />
      <HomePage locale="en" />
    </div>
  )
}
