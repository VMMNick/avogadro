import { MatchPage, matchMetadata } from '@/components/site/MatchPage'

export const revalidate = 600

// Сторінки матчів створюються при першому відкритті й далі кешуються
export async function generateStaticParams() {
  return []
}

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  return matchMetadata(id, 'uk')
}

export default async function Page({ params }: Props) {
  const { id } = await params
  return (
    <MatchPage id={id} locale="uk" />
  )
}
