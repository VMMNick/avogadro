import { MatchPage, matchMetadata } from '@/components/site/MatchPage'
import { HtmlLang } from '@/components/site/HtmlLang'

export const revalidate = 600

// Сторінки матчів створюються при першому відкритті й далі кешуються
export async function generateStaticParams() {
  return []
}

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  return matchMetadata(id, 'en')
}

export default async function Page({ params }: Props) {
  const { id } = await params
  return (
    <div lang="en">
      <HtmlLang lang="en" />
      <MatchPage id={id} locale="en" />
    </div>
  )
}
