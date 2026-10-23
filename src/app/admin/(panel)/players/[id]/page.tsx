import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import { DeleteButton } from '@/components/admin/ui'
import { deletePlayerAction } from '../../../actions'
import { PlayerForm } from '@/components/admin/forms'

export const metadata = { title: 'Редагування гравця' }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function EditPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()
  const [player] = await getDb().select().from(schema.players).where(eq(schema.players.id, id)).limit(1)
  if (!player) notFound()
  return (
    <>
      <div className="adm-page-head">
        <h1>{player.name}</h1>
      </div>
      <PlayerForm player={player} />
      <section className="adm-card" style={{ marginTop: 20 }}>
        <h2>Видалення</h2>
        <form action={deletePlayerAction} className="adm-actions">
          <input type="hidden" name="id" value={player.id} />
          <span className="adm-muted">Видалити гравця назавжди.</span>
          <DeleteButton />
        </form>
      </section>
    </>
  )
}
