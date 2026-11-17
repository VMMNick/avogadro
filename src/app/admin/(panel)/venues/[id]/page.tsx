import { notFound } from 'next/navigation'
import { eq, sql } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import { DeleteButton } from '@/components/admin/ui'
import { deleteVenueAction } from '../../../actions'
import { VenueForm } from '@/components/admin/forms'

export const metadata = { title: 'Редагування залу' }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function EditVenuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()
  const db = getDb()
  const [[venue], [{ n }]] = await Promise.all([
    db.select().from(schema.venues).where(eq(schema.venues.id, id)).limit(1),
    db.select({ n: sql<number>`count(*)::int` }).from(schema.matches).where(eq(schema.matches.venueId, id)),
  ])
  if (!venue) notFound()
  return (
    <>
      <div className="adm-page-head">
        <h1>{venue.name}</h1>
      </div>
      <VenueForm venue={venue} />
      <section className="adm-card" style={{ marginTop: 20 }}>
        <h2>Видалення</h2>
        <form action={deleteVenueAction} className="adm-actions">
          <input type="hidden" name="id" value={venue.id} />
          <span className="adm-muted">
            Прибрати зал з довідника.{n > 0 && ` Його ігри (${n}) залишаться з тією ж назвою залу.`}
          </span>
          <DeleteButton />
        </form>
      </section>
    </>
  )
}
