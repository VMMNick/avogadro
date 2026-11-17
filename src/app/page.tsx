import type { Metadata } from 'next'
import { HomePage } from '@/components/site/HomePage'

// Сторінка кешується і оновлюється одразу після змін в адмінці;
// раз на 10 хвилин — додатково, щоб матчі вчасно переходили в «Результати».
export const revalidate = 600

export const metadata: Metadata = {
  alternates: { canonical: '/', languages: { uk: '/', en: '/en', 'x-default': '/' } },
}

export default function Page() {
  return <HomePage locale="uk" />
}
