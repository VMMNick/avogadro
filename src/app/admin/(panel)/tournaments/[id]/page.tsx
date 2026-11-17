import { notFound } from 'next/navigation'
import { eq, sql } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import { DeleteButton } from '@/components/admin/ui'
import { deleteTournamentAction } from '../../../actions'
import { TournamentForm } from '@/components/admin/forms'

export const metadata = { title: 'Редагування турніру' }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function EditTournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()
  const db = getDb()
  const [[tournament], [{ n }]] = await Promise.all([
    db.select().from(schema.tournaments).where(eq(schema.tournaments.id, id)).limit(1),
    db.select({ n: sql<number>`count(*)::int` }).from(schema.matches).where(eq(schema.matches.tournamentId, id)),
  ])
  if (!tournament) notFound()
  return (
    <>
      <div className="adm-page-head">
        <h1>{tournament.name}</h1>
      </div>
      <TournamentForm tournament={tournament} />
      <section className="adm-card" style={{ marginTop: 20 }}>
        <h2>Видалення</h2>
        <form action={deleteTournamentAction} className="adm-actions">
          <input type="hidden" name="id" value={tournament.id} />
          <span className="adm-muted">
            Прибрати турнір з довідника.{n > 0 && ` Його ігри (${n}) залишаться, просто без турніру.`}
          </span>
          <DeleteButton />
        </form>
      </section>
    </>
  )
}
