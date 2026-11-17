'use client'

import { useEffect } from 'react'

/**
 * Мова документа для англійських сторінок. Кореневий шаблон спільний (lang="uk"),
 * тож виправляємо атрибут ще до першого відмальовування — для програм читання з екрана й перекладачів браузера.
 * Ефект підстраховує випадки, коли вміст підставляється без виконання вбудованого скрипта (напр., сторінка 404).
 */
export function HtmlLang({ lang }: { lang: string }) {
  useEffect(() => {
    document.documentElement.lang = lang
    return () => {
      document.documentElement.lang = 'uk'
    }
  }, [lang])
  return <script dangerouslySetInnerHTML={{ __html: `document.documentElement.lang=${JSON.stringify(lang)}` }} />
}
