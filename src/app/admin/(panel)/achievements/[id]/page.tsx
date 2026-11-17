import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import { DeleteButton } from '@/components/admin/ui'
import { AchievementForm } from '@/components/admin/forms'
import { seasonOptions } from '@/lib/admin-lists'
import { deleteAchievementAction } from '../../../actions'

export const metadata = { title: 'Редагування досягнення' }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function EditAchievementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()
  const [item] = await getDb().select().from(schema.achievements).where(eq(schema.achievements.id, id)).limit(1)
  if (!item) notFound()
  const seasons = seasonOptions()
  return (
    <>
      <div className="adm-page-head">
        <h1>{item.title}</h1>
      </div>
      <AchievementForm
        achievement={item}
        seasons={seasons.includes(item.season) ? seasons : [item.season, ...seasons]}
      />
      <section className="adm-card" style={{ marginTop: 20 }}>
        <h2>Видалення</h2>
        <form action={deleteAchievementAction} className="adm-actions">
          <input type="hidden" name="id" value={item.id} />
          <span className="adm-muted">Прибрати з полиці трофеїв.</span>
          <DeleteButton />
        </form>
      </section>
    </>
  )
}
