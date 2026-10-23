import { asc } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import { requireAdmin } from '@/lib/auth'
import { ChangePasswordForm, NewAdminForm } from '@/components/admin/forms'
import { DeleteButton } from '@/components/admin/ui'
import { deleteAdminAction } from '../../actions'

export const metadata = { title: 'Адміністратори' }

export default async function AdminsPage() {
  const me = await requireAdmin()
  const admins = await getDb()
    .select({ id: schema.admins.id, name: schema.admins.name, email: schema.admins.email })
    .from(schema.admins)
    .orderBy(asc(schema.admins.createdAt))

  return (
    <>
      <div className="adm-page-head">
        <h1>Адміністратори</h1>
      </div>

      <section className="adm-card">
        <h2>Хто має доступ</h2>
        <table className="adm-table">
          <tbody>
            {admins.map((a) => (
              <tr key={a.id}>
                <td>
                  {a.name} {a.id === me.id && <span className="adm-badge">це ви</span>}
                </td>
                <td className="adm-muted">{a.email}</td>
                <td>
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

      <section className="adm-card">
        <h2>Змінити мій пароль</h2>
        <ChangePasswordForm />
      </section>
    </>
  )
}
