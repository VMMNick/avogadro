import { requireAdmin } from '@/lib/auth'
import { ChangePasswordForm } from '@/components/admin/forms'

export const metadata = { title: 'Мій акаунт' }

export default async function AccountPage() {
  const me = await requireAdmin()
  return (
    <>
      <div className="adm-page-head">
        <h1>Мій акаунт</h1>
      </div>
      <section className="adm-card">
        <dl className="adm-dl">
          <dt>Ім&apos;я</dt>
          <dd>{me.name}</dd>
          <dt>Email</dt>
          <dd>{me.email}</dd>
          <dt>Роль</dt>
          <dd>{me.role === 'admin' ? 'Адміністратор' : 'Редактор'}</dd>
        </dl>
      </section>
      <section className="adm-card">
        <h2>Змінити мій пароль</h2>
        <ChangePasswordForm />
      </section>
    </>
  )
}
