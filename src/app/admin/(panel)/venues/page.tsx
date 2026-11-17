import Link from 'next/link'
import { listVenues } from '@/lib/data'
import { mapLinks, normalizeMapQuery } from '@/lib/maps'
import { DeleteButton } from '@/components/admin/ui'
import { deleteVenueAction } from '../../actions'
import { Flash } from '@/components/admin/Flash'

export const metadata = { title: 'Зали' }

export default async function VenuesPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const [venues, params] = await Promise.all([listVenues(), searchParams])
  return (
    <>
      <div className="adm-page-head">
        <h1>Зали</h1>
        <Link href="/admin/venues/new" className="adm-btn adm-btn-primary">
          + Зал
        </Link>
      </div>
      <Flash params={params} />
      <p className="adm-muted" style={{ marginBottom: 16 }}>
        Довідник залів. На сайті місце гри стає посиланням на карту — за полем «Місце на карті» або адресою.
      </p>
      <section className="adm-card">
        {venues.length === 0 ? (
          <p className="adm-empty">Довідник порожній. Додайте перший зал.</p>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>Назва</th>
                <th className="adm-hide-sm">Адреса</th>
                <th>Ігор</th>
                <th className="adm-actions-col" />
              </tr>
            </thead>
            <tbody>
              {venues.map((v) => {
                const q = normalizeMapQuery(v.mapQuery) ?? normalizeMapQuery(v.address)
                return (
                  <tr key={v.id}>
                    <td>
                      <Link href={`/admin/venues/${v.id}`}>{v.name}</Link>
                    </td>
                    <td className="adm-hide-sm">
                      {v.address ?? '—'}
                      {q && (
                        <>
                          {' · '}
                          <a href={mapLinks(q).open} target="_blank" rel="noopener noreferrer">
                            карта
                          </a>
                        </>
                      )}
                    </td>
                    <td>{v.matches}</td>
                    <td className="adm-actions-col">
                      <div className="adm-row-actions">
                        <Link href={`/admin/venues/${v.id}`} className="adm-btn adm-btn-sm">
                          Змінити
                        </Link>
                        <form action={deleteVenueAction}>
                          <input type="hidden" name="id" value={v.id} />
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
