'use client'

import { useActionState, useState } from 'react'
import { saveStandingsAction } from '@/app/admin/actions'
import type { StandingRow } from '@/db/schema'
import type { FormState } from '@/lib/validation'
import { FormMessage, SubmitButton } from './ui'

type Row = Omit<StandingRow, 'played' | 'wins' | 'losses' | 'setsFor' | 'setsAgainst' | 'points'> & {
  played: string
  wins: string
  losses: string
  setsFor: string
  setsAgainst: string
  points: string
  key: number
}

const NUMS = [
  ['played', 'Ігор'],
  ['wins', 'Перемог'],
  ['losses', 'Поразок'],
  ['setsFor', 'Сети +'],
  ['setsAgainst', 'Сети −'],
  ['points', 'Очки'],
] as const

let nextKey = 1
const toRow = (r: StandingRow): Row => ({
  ...r,
  played: String(r.played),
  wins: String(r.wins),
  losses: String(r.losses),
  setsFor: String(r.setsFor),
  setsAgainst: String(r.setsAgainst),
  points: String(r.points),
  key: nextKey++,
})
const emptyRow = (): Row => toRow({ teamId: null, us: false, name: '', played: 0, wins: 0, losses: 0, setsFor: 0, setsAgainst: 0, points: 0 })

export function StandingsEditor({
  tournamentId,
  initial,
  teams,
  clubName,
  ours,
}: {
  tournamentId: string
  initial: StandingRow[]
  teams: { id: string; name: string }[]
  clubName: string
  /** Наш рядок, порахований з результатів цього турніру */
  ours: Omit<StandingRow, 'teamId' | 'us' | 'name'> | null
}) {
  const [state, action] = useActionState<FormState, FormData>(saveStandingsAction, {})
  const [rows, setRows] = useState<Row[]>(() => initial.map(toRow))

  const update = (key: number, patch: Partial<Row>) => setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  const remove = (key: number) => setRows((prev) => prev.filter((r) => r.key !== key))
  const move = (key: number, dir: -1 | 1) =>
    setRows((prev) => {
      const i = prev.findIndex((r) => r.key === key)
      const j = i + dir
      if (j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })

  const choose = (key: number, value: string) => {
    if (value === 'us') update(key, { us: true, teamId: null, name: clubName })
    else if (value === 'other') update(key, { us: false, teamId: null, name: '' })
    else update(key, { us: false, teamId: value, name: teams.find((t) => t.id === value)?.name ?? '' })
  }

  const fillOurs = () => {
    if (!ours) return
    const values = {
      played: String(ours.played),
      wins: String(ours.wins),
      losses: String(ours.losses),
      setsFor: String(ours.setsFor),
      setsAgainst: String(ours.setsAgainst),
      points: String(ours.points),
    }
    setRows((prev) => {
      const existing = prev.find((r) => r.us)
      if (existing) return prev.map((r) => (r.us ? { ...r, ...values } : r))
      return [...prev, { ...emptyRow(), us: true, name: clubName, ...values }]
    })
  }

  const payload = JSON.stringify(
    rows.map((r) => ({
      teamId: r.teamId,
      us: r.us,
      name: r.name.trim(),
      ...Object.fromEntries(NUMS.map(([k]) => [k, r[k] === '' ? 0 : Number(r[k])])),
    })),
  )

  return (
    <form action={action} className="adm-form adm-card">
      <h2>Турнірна таблиця</h2>
      <p className="adm-hint">
        Внесіть команди турніру й показники з офіційної таблиці. На сайті таблиця сортується за очками, потім за перемогами й
        співвідношенням сетів. Порожня таблиця на сайті не показується.
      </p>
      <FormMessage state={state} />
      <input type="hidden" name="id" value={tournamentId} />
      <input type="hidden" name="standings" value={payload} />

      {rows.length > 0 && (
        <div className="adm-standings">
          {rows.map((r, i) => (
            <fieldset key={r.key} className="adm-standings-row">
              <legend className="sr-only">Рядок {i + 1}</legend>
              <div className="adm-standings-team">
                <select
                  className="adm-select"
                  aria-label={`Рядок ${i + 1}: команда`}
                  value={r.us ? 'us' : (r.teamId ?? 'other')}
                  onChange={(e) => choose(r.key, e.target.value)}
                >
                  <option value="us">★ {clubName} (ми)</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                  <option value="other">Інша команда (ввести назву)</option>
                </select>
                {!r.us && !r.teamId && (
                  <input
                    className="adm-input"
                    aria-label={`Рядок ${i + 1}: назва команди`}
                    placeholder="Назва команди"
                    maxLength={80}
                    value={r.name}
                    onChange={(e) => update(r.key, { name: e.target.value })}
                  />
                )}
              </div>
              <div className="adm-standings-nums">
                {NUMS.map(([k, label]) => (
                  <label key={k}>
                    <span>{label}</span>
                    <input
                      className="adm-input"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={999}
                      value={r[k]}
                      aria-label={`Рядок ${i + 1}: ${label}`}
                      onChange={(e) => update(r.key, { [k]: e.target.value } as Partial<Row>)}
                    />
                  </label>
                ))}
              </div>
              <div className="adm-standings-tools">
                <button type="button" className="adm-btn adm-btn-sm" onClick={() => move(r.key, -1)} disabled={i === 0} aria-label={`Рядок ${i + 1}: вище`}>
                  ↑
                </button>
                <button
                  type="button"
                  className="adm-btn adm-btn-sm"
                  onClick={() => move(r.key, 1)}
                  disabled={i === rows.length - 1}
                  aria-label={`Рядок ${i + 1}: нижче`}
                >
                  ↓
                </button>
                <button type="button" className="adm-btn adm-btn-sm adm-btn-danger" onClick={() => remove(r.key)} aria-label={`Рядок ${i + 1}: видалити`}>
                  ✕
                </button>
              </div>
            </fieldset>
          ))}
        </div>
      )}

      <div className="adm-actions">
        <button type="button" className="adm-btn" onClick={() => setRows((prev) => [...prev, emptyRow()])}>
          + Команда
        </button>
        {ours && (
          <button type="button" className="adm-btn" onClick={fillOurs} title="Ігри, перемоги, сети й очки (3/2/1/0) з внесених результатів">
            Заповнити «{clubName}» з наших результатів
          </button>
        )}
        <SubmitButton pendingText="Зберігаю…">Зберегти таблицю</SubmitButton>
      </div>
    </form>
  )
}
