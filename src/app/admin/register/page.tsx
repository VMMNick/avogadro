import Link from 'next/link'
import { redirect } from 'next/navigation'
import { RegisterForm } from '@/components/admin/forms'
import { getCurrentAdmin, registrationEnabled } from '@/lib/auth'

export const metadata = { title: 'Реєстрація' }

export default async function RegisterPage() {
  if (await getCurrentAdmin()) redirect('/admin')
  const enabled = registrationEnabled()
  return (
    <main className="adm-login">
      <div className="adm-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="adm-login-emblem"
          src="/images/emblem-96.png"
          srcSet="/images/emblem-96.png 1x, /images/emblem-192.png 2x"
          alt=""
          width={72}
          height={72}
        />
        <h1>Реєстрація адміністратора</h1>
        <p className="adm-muted" style={{ marginBottom: 20 }}>
          ВК «Авогадро»
        </p>
        {enabled ? (
          <RegisterForm />
        ) : (
          <p className="adm-alert adm-alert-error">
            Реєстрацію вимкнено. Попросіть діючого адміністратора додати вас у розділі «Адміністратори».
          </p>
        )}
        <p className="adm-muted adm-login-links">
          <Link href="/admin/login">← Вхід</Link>
          <Link href="/">На сайт</Link>
        </p>
      </div>
    </main>
  )
}
