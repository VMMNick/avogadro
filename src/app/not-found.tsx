import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="not-found">
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/emblem-512.webp" alt="" width={140} height={140} />
        <h1 className="section-title">Сторінку не знайдено</h1>
        <Link href="/" className="btn-primary">
          На головну
        </Link>
      </div>
    </main>
  )
}
