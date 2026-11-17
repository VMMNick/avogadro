import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import { DeleteButton } from '@/components/admin/ui'
import { TrainingForm } from '@/components/admin/forms'
import { WEEKDAYS } from '@/lib/admin-labels'
import { getDirectoryOptions } from '@/lib/data'
import { toOptions } from '@/lib/directory'
import { deleteTrainingAction } from '../../../actions'

export const metadata = { title: 'Редагування тренування' }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function EditTrainingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()
  const [[item], dirs] = await Promise.all([
    getDb().select().from(schema.trainings).where(eq(schema.trainings.id, id)).limit(1),
    getDirectoryOptions(),
  ])
  if (!item) notFound()
  return (
    <>
      <div className="adm-page-head">
        <h1>
          {WEEKDAYS[item.weekday - 1]}, {item.startTime}–{item.endTime}
        </h1>
      </div>
      <TrainingForm training={item} venues={toOptions(dirs).venues} />
      <section className="adm-card" style={{ marginTop: 20 }}>
        <h2>Видалення</h2>
        <form action={deleteTrainingAction} className="adm-actions">
          <input type="hidden" name="id" value={item.id} />
          <span className="adm-muted">Прибрати з розкладу.</span>
          <DeleteButton />
        </form>
      </section>
    </>
  )
}
