import Link from 'next/link'
import { listAchievements } from '@/lib/admin-lists'
import { DeleteButton } from '@/components/admin/ui'
import { Flash } from '@/components/admin/Flash'
import { ACHIEVEMENT_LABELS } from '@/lib/admin-labels'
import { deleteAchievementAction } from '../../actions'

export const metadata = { title: 'Досягнення' }

export default async function AchievementsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const [items, params] = await Promise.all([listAchievements(), searchParams])
  return (
    <>
      <div className="adm-page-head">
        <h1>Досягнення</h1>
        <Link href="/admin/achievements/new" className="adm-btn adm-btn-primary">
          + Досягнення
        </Link>
      </div>
      <Flash params={params} />
      <p className="adm-muted" style={{ marginBottom: 16 }}>
        «Полиця трофеїв» на сайті: медалі, кубки й відзнаки клубу по сезонах. Блок з&apos;являється, коли є хоча б одне
        досягнення.
      </p>
      <section className="adm-card">
        {items.length === 0 ? (
          <p className="adm-empty">Досягнень ще немає.</p>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>Сезон</th>
                <th>Нагорода</th>
                <th className="adm-actions-col" />
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td>{a.season.replace('-', '/')}</td>
                  <td>
                    <Link href={`/admin/achievements/${a.id}`}>
                      {ACHIEVEMENT_LABELS[a.kind].split(' ')[0]} {a.title}
                    </Link>
                  </td>
                  <td className="adm-actions-col">
                    <div className="adm-row-actions">
                      <Link href={`/admin/achievements/${a.id}`} className="adm-btn adm-btn-sm">
                        Змінити
                      </Link>
                      <form action={deleteAchievementAction}>
                        <input type="hidden" name="id" value={a.id} />
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
