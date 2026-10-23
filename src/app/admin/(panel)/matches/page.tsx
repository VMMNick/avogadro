import Link from 'next/link'
import { listMatches } from '@/lib/data'
import { formatDateShort } from '@/lib/format'
import { DeleteButton } from '@/components/admin/ui'
import { deleteMatchAction } from '../../actions'
import { Flash } from '@/components/admin/Flash'

export const metadata = { title: 'Матчі' }

export default async function MatchesPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const [matches, params] = await Promise.all([listMatches(), searchParams])
  return (
    <>
      <div className="adm-page-head">
        <h1>Матчі</h1>
        <Link href="/admin/matches/new" className="adm-btn adm-btn-primary">
          + Додати матч
        </Link>
      </div>
      <Flash params={params} />
      <section className="adm-card">
        {matches.length === 0 ? (
          <p className="adm-empty">Матчів ще немає.</p>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Суперник</th>
                <th>Рахунок</th>
                <th className="adm-hide-sm">Зал</th>
                <th className="adm-actions-col" />
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => {
                return (
                  <tr key={m.id}>
                    <td>{formatDateShort(m.startsAt)}</td>
                    <td>
                      <Link href={`/admin/matches/${m.id}`}>{m.opponent}</Link>
                    </td>
                    <td>
                      {m.status === 'played' ? (
                        <span className="adm-badge adm-badge-accent">
                          {m.ourSets}:{m.theirSets}
                        </span>
                      ) : m.status === 'upcoming' ? (
                        <span className="adm-badge">Скоро</span>
                      ) : (
                        <span className="adm-badge" title="Гру зіграно — додайте рахунок">
                          Без рахунку
                        </span>
                      )}
                    </td>
                    <td className="adm-hide-sm">{m.location ?? '—'}</td>
                    <td className="adm-actions-col">
                      <div className="adm-row-actions">
                        <Link href={`/admin/matches/${m.id}`} className="adm-btn adm-btn-sm">
                          Змінити
                        </Link>
                        <form action={deleteMatchAction}>
                          <input type="hidden" name="id" value={m.id} />
                          <DeleteButton />
                        </form>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>
    </>
  )
}
