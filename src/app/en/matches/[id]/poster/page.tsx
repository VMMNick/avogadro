import { PosterPage, posterMetadata } from '@/components/site/PosterPage'
import { HtmlLang } from '@/components/site/HtmlLang'

export const revalidate = 600

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  return posterMetadata((await params).id, 'en')
}

export default async function Page({ params }: Props) {
  return (
    <div lang="en">
      <HtmlLang lang="en" />
      <PosterPage id={(await params).id} locale="en" />
    </div>
  )
}
