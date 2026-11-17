import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import { DeleteButton } from '@/components/admin/ui'
import { deleteMatchAction } from '../../../actions'
import { MatchForm } from '@/components/admin/forms'
import { toKyivInputValue } from '@/lib/format'
import { getDirectoryOptions } from '@/lib/data'
import { toOptions } from '@/lib/directory'

export const metadata = { title: 'Редагування матчу' }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function EditMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()
  const [[match], dirs] = await Promise.all([
    getDb().select().from(schema.matches).where(eq(schema.matches.id, id)).limit(1),
    getDirectoryOptions(),
  ])
  if (!match) notFound()
  const { teams, venues, tournaments } = toOptions(dirs)
  return (
    <>
      <div className="adm-page-head">
        <h1>Авогадро — {match.opponent}</h1>
      </div>
      <MatchForm
        match={{
          id: match.id,
          opponent: match.opponent,
          startsAt: toKyivInputValue(match.startsAt),
          location: match.location,
          ourSets: match.ourSets,
          theirSets: match.theirSets,
          kind: match.kind,
          teamId: match.teamId,
          venueId: match.venueId,
          tournamentId: match.tournamentId,
        }}
        teams={teams}
        venues={venues}
        tournaments={tournaments}
      />
      <section className="adm-card" style={{ marginTop: 20 }}>
        <h2>Видалення</h2>
        <form action={deleteMatchAction} className="adm-actions">
          <input type="hidden" name="id" value={match.id} />
          <span className="adm-muted">Видалити матч назавжди.</span>
          <DeleteButton />
        </form>
      </section>
    </>
  )
}
