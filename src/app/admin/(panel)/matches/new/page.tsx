import { MatchForm } from '@/components/admin/forms'
import { getDirectoryOptions } from '@/lib/data'
import { toOptions } from '@/lib/directory'

export const metadata = { title: 'Нова гра' }

export default async function NewMatchPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const [{ kind }, dirs] = await Promise.all([searchParams, getDirectoryOptions()])
  const { teams, venues, tournaments } = toOptions(dirs)
  const friendly = kind === 'friendly'
  return (
    <>
      <div className="adm-page-head">
        <h1>{friendly ? 'Нова товариська гра' : 'Новий матч'}</h1>
      </div>
      <MatchForm initialKind={friendly ? 'friendly' : 'official'} teams={teams} venues={venues} tournaments={tournaments} />
    </>
  )
}
