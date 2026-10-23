import { mapLinks } from '@/lib/maps'

/** Міні-карта залу з переходом у Google Maps. */
export function HallMap({ query, label }: { query: string; label: string | null }) {
  const links = mapLinks(query)
  return (
    <div className="map-card">
      <div className="map-frame">
        <iframe
          src={links.embed}
          title={`Карта: ${label ?? query}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <div className="map-footer">
        <div className="map-place">
          <span className="contact-label">Зал команди</span>
          <span className="map-name">{label ?? query}</span>
        </div>
        <div className="map-actions">
          <a className="btn-primary" href={links.open} target="_blank" rel="noopener noreferrer">
            Відкрити в Google Maps
          </a>
          <a className="btn-ghost" href={links.directions} target="_blank" rel="noopener noreferrer">
            Прокласти маршрут
          </a>
        </div>
      </div>
    </div>
  )
}
