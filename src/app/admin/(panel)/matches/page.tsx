import Link from 'next/link'
import { listMatches } from '@/lib/data'
import { getDb, schema } from '@/db'
import { SearchBox } from '@/components/admin/SearchBox'
import { matchesSearch } from '@/lib/search'
import { formatDateShort } from '@/lib/format'
import { DeleteButton } from '@/components/admin/ui'
import { deleteMatchAction } from '../../actions'
import { Flash } from '@/components/admin/Flash'
import { seasonKey, seasonLabel } from '@/lib/seasons'

export const metadata = { title: 'Матчі' }

const SORTS = {
  'date-desc': { label: 'Дата: нові спочатку' },
  'date-asc': { label: 'Дата: старі спочатку' },
  'opponent-asc': { label: 'Суперник: А → Я' },
  'opponent-desc': { label: 'Суперник: Я → А' },
} as const
type Sort = keyof typeof SORTS

const byOpponent = new Intl.Collator('uk', {
  sensitivity: 'base',
  numeric: true,
})

function sortMatches<T extends { opponent: string; startsAt: Date }>(rows: T[], sort: Sort) {
  const byDate = (a: T, b: T) => a.startsAt.getTime() - b.startsAt.getTime()
  const sorted = [...rows]
  switch (sort) {
    case 'date-asc':
      return sorted.sort(byDate)
    case 'opponent-asc':
      return sorted.sort((a, b) => byOpponent.compare(a.opponent, b.opponent) || byDate(b, a))
    case 'opponent-desc':
      return sorted.sort((a, b) => byOpponent.compare(b.opponent, a.opponent) || byDate(b, a))
    default:
      return sorted.sort((a, b) => byDate(b, a))
  }
}

/** Посилання на список зі збереженням інших параметрів (сортування / сезон / пошук). */
function listHref(sort: Sort, season: string, search = '') {
  const q = new URLSearchParams()
  if (sort !== 'date-desc') q.set('sort', sort)
  if (season !== 'all') q.set('season', season)
  if (search) q.set('q', search)
  const qs = q.toString()
  return qs ? `/admin/matches?${qs}` : '/admin/matches'
}

export default async function MatchesPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const [rows, params, tournaments] = await Promise.all([
    listMatches(),
    searchParams,
    getDb().select({ id: schema.tournaments.id, name: schema.tournaments.name }).from(schema.tournaments),
  ])
  const tournamentName = new Map(tournaments.map((t) => [t.id, t.name]))
  const search = (params.q ?? '').trim().slice(0, 80)
  const sort: Sort = params.sort && params.sort in SORTS ? (params.sort as Sort) : 'date-desc'
  const withSeason = rows.map((m) => ({ ...m, season: seasonKey(m.startsAt) }))
  const seasons = [...new Set(withSeason.map((m) => m.season))].sort().reverse()
  const season = params.season && seasons.includes(params.season) ? params.season : 'all'
  const sortHref = (s: Sort) => listHref(s, season, search)
  // Пошук: суперник, зал, турнір, дата (12.11.2026), рахунок (3:1), «товариська»
  const score = /^(\d)\s*:\s*(\d)$/.exec(search)
  const found = withSeason.filter(
    (m) =>
      (season === 'all' || m.season === season) &&
      (!search ||
        // «3:1» — точний рахунок, щоб не плутати з часом гри (13:10)
        (score
          ? m.ourSets === Number(score[1]) && m.theirSets === Number(score[2])
          : matchesSearch(
              search,
              m.opponent,
              m.location,
              m.tournamentId ? tournamentName.get(m.tournamentId) : null,
              formatDateShort(m.startsAt),
              m.kind === 'friendly' ? 'товариська товариські' : 'офіційний',
            ))),
  )
  const matches = sortMatches(found, sort)
  // Клік по заголовку колонки: перший — основний порядок, повторний — зворотний
  const dateNext: Sort = sort === 'date-desc' ? 'date-asc' : 'date-desc'
  const opponentNext: Sort = sort === 'opponent-asc' ? 'opponent-desc' : 'opponent-asc'
  const arrow = (col: 'date' | 'opponent') => (sort.startsWith(col) ? (sort.endsWith('asc') ? ' ↑' : ' ↓') : '')
  return (
    <>
      <div className="adm-page-head">
        <h1>Матчі</h1>
        <div className="adm-actions">
          <Link href="/admin/matches/new" className="adm-btn adm-btn-primary">
            + Матч
          </Link>
          <Link href="/admin/matches/new?kind=friendly" className="adm-btn adm-btn-primary">
            + Товариська гра
          </Link>
        </div>
      </div>
      <Flash params={params} />
      <section className="adm-card">
        {rows.length === 0 ? (
          <p className="adm-empty">Матчів ще немає.</p>
        ) : (
          <>
            <SearchBox
              label="Пошук матчу"
              placeholder="Суперник, зал, турнір, дата (12.11.2026) або рахунок…"
              found={matches.length}
            />
            {seasons.length > 1 && (
              <nav className="adm-sort" aria-label="Сезон">
                <span className="adm-sort-label">Сезон:</span>
                {['all', ...seasons].map((s) => (
                  <Link
                    key={s}
                    href={listHref(sort, s, search)}
                    className="adm-btn adm-btn-sm"
                    aria-current={s === season ? 'true' : undefined}
                    scroll={false}
                  >
                    {s === 'all' ? 'Усі' : seasonLabel(s)}
                  </Link>
                ))}
              </nav>
            )}
            <nav className="adm-sort" aria-label="Сортування">
              <span className="adm-sort-label">Сортувати:</span>
              {(Object.keys(SORTS) as Sort[]).map((s) => (
                <Link
                  key={s}
                  href={sortHref(s)}
                  className="adm-btn adm-btn-sm"
                  aria-current={s === sort ? 'true' : undefined}
                  scroll={false}
                >
                  {SORTS[s].label}
                </Link>
              ))}
            </nav>
            {matches.length === 0 ? (
              <p className="adm-empty">
                {search ? `За запитом «${search}» нічого не знайдено.` : 'У цьому сезоні матчів немає.'}
              </p>
            ) : (
              <table className="adm-table">
                <thead>
                  <tr>
                    <th
                      aria-sort={
                        sort.startsWith('date') ? (sort.endsWith('asc') ? 'ascending' : 'descending') : undefined
                      }
                    >
                      <Link
                        href={sortHref(dateNext)}
                        className="adm-th-sort"
                        aria-current={sort.startsWith('date') ? 'true' : undefined}
                        scroll={false}
                      >
                        Дата{arrow('date')}
                      </Link>
                    </th>
                    <th
                      aria-sort={
                        sort.startsWith('opponent') ? (sort.endsWith('asc') ? 'ascending' : 'descending') : undefined
                      }
                    >
                      <Link
                        href={sortHref(opponentNext)}
                        className="adm-th-sort"
                        aria-current={sort.startsWith('opponent') ? 'true' : undefined}
                        scroll={false}
                      >
                        Суперник{arrow('opponent')}
                      </Link>
                    </th>
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
                          {m.kind === 'friendly' && <span className="adm-badge adm-badge-friendly">Товариська</span>}
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
          </>
        )}
      </section>
    </>
  )
}
