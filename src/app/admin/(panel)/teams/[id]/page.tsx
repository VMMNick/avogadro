import { notFound } from 'next/navigation'
import { eq, sql } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import { DeleteButton } from '@/components/admin/ui'
import { deleteTeamAction } from '../../../actions'
import { TeamForm } from '@/components/admin/forms'

export const metadata = { title: 'Редагування команди' }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function EditTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()
  const db = getDb()
  const [[team], [{ n }]] = await Promise.all([
    db.select().from(schema.teams).where(eq(schema.teams.id, id)).limit(1),
    db.select({ n: sql<number>`count(*)::int` }).from(schema.matches).where(eq(schema.matches.teamId, id)),
  ])
  if (!team) notFound()
  return (
    <>
      <div className="adm-page-head">
        <h1>{team.name}</h1>
      </div>
      <TeamForm team={team} />
      <section className="adm-card" style={{ marginTop: 20 }}>
        <h2>Видалення</h2>
        <form action={deleteTeamAction} className="adm-actions">
          <input type="hidden" name="id" value={team.id} />
          <span className="adm-muted">
            Прибрати команду з довідника.{n > 0 && ` Її ігри (${n}) залишаться в розкладі з тією ж назвою суперника.`}
          </span>
          <DeleteButton />
        </form>
      </section>
    </>
  )
}
