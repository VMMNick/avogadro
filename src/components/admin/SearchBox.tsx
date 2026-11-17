'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'

/**
 * Пошук у списку: фільтрує одразу під час введення (через ?q= в адресі),
 * а без JavaScript працює як звичайна форма.
 */
export function SearchBox({ placeholder, label, found }: { placeholder: string; label: string; found?: number }) {
  const router = useRouter()
  const params = useSearchParams()
  const [value, setValue] = useState(params.get('q') ?? '')
  const [pending, startTransition] = useTransition()
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const apply = (q: string) => {
    // Інші параметри (сортування, сезон) зберігаємо; повідомлення «Збережено» прибираємо
    const next = new URLSearchParams(params)
    next.delete('saved')
    next.delete('deleted')
    if (q.trim()) next.set('q', q.trim())
    else next.delete('q')
    startTransition(() => router.replace(next.size ? `?${next}` : '?', { scroll: false }))
  }

  return (
    <form
      role="search"
      className="adm-search"
      onSubmit={(e) => {
        e.preventDefault()
        clearTimeout(timer.current)
        apply(value)
      }}
    >
      <label className="sr-only" htmlFor="q">
        {label}
      </label>
      <input
        id="q"
        name="q"
        type="search"
        className="adm-input"
        placeholder={placeholder}
        autoComplete="off"
        value={value}
        onChange={(e) => {
          const q = e.target.value
          setValue(q)
          clearTimeout(timer.current)
          timer.current = setTimeout(() => apply(q), 250)
        }}
      />
      {value && (
        <button
          type="button"
          className="adm-btn adm-btn-sm"
          onClick={() => {
            setValue('')
            apply('')
          }}
        >
          Очистити
        </button>
      )}
      <span className="adm-hint" aria-live="polite">
        {pending ? 'Шукаю…' : found !== undefined && params.get('q') ? `Знайдено: ${found}` : ''}
      </span>
    </form>
  )
}
