import Link from 'next/link'
import { listPlayers } from '@/lib/data'
import { ROLE_LABELS } from '@/lib/constants'
import { DeleteButton } from '@/components/admin/ui'
import { deletePlayerAction } from '../../actions'
import { Flash } from '@/components/admin/Flash'

export const metadata = { title: 'Гравці та штаб' }

export default async function PlayersPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const [players, params] = await Promise.all([listPlayers(), searchParams])
  return (
    <>
      <div className="adm-page-head">
        <h1>Гравці та штаб</h1>
        <Link href="/admin/players/new" className="adm-btn adm-btn-primary">
          + Додати
        </Link>
      </div>
      <Flash params={params} />
      <section className="adm-card">
        {players.length === 0 ? (
          <p className="adm-empty">Поки нікого немає. Додайте першого гравця.</p>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th className="adm-hide-sm">Фото</th>
                <th>№</th>
                <th>Ім&apos;я</th>
                <th className="adm-hide-sm">Амплуа</th>
                <th className="adm-actions-col" />
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.id}>
                  <td className="adm-hide-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="adm-thumb" src={p.photoUrl ?? '/default-player.svg'} alt="" />
                  </td>
                  <td>{p.number ?? '—'}</td>
                  <td>
                    <Link href={`/admin/players/${p.id}`}>{p.name}</Link>
                  </td>
                  <td className="adm-hide-sm">
                    <span className={`adm-badge${p.role === 'staff' ? '' : ' adm-badge-accent'}`}>
                      {ROLE_LABELS[p.role]}
                    </span>
                  </td>
                  <td className="adm-actions-col">
                    <div className="adm-row-actions">
                      <Link href={`/admin/players/${p.id}`} className="adm-btn adm-btn-sm">
                        Змінити
                      </Link>
                      <form action={deletePlayerAction}>
                        <input type="hidden" name="id" value={p.id} />
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
