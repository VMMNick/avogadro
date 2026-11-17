'use client'

import { useState } from 'react'
import { getDict, type Locale } from '@/lib/i18n'

export type PublicStandings = {
  id: string
  name: string
  updatedAt: string | null
  rows: {
    key: string
    name: string
    us: boolean
    logo: string | null
    played: number
    wins: number
    losses: number
    setsFor: number
    setsAgainst: number
    points: number
  }[]
}

export function StandingsSection({ tables, locale }: { tables: PublicStandings[]; locale: Locale }) {
  const t = getDict(locale)
  const [selected, setSelected] = useState(tables[0]?.id ?? '')
  const table = tables.find((x) => x.id === selected) ?? tables[0]
  if (!table) return null
  const updated = table.updatedAt
    ? new Intl.DateTimeFormat(t.intl, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Kyiv' }).format(
        new Date(table.updatedAt),
      )
    : null

  return (
    <>
      {tables.length > 1 && (
        <div className="match-filters" data-reveal>
          <label className="select-pill">
            <span>{t.standings.pick}</span>
            <select value={table.id} onChange={(e) => setSelected(e.target.value)}>
              {tables.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      <div className="standings-card" data-reveal>
        <div className="table-scroll" tabIndex={0} role="region" aria-label={t.standings.caption(table.name)}>
          <table className="standings-table">
            <caption>
              <strong>{table.name}</strong>
              {updated && <> · {t.standings.updated(updated)}</>}
            </caption>
            <thead>
              <tr>
                <th scope="col">{t.standings.pos}</th>
                <th scope="col" className="col-team">
                  {t.standings.team}
                </th>
                <th scope="col">
                  <abbr title={t.standings.playedFull}>{t.standings.played}</abbr>
                </th>
                <th scope="col">
                  <abbr title={t.standings.winsFull}>{t.standings.wins}</abbr>
                </th>
                <th scope="col">
                  <abbr title={t.standings.lossesFull}>{t.standings.losses}</abbr>
                </th>
                <th scope="col">{t.standings.sets}</th>
                <th scope="col">
                  <abbr title={t.standings.pointsFull}>{t.standings.points}</abbr>
                </th>
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r, i) => (
                <tr key={r.key} className={r.us ? 'is-us' : undefined} aria-current={r.us ? 'true' : undefined}>
                  <td>{i + 1}</td>
                  <td className="col-team">
                    <span className="team-cell">
                      {r.us ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className="team-logo" src="/images/emblem-96.png" alt="" width={28} height={28} />
                      ) : r.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className="team-logo" src={r.logo} alt="" width={28} height={28} loading="lazy" />
                      ) : null}
                      {r.name}
                    </span>
                  </td>
                  <td>{r.played}</td>
                  <td>{r.wins}</td>
                  <td>{r.losses}</td>
                  <td>
                    {r.setsFor}:{r.setsAgainst}
                  </td>
                  <td className="col-points">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
