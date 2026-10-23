import { MatchForm } from '@/components/admin/forms'

export const metadata = { title: 'Нова гра' }

export default async function NewMatchPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const { kind } = await searchParams
  const friendly = kind === 'friendly'
  return (
    <>
      <div className="adm-page-head">
        <h1>{friendly ? 'Нова товариська гра' : 'Новий матч'}</h1>
      </div>
      <MatchForm initialKind={friendly ? 'friendly' : 'official'} />
    </>
  )
}
