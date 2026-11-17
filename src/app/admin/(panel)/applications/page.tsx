import Link from 'next/link'
import { listApplications } from '@/lib/admin-lists'
import { DeleteButton } from '@/components/admin/ui'
import { Flash } from '@/components/admin/Flash'
import { ROLE_LABELS } from '@/lib/constants'
import { deleteApplicationAction, toggleApplicationAction } from '../../actions'

export const metadata = { title: 'Заявки' }

const EXPERIENCE = { beginner: 'Новачок', amateur: 'Грає для себе', team: 'Грав(ла) у команді' } as const
const dateTime = new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Kyiv' })

export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const [all, params] = await Promise.all([listApplications(), searchParams])
  const showAll = params.show === 'all'
  const items = showAll ? all : all.filter((a) => !a.processed)
  const telegram = Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID)
  return (
    <>
      <div className="adm-page-head">
        <h1>Заявки</h1>
      </div>
      <Flash params={params} />
      <p className="adm-muted" style={{ marginBottom: 16 }}>
        Заявки з форми «Хочу до команди» на сайті.{' '}
        {telegram
          ? 'Нові заявки також приходять у Telegram.'
          : 'Щоб отримувати їх ще й у Telegram, додайте змінні TELEGRAM_BOT_TOKEN і TELEGRAM_CHAT_ID (див. README).'}{' '}
        Оброблені заявки видаляйте, коли вони вже не потрібні, — це особисті дані.
      </p>
      <nav className="adm-sort" aria-label="Фільтр заявок">
        <Link href="/admin/applications" className="adm-btn adm-btn-sm" aria-current={!showAll ? 'true' : undefined}>
          Нові ({all.filter((a) => !a.processed).length})
        </Link>
        <Link
          href="/admin/applications?show=all"
          className="adm-btn adm-btn-sm"
          aria-current={showAll ? 'true' : undefined}
        >
          Усі ({all.length})
        </Link>
      </nav>
      {items.length === 0 ? (
        <section className="adm-card">
          <p className="adm-empty">{showAll ? 'Заявок ще немає.' : 'Нових заявок немає.'}</p>
        </section>
      ) : (
        <div className="adm-applications">
          {items.map((a) => (
            <article key={a.id} className={`adm-card adm-application${a.processed ? ' is-done' : ''}`}>
              <header>
                <h2>{a.name}</h2>
                <time dateTime={a.createdAt.toISOString()} className="adm-muted">
                  {dateTime.format(a.createdAt)}
                </time>
              </header>
              <dl className="adm-dl">
                <dt>Контакт</dt>
                <dd>
                  <ContactLink value={a.contact} />
                </dd>
                <dt>Досвід</dt>
                <dd>{EXPERIENCE[a.experience]}</dd>
                {a.position && (
                  <>
                    <dt>Амплуа</dt>
                    <dd>{a.position === 'any' ? 'Будь-яке' : ROLE_LABELS[a.position]}</dd>
                  </>
                )}
                {a.message && (
                  <>
                    <dt>Повідомлення</dt>
                    <dd className="adm-pre">{a.message}</dd>
                  </>
                )}
              </dl>
              <div className="adm-actions">
                <form action={toggleApplicationAction}>
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="processed" value={a.processed ? '0' : '1'} />
                  <button type="submit" className="adm-btn adm-btn-sm">
                    {a.processed ? 'Повернути в нові' : '✓ Оброблено'}
                  </button>
                </form>
                <form action={deleteApplicationAction}>
                  <input type="hidden" name="id" value={a.id} />
                  <DeleteButton />
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}

/** Телефон, email або Telegram — одразу посиланням. */
function ContactLink({ value }: { value: string }) {
  const v = value.trim()
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return <a href={`mailto:${v}`}>{v}</a>
  if (/^@[A-Za-z0-9_]{4,}$/.test(v))
    return (
      <a href={`https://t.me/${v.slice(1)}`} target="_blank" rel="noopener noreferrer">
        {v}
      </a>
    )
  const digits = v.replace(/[^\d+]/g, '')
  if (/^\+?\d{9,15}$/.test(digits)) return <a href={`tel:${digits}`}>{v}</a>
  return <>{v}</>
}
