'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

/** Остання лінія захисту: критична помилка на сторінці. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="uk">
      <body style={{ margin: 0, minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#050d22', color: '#f4f6fb', fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: 12 }}>Щось пішло не так</h1>
          <p style={{ color: '#a9b6d3', marginBottom: 20 }}>Ми вже знаємо про помилку. Спробуйте ще раз. / Something went wrong. Please try again.</p>
          <button onClick={reset} style={{ padding: '12px 28px', background: '#f2b321', color: '#050d22', border: 0, fontWeight: 700, cursor: 'pointer' }}>
            Спробувати ще раз
          </button>
        </div>
      </body>
    </html>
  )
}
