import Link from 'next/link'
import { listTeams } from '@/lib/data'
import { DeleteButton } from '@/components/admin/ui'
import { deleteTeamAction } from '../../actions'
import { Flash } from '@/components/admin/Flash'
import { SearchBox } from '@/components/admin/SearchBox'
import { matchesSearch } from '@/lib/search'

export const metadata = { title: 'Команди' }

export default async function TeamsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const [all, params] = await Promise.all([listTeams(), searchParams])
  const q = (params.q ?? '').slice(0, 80)
  const teams = q ? all.filter((t) => matchesSearch(q, t.name, t.city)) : all
  return (
    <>
      <div className="adm-page-head">
        <h1>Команди</h1>
        <Link href="/admin/teams/new" className="adm-btn adm-btn-primary">
          + Команда
        </Link>
      </div>
      <Flash params={params} />
      <p className="adm-muted" style={{ marginBottom: 16 }}>
        Довідник суперників. У формі матчу команду обирають зі списку, а не вводять щоразу.
      </p>
      <section className="adm-card">
        {all.length > 0 && <SearchBox label="Пошук команди" placeholder="Пошук за назвою або містом…" found={teams.length} />}
        {all.length === 0 ? (
          <p className="adm-empty">Довідник порожній. Додайте першу команду.</p>
        ) : teams.length === 0 ? (
          <p className="adm-empty">За запитом «{q}» нічого не знайдено.</p>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>Назва</th>
                <th className="adm-hide-sm">Місто</th>
                <th>Ігор</th>
                <th className="adm-actions-col" />
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => (
                <tr key={t.id}>
                  <td>
                    <span className="adm-team-name">
                      {t.logoUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className="adm-logo-thumb" src={t.logoUrl} alt="" />
                      )}
                      <Link href={`/admin/teams/${t.id}`}>{t.name}</Link>
                    </span>
                  </td>
                  <td className="adm-hide-sm">{t.city ?? '—'}</td>
                  <td>{t.matches}</td>
                  <td className="adm-actions-col">
                    <div className="adm-row-actions">
                      <Link href={`/admin/teams/${t.id}`} className="adm-btn adm-btn-sm">
                        Змінити
                      </Link>
                      <form action={deleteTeamAction}>
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
