import { mapLinks } from '@/lib/maps'
import { getDict, type Locale } from '@/lib/i18n'

/** Міні-карта залу з переходом у Google Maps. */
export function HallMap({ query, label, locale }: { query: string; label: string | null; locale: Locale }) {
  const t = getDict(locale)
  const links = mapLinks(query)
  return (
    <div className="map-card" data-reveal>
      <div className="map-frame">
        <iframe
          src={links.embed}
          title={t.map.title(label ?? query)}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <div className="map-footer">
        <div className="map-place">
          <span className="contact-label">{t.map.hall}</span>
          <span className="map-name">{label ?? query}</span>
        </div>
        <div className="map-actions">
          <a className="btn-primary" href={links.open} target="_blank" rel="noopener noreferrer">
            {t.map.open}
          </a>
          <a className="btn-ghost" href={links.directions} target="_blank" rel="noopener noreferrer">
            {t.map.directions}
          </a>
        </div>
      </div>
    </div>
  )
}
