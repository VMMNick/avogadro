// Посилання на Google Maps без API-ключа (офіційний формат Maps URLs).

const COORDS_RE = /^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/
const URL_COORDS_RE = /@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/

/**
 * Нормалізує те, що адмін ввів у полі «Місце на карті»:
 * адреса / назва залу, координати «50.4501, 30.5234»
 * або повне посилання Google Maps з «@широта,довгота».
 */
export function normalizeMapQuery(raw: string | null | undefined): string | null {
  const value = raw?.trim()
  if (!value) return null

  const fromUrl = value.match(URL_COORDS_RE)
  if (fromUrl) return `${fromUrl[1]},${fromUrl[2]}`

  const coords = value.match(COORDS_RE)
  if (coords) return `${coords[1]},${coords[2]}`

  // Інші посилання (наприклад, короткі maps.app.goo.gl) вбудувати неможливо
  if (/^https?:\/\//i.test(value)) return null
  return value
}

export function mapLinks(query: string) {
  const q = encodeURIComponent(query)
  return {
    embed: `https://maps.google.com/maps?q=${q}&z=16&hl=uk&output=embed`,
    open: `https://www.google.com/maps/search/?api=1&query=${q}`,
    directions: `https://www.google.com/maps/dir/?api=1&destination=${q}`,
  }
}
