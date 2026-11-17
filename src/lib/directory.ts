import type { DirectoryOption } from '@/components/admin/forms'

type Dirs = {
  teams: { id: string; name: string; city: string | null }[]
  venues: { id: string; name: string; address: string | null }[]
}

/** Підписи для випадаючих списків: назва + місто / адреса. */
export function toOptions({ teams, venues }: Dirs): { teams: DirectoryOption[]; venues: DirectoryOption[] } {
  return {
    teams: teams.map((t) => ({ id: t.id, label: t.city ? `${t.name} (${t.city})` : t.name })),
    venues: venues.map((v) => ({ id: v.id, label: v.address ? `${v.name} — ${v.address}` : v.name })),
  }
}
