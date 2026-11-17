import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { countNewApplications } from '@/lib/data'
import { AdminNav } from '@/components/admin/AdminNav'
import { logoutAction } from '../actions'

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin()
  const newApplications = await countNewApplications()
  return (
    <div className="adm">
      <aside className="adm-sidebar">
        <Link href="/admin" className="adm-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/emblem-96.png"
            srcSet="/images/emblem-96.png 1x, /images/emblem-192.png 2x"
            alt=""
            width={36}
            height={36}
          />
          АВОГАДРО
        </Link>
        <AdminNav role={admin.role} newApplications={newApplications} />
        <div className="adm-sidebar-footer">
          <span title={admin.email}>
            {admin.name}
            <span className="adm-role">{admin.role === 'admin' ? 'Адміністратор' : 'Редактор'}</span>
          </span>
          <a href="/" target="_blank" rel="noopener">
            Відкрити сайт ↗
          </a>
          <form action={logoutAction}>
            <button type="submit" className="adm-link-btn">
              Вийти
            </button>
          </form>
        </div>
      </aside>
      <main className="adm-main">{children}</main>
    </div>
  )
}
