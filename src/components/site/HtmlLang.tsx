/**
 * Мова документа для англійських сторінок. Кореневий шаблон спільний (lang="uk"),
 * тож виправляємо атрибут ще до першого відмальовування — для програм читання з екрана й перекладачів браузера.
 */
export function HtmlLang({ lang }: { lang: string }) {
  return <script dangerouslySetInnerHTML={{ __html: `document.documentElement.lang=${JSON.stringify(lang)}` }} />
}
