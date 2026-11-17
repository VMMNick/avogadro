'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { PublicMatch } from '@/lib/public-types'

type Store = {
  matches: PublicMatch[]
  /** Усі сезони, включно з архівними, від нових до старих */
  seasons: string[]
  archiveState: 'none' | 'idle' | 'loading' | 'loaded' | 'error'
  /** Довантажити старі сезони (один раз) */
  ensureArchive: () => void
}

const Ctx = createContext<Store | null>(null)

/**
 * Матчі для блоків «Матчі» та «Статистика». Сторінка одразу отримує лише поточний і минулий сезон,
 * а архів довантажується, коли його справді вибирають, — головна не «важчає» з роками.
 */
export function MatchesProvider({
  initial,
  seasons,
  hasArchive,
  children,
}: {
  initial: PublicMatch[]
  seasons: string[]
  hasArchive: boolean
  children: React.ReactNode
}) {
  const [matches, setMatches] = useState(initial)
  const [archiveState, setArchiveState] = useState<Store['archiveState']>(hasArchive ? 'idle' : 'none')
  const started = useRef(false)

  const ensureArchive = useCallback(() => {
    if (!hasArchive || started.current) return
    started.current = true
    setArchiveState('loading')
    fetch('/api/matches/archive')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { matches: PublicMatch[] }) => {
        setMatches((prev) => {
          const known = new Set(prev.map((m) => m.id))
          return [...prev, ...data.matches.filter((m) => !known.has(m.id))]
        })
        setArchiveState('loaded')
      })
      .catch(() => {
        started.current = false
        setArchiveState('error')
      })
  }, [hasArchive])

  const value = useMemo(
    () => ({ matches, seasons, archiveState, ensureArchive }),
    [matches, seasons, archiveState, ensureArchive],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useMatches() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useMatches: немає MatchesProvider')
  return ctx
}
