import Link from 'next/link'
import { getAdminStats } from '@/lib/data'

export const metadata = { title: 'Огляд' }

export default async function DashboardPage() {
  const stats = await getAdminStats()
  return (
    <>
      <div className="adm-page-head">
        <h1>Огляд</h1>
      </div>
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
          <Link href="/admin/settings" className="adm-btn">
            Тексти й контакти
          </Link>
        </div>
        <p className="adm-muted" style={{ marginTop: 16, fontSize: '0.9rem' }}>
          Усі зміни з&apos;являються на сайті одразу після збереження.
        </p>
      </section>
    </>
  )
}
