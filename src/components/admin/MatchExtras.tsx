'use client'

import { useMemo, useState } from 'react'

const MAX_SETS = 5

/** Загальний рахунок + очки кожного сету. Якщо сети заповнені, загальний рахунок рахується сам. */
export function ScoreInputs({
  initialOur,
  initialTheir,
  initialSets,
  totalError,
  setsError,
}: {
  initialOur: string
  initialTheir: string
  initialSets: [string, string][]
  totalError?: string
  setsError?: string
}) {
  const [sets, setSets] = useState<[string, string][]>(() =>
    Array.from({ length: MAX_SETS }, (_, i) => initialSets[i] ?? ['', '']),
  )
  const filledCount = useMemo(() => {
    let n = 0
    sets.forEach(([a, b], i) => {
      if (a !== '' || b !== '') n = i + 1
    })
    return n
  }, [sets])
  const [shown, setShown] = useState(Math.max(3, filledCount))
  const fromSets = useMemo(() => {
    const done = sets.filter(([a, b]) => a !== '' && b !== '' && a !== b)
    if (!done.length) return null
    return {
      our: done.filter(([a, b]) => Number(a) > Number(b)).length,
      their: done.filter(([a, b]) => Number(a) < Number(b)).length,
    }
  }, [sets])

  const update = (i: number, side: 0 | 1, value: string) =>
    setSets((prev) => prev.map((row, j) => (j === i ? (side === 0 ? [value, row[1]] : [row[0], value]) : row)) as [string, string][])

  return (
    <>
      <div className="adm-field is-wide">
        <span className="adm-label" id="total-label">
          Рахунок за сетами (після гри)
        </span>
        <div className="adm-score" role="group" aria-labelledby="total-label">
          {fromSets ? (
            <>
              <output className="adm-input adm-score-auto" aria-label="Сети Авогадро">
                {fromSets.our}
              </output>
              <span>:</span>
              <output className="adm-input adm-score-auto" aria-label="Сети суперника">
                {fromSets.their}
              </output>
            </>
          ) : (
            <>
              <input
                className="adm-input"
                type="number"
                min={0}
                max={3}
                name="ourSets"
                aria-label="Сети Авогадро"
                placeholder="Авогадро"
                defaultValue={initialOur}
                aria-invalid={totalError ? true : undefined}
              />
              <span>:</span>
              <input
                className="adm-input"
                type="number"
                min={0}
                max={3}
                name="theirSets"
                aria-label="Сети суперника"
                placeholder="Суперник"
                defaultValue={initialTheir}
                aria-invalid={totalError ? true : undefined}
              />
            </>
          )}
        </div>
        {totalError ? (
          <span className="adm-error" role="alert">
            {totalError}
          </span>
        ) : (
          <span className="adm-hint">
            {fromSets
              ? 'Підраховано з очок сетів нижче.'
              : 'Залиште порожнім, поки гру не зіграно. Спершу — сети «Авогадро». Або заповніть очки сетів — рахунок підрахується сам.'}
          </span>
        )}
      </div>

      <fieldset className="adm-field is-wide adm-sets">
        <legend className="adm-label">Очки по сетах (необов&apos;язково)</legend>
        <div className="adm-sets-grid">
          {sets.slice(0, shown).map(([a, b], i) => (
            <div key={i} className="adm-set-row">
              <span className="adm-set-no">Сет {i + 1}</span>
              <input
                className="adm-input"
                type="number"
                inputMode="numeric"
                min={0}
                max={99}
                name={`set${i + 1}our`}
                aria-label={`Сет ${i + 1}: очки Авогадро`}
                placeholder="Ми"
                value={a}
                onChange={(e) => update(i, 0, e.target.value)}
                aria-invalid={setsError ? true : undefined}
              />
              <span aria-hidden="true">:</span>
              <input
                className="adm-input"
                type="number"
                inputMode="numeric"
                min={0}
                max={99}
                name={`set${i + 1}their`}
                aria-label={`Сет ${i + 1}: очки суперника`}
                placeholder="Вони"
                value={b}
                onChange={(e) => update(i, 1, e.target.value)}
                aria-invalid={setsError ? true : undefined}
              />
            </div>
          ))}
        </div>
        {shown < MAX_SETS && (
          <button type="button" className="adm-btn adm-btn-sm" onClick={() => setShown((n) => n + 1)}>
            + Сет {shown + 1}
          </button>
        )}
        {setsError && (
          <span className="adm-error" role="alert">
            {setsError}
          </span>
        )}
      </fieldset>
    </>
  )
}

export type LineupPlayer = { id: string; name: string; number: number | null; staff: boolean }

/** Хто грав у матчі та MVP. */
export function LineupPicker({
  players,
  initialLineup,
  initialMvp,
}: {
  players: LineupPlayer[]
  initialLineup: string[]
  initialMvp: string
}) {
  const [selected, setSelected] = useState(() => new Set(initialLineup))
  const [mvp, setMvp] = useState(initialMvp)
  const squad = players.filter((p) => !p.staff)
  const label = (p: LineupPlayer) => (p.number !== null ? `#${p.number} ${p.name}` : p.name)

  if (!players.length) {
    return (
      <div className="adm-field is-wide">
        <span className="adm-label">Склад на гру і MVP</span>
        <span className="adm-hint">Спершу додайте гравців у розділі «Гравці та штаб».</span>
      </div>
    )
  }

  const toggle = (id: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })

  return (
    <>
      <fieldset className="adm-field is-wide adm-lineup">
        <legend className="adm-label">Хто грав (необов&apos;язково)</legend>
        <div className="adm-lineup-actions">
          <button type="button" className="adm-btn adm-btn-sm" onClick={() => setSelected(new Set(squad.map((p) => p.id)))}>
            Усі гравці
          </button>
          <button type="button" className="adm-btn adm-btn-sm" onClick={() => setSelected(new Set())}>
            Очистити
          </button>
          <span className="adm-hint" aria-live="polite">
            Обрано: {selected.size}
          </span>
        </div>
        <div className="adm-lineup-grid">
          {squad.map((p) => (
            <label key={p.id} className="adm-check">
              <input
                type="checkbox"
                name="lineup"
                value={p.id}
                checked={selected.has(p.id)}
                onChange={(e) => toggle(p.id, e.target.checked)}
              />
              {label(p)}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="adm-field is-wide">
        <label className="adm-label" htmlFor="mvpPlayerId">
          MVP матчу (найкращий гравець)
        </label>
        <select
          id="mvpPlayerId"
          name="mvpPlayerId"
          className="adm-select"
          value={mvp}
          onChange={(e) => {
            setMvp(e.target.value)
            if (e.target.value && selected.size) toggle(e.target.value, true)
          }}
        >
          <option value="">— Не обрано —</option>
          {squad.map((p) => (
            <option key={p.id} value={p.id}>
              {label(p)}
            </option>
          ))}
        </select>
      </div>
    </>
  )
}
