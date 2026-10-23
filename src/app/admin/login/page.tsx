import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/admin/forms'
import { getCurrentAdmin } from '@/lib/auth'

export const metadata = { title: 'Вхід' }

export default async function LoginPage() {
  if (await getCurrentAdmin()) redirect('/admin')
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
        <h1>Вхід в адмін-панель</h1>
        <p className="adm-muted" style={{ marginBottom: 20 }}>
          ВК «Авогадро»
        </p>
        <LoginForm />
        <p className="adm-muted" style={{ marginTop: 18, fontSize: '0.85rem' }}>
          <Link href="/">← На сайт</Link>
        </p>
      </div>
    </main>
  )
}
