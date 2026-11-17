'use client'

import { useState } from 'react'

/** «Поділитися»: системне меню на телефоні, копіювання посилання на комп'ютері. */
export function ShareButton({ url, title, label, copiedLabel }: { url: string; title: string; label: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className="btn-ghost"
      onClick={async () => {
        if (navigator.share) {
          try {
            await navigator.share({ title, url })
            return
          } catch {
            // Користувач закрив меню — нічого не робимо
            return
          }
        }
        try {
          await navigator.clipboard.writeText(url)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } catch {
          window.prompt(label, url)
        }
      }}
    >
      {copied ? `✓ ${copiedLabel}` : `↗ ${label}`}
    </button>
  )
}
