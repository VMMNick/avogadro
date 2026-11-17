import Link from 'next/link'
import { HtmlLang } from '@/components/site/HtmlLang'
import { getDict } from '@/lib/i18n'

const t = getDict('en')

export const metadata = { title: { absolute: `${t.notFound.title} — ${t.clubFull}` } }

export default function NotFound() {
  return (
    <main className="not-found" lang="en">
      <HtmlLang lang="en" />
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/emblem-512.webp" alt="" width={140} height={140} />
        <h1 className="section-title">{t.notFound.title}</h1>
        <Link href="/en" className="btn-primary">
          {t.notFound.home}
        </Link>
      </div>
    </main>
  )
}
