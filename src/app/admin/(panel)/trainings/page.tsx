import Link from 'next/link'
import { listTrainings } from '@/lib/admin-lists'
import { DeleteButton } from '@/components/admin/ui'
import { Flash } from '@/components/admin/Flash'
import { WEEKDAYS } from '@/lib/admin-labels'
import { deleteTrainingAction } from '../../actions'

export const metadata = { title: 'Тренування' }

export default async function TrainingsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const [items, params] = await Promise.all([listTrainings(), searchParams])
  return (
    <>
      <div className="adm-page-head">
        <h1>Тренування</h1>
        <Link href="/admin/trainings/new" className="adm-btn adm-btn-primary">
          + Тренування
        </Link>
      </div>
      <Flash params={params} />
      <p className="adm-muted" style={{ marginBottom: 16 }}>
        Щотижневий розклад на сайті поруч із формою «Хочу до команди». Заявки з форми — у розділі{' '}
        <Link href="/admin/applications">«Заявки»</Link>.
      </p>
      <section className="adm-card">
        {items.length === 0 ? (
          <p className="adm-empty">Розклад порожній. Додайте перше тренування.</p>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>День</th>
                <th>Час</th>
                <th className="adm-hide-sm">Зал</th>
                <th className="adm-actions-col" />
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link href={`/admin/trainings/${t.id}`}>{WEEKDAYS[t.weekday - 1]}</Link>
                    {t.note && <span className="adm-muted"> · {t.note}</span>}
                  </td>
                  <td>
                    {t.startTime}–{t.endTime}
                  </td>
                  <td className="adm-hide-sm">{t.location ?? '—'}</td>
                  <td className="adm-actions-col">
                    <div className="adm-row-actions">
                      <Link href={`/admin/trainings/${t.id}`} className="adm-btn adm-btn-sm">
                        Змінити
                      </Link>
                      <form action={deleteTrainingAction}>
                        <input type="hidden" name="id" value={t.id} />
                        <DeleteButton />
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  )
}
