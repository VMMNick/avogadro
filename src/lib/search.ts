/** Нормалізація для пошуку: без регістру, апострофів і зайвих пробілів; «ґ» = «г», «ё» = «е». */
export function normalizeSearch(s: string) {
  return s
    .toLocaleLowerCase('uk')
    .replace(/[’'`ʼ"«»]/g, '')
    .replace(/ґ/g, 'г')
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Чи підходить запис під запит: кожне слово запиту має знайтися в одному з полів. */
export function matchesSearch(query: string, ...fields: (string | null | undefined)[]) {
  const words = normalizeSearch(query).split(' ').filter(Boolean)
  if (!words.length) return true
  const haystack = normalizeSearch(fields.filter(Boolean).join(' '))
  return words.every((w) => haystack.includes(w))
}
