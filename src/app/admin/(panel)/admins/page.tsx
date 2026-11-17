import { asc } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import { requireAdmin } from '@/lib/auth'
import { NewAdminForm } from '@/components/admin/forms'
import { DeleteButton } from '@/components/admin/ui'
import { Flash } from '@/components/admin/Flash'
import { deleteAdminAction, setAdminRoleAction } from '../../actions'

export const metadata = { title: 'Адміністратори' }

const ROLE_LABEL = { admin: 'Адміністратор', editor: 'Редактор' } as const

export default async function AdminsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const me = await requireAdmin({ role: 'admin' })
  const [admins, params] = await Promise.all([
    getDb()
      .select({ id: schema.admins.id, name: schema.admins.name, email: schema.admins.email, role: schema.admins.role })
      .from(schema.admins)
      .orderBy(asc(schema.admins.createdAt)),
    searchParams,
  ])

  return (
    <>
      <div className="adm-page-head">
        <h1>Адміністратори</h1>
      </div>
      <Flash params={params} />

      <section className="adm-card">
        <h2>Хто має доступ</h2>
        <p className="adm-hint" style={{ marginBottom: 12 }}>
          <strong>Адміністратор</strong> — усе. <strong>Редактор</strong> — матчі, гравці, довідники, досягнення,
          тренування й заявки, але без налаштувань сайту й керування доступом.
        </p>
        <table className="adm-table">
          <thead>
            <tr>
              <th>Ім&apos;я</th>
              <th className="adm-hide-sm">Email</th>
              <th>Роль</th>
              <th className="adm-actions-col" />
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id}>
                <td>
                  {a.name} {a.id === me.id && <span className="adm-badge">це ви</span>}
                </td>
                <td className="adm-muted adm-hide-sm">{a.email}</td>
                <td>
                  {a.id === me.id ? (
                    ROLE_LABEL[a.role]
                  ) : (
                    <form action={setAdminRoleAction} className="adm-inline-form">
                      <input type="hidden" name="id" value={a.id} />
                      <select
                        name="role"
                        defaultValue={a.role}
                        className="adm-select adm-select-sm"
                        aria-label={`Роль: ${a.name}`}
                      >
                        <option value="admin">{ROLE_LABEL.admin}</option>
                        <option value="editor">{ROLE_LABEL.editor}</option>
                      </select>
                      <button type="submit" className="adm-btn adm-btn-sm">
                        Змінити
                      </button>
                    </form>
                  )}
                </td>
                <td className="adm-actions-col">
                  {a.id !== me.id && (
                    <div className="adm-row-actions">
                      <form action={deleteAdminAction}>
                        <input type="hidden" name="id" value={a.id} />
                        <DeleteButton label="Забрати доступ" />
                      </form>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="adm-card">
        <h2>Додати адміністратора</h2>
        <NewAdminForm />
      </section>

      <p className="adm-muted">
        Змінити свій пароль можна в розділі <a href="/admin/account">«Мій акаунт»</a>.
      </p>
    </>
  )
}
