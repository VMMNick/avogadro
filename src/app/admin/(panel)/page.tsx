import Link from 'next/link'
import { countNewApplications, getAdminStats, listMatchesWithoutScore } from '@/lib/data'
import { requireAdmin } from '@/lib/auth'
import { formatDateShort } from '@/lib/format'
import { plural } from '@/lib/i18n'

export const metadata = { title: 'Огляд' }

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const [me, stats, noScore, newApplications, params] = await Promise.all([
    requireAdmin(),
    getAdminStats(),
    listMatchesWithoutScore(),
    countNewApplications(),
    searchParams,
  ])
  return (
    <>
      <div className="adm-page-head">
        <h1>Огляд</h1>
      </div>
      {params.denied && (
        <div className="adm-alert adm-alert-error" role="alert" style={{ marginBottom: 20 }}>
          Цей розділ доступний лише адміністраторам. Попросіть адміністратора змінити вашу роль.
        </div>
      )}

      {noScore.length > 0 && (
        <section className="adm-card adm-reminder" aria-labelledby="no-score-title">
          <h2 id="no-score-title">
            ⚠ {noScore.length} {plural(noScore.length, 'гра', 'гри', 'ігор')} без рахунку
          </h2>
          <p className="adm-muted">
            Гру вже зіграно — внесіть результат, щоб він з&apos;явився на сайті й у статистиці.
          </p>
          <ul className="adm-reminder-list">
            {noScore.slice(0, 10).map((m) => (
              <li key={m.id}>
                <Link href={`/admin/matches/${m.id}`}>
                  {formatDateShort(m.startsAt)} — {m.opponent}
                </Link>
              </li>
            ))}
          </ul>
          {noScore.length > 10 && <p className="adm-muted">І ще {noScore.length - 10}…</p>}
        </section>
      )}

      <div className="adm-stats">
        <Link href="/admin/players" className="adm-card adm-stat">
          <strong>{stats.players}</strong>
          <span className="adm-muted">гравців і штабу</span>
        </Link>
        <Link href="/admin/matches" className="adm-card adm-stat">
          <strong>{stats.upcoming}</strong>
          <span className="adm-muted">найближчих матчів</span>
        </Link>
        <Link href="/admin/matches" className="adm-card adm-stat">
          <strong>{stats.matches}</strong>
          <span className="adm-muted">матчів усього</span>
        </Link>
        <Link href="/admin/applications" className="adm-card adm-stat">
          <strong>{newApplications}</strong>
          <span className="adm-muted">нових заявок</span>
        </Link>
      </div>
      <section className="adm-card">
        <h2>Швидкі дії</h2>
        <div className="adm-actions">
          <Link href="/admin/players/new" className="adm-btn adm-btn-primary">
            + Гравець
          </Link>
          <Link href="/admin/matches/new" className="adm-btn adm-btn-primary">
            + Матч
          </Link>
          <Link href="/admin/matches/new?kind=friendly" className="adm-btn adm-btn-primary">
            + Товариська гра
          </Link>
          {me.role === 'admin' && (
            <Link href="/admin/settings" className="adm-btn">
              Тексти й контакти
            </Link>
          )}
        </div>
        <p className="adm-muted" style={{ marginTop: 16, fontSize: '0.9rem' }}>
          Усі зміни з&apos;являються на сайті одразу після збереження.
        </p>
      </section>
    </>
  )
}
