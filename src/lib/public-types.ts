import type { MatchKind } from '@/db/schema'

/** Дані матчу, які отримує браузер (без службових полів). */
export type PublicMatch = {
  id: string
  opponent: string
  /** Ключ суперника для «особистих зустрічей»: id з довідника або назва */
  opponentKey: string
  startsAt: string // ISO
  location: string | null
  /** Що шукати на карті: дані залу з довідника або сама назва */
  mapQuery: string | null
  ourSets: number | null
  theirSets: number | null
  kind: MatchKind
  tournamentId: string | null
  tournament: string | null
  season: string // «2025-26»
  isPast: boolean
}

export const hasScore = (m: Pick<PublicMatch, 'ourSets' | 'theirSets'>) => m.ourSets !== null && m.theirSets !== null
export const isWin = (m: Pick<PublicMatch, 'ourSets' | 'theirSets'>) => hasScore(m) && m.ourSets! > m.theirSets!
