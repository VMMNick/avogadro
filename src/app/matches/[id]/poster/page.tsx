import { PosterPage, posterMetadata } from '@/components/site/PosterPage'

export const revalidate = 600

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  return posterMetadata((await params).id, 'uk')
}

export default async function Page({ params }: Props) {
  return <PosterPage id={(await params).id} locale="uk" />
}
