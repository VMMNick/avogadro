'use client'

import { useEffect, useState } from 'react'
import { getDict, type Locale } from '@/lib/i18n'

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

/** Реєструє офлайн-режим, показує «Встановити застосунок» і повідомлення, коли немає мережі. */
export function PwaClient({ locale }: { locale: Locale }) {
  const t = getDict(locale)
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null)
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined)
    }
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setPrompt(e as InstallPrompt)
    }
    const onInstalled = () => setPrompt(null)
    const sync = () => setOffline(!navigator.onLine)
    sync()
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    window.addEventListener('online', sync)
    window.addEventListener('offline', sync)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
      window.removeEventListener('online', sync)
      window.removeEventListener('offline', sync)
    }
  }, [])

  return (
    <>
      {prompt && (
        <button
          type="button"
          className="btn-ghost install-btn"
          onClick={async () => {
            await prompt.prompt()
            await prompt.userChoice.catch(() => undefined)
            setPrompt(null)
          }}
        >
          📲 {t.install.button}
        </button>
      )}
      {offline && (
        <p className="offline-banner" role="status">
          {t.install.offline}
        </p>
      )}
    </>
  )
}
