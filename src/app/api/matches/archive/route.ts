import { loadArchiveMatches } from '@/lib/public-data'

// Архів оновлюється разом із сайтом (після змін в адмінці) і щонайменше раз на 10 хвилин
export const revalidate = 600

export async function GET() {
  const matches = await loadArchiveMatches()
  return Response.json({ matches })
}
