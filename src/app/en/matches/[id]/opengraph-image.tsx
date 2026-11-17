import { matchOgImage, OG_SIZE } from '@/lib/og-image'

export const size = OG_SIZE
export const contentType = 'image/png'
export const revalidate = 600
export const alt = 'Avogadro match'

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return matchOgImage(id, 'en')
}
