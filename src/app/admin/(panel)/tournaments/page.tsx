import Link from 'next/link'
import { listTournaments } from '@/lib/data'
import { DeleteButton } from '@/components/admin/ui'
import { deleteTournamentAction } from '../../actions'
import { Flash } from '@/components/admin/Flash'

export const metadata = { title: 'Турніри' }

export default async function TournamentsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const [tournaments, params] = await Promise.all([listTournaments(), searchParams])
  return (
    <>
      <div className="adm-page-head">
        <h1>Турніри</h1>
        <Link href="/admin/tournaments/new" className="adm-btn adm-btn-primary">
          + Турнір
        </Link>
      </div>
      <Flash params={params} />
      <p className="adm-muted" style={{ marginBottom: 16 }}>
        Чемпіонати, кубки, ліги. На сайті за ними можна фільтрувати матчі. Сезон (2025/26) визначається автоматично за датою гри.
      </p>
      <section className="adm-card">
        {tournaments.length === 0 ? (
          <p className="adm-empty">Довідник порожній. Додайте перший турнір.</p>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>Назва</th>
                <th>Ігор</th>
                <th className="adm-actions-col" />
              </tr>
            </thead>
            <tbody>
              {tournaments.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link href={`/admin/tournaments/${t.id}`}>{t.name}</Link>
                  </td>
                  <td>{t.matches}</td>
                  <td className="adm-actions-col">
                    <div className="adm-row-actions">
                      <Link href={`/admin/tournaments/${t.id}`} className="adm-btn adm-btn-sm">
                        Змінити
                      </Link>
                      <form action={deleteTournamentAction}>
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
