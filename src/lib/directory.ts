import type { DirectoryOption } from '@/components/admin/forms'

type Dirs = {
  teams: { id: string; name: string; city: string | null }[]
  venues: { id: string; name: string; address: string | null }[]
  tournaments: { id: string; name: string }[]
}

/** Підписи для випадаючих списків: назва + місто / адреса. */
export function toOptions({ teams, venues, tournaments }: Dirs) {
  return {
    tournaments: tournaments.map((t) => ({ id: t.id, label: t.name })) as DirectoryOption[],
    teams: <DirectoryOption[]>teams.map((t) => ({ id: t.id, label: t.city ? `${t.name} (${t.city})` : t.name })),
    venues: <DirectoryOption[]>venues.map((v) => ({ id: v.id, label: v.address ? `${v.name} — ${v.address}` : v.name })),
  }
}
