import type { Achievement, AchievementKind } from '@/db/schema'
import { getDict, type Locale } from '@/lib/i18n'
import { seasonLabel } from '@/lib/seasons'

const ORDER: AchievementKind[] = ['cup', 'gold', 'silver', 'bronze', 'award']

const COLORS: Record<AchievementKind, [string, string]> = {
  gold: ['#ffd666', '#c7860c'],
  cup: ['#ffd666', '#c7860c'],
  silver: ['#f1f4fa', '#8ea0c8'],
  bronze: ['#f0b27a', '#9c5a24'],
  award: ['#ffd666', '#c7860c'],
}

/** Значок нагороди: медаль зі стрічкою, кубок або зірка — у кольорах сайту. */
export function TrophyIcon({ kind, size = 64, uid }: { kind: AchievementKind; size?: number; uid: string }) {
  const [light, dark] = COLORS[kind]
  const id = `trophy-${uid}`
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false" className="trophy-icon">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
      </defs>
      {kind === 'cup' ? (
        <>
          <path d="M18 8h28v10c0 9-6 16-14 16S18 27 18 18V8Z" fill={`url(#${id})`} />
          <path d="M18 12H10c0 8 4 12 9 13M46 12h8c0 8-4 12-9 13" fill="none" stroke={dark} strokeWidth="3" />
          <path d="M28 34h8v8h-8z" fill={dark} />
          <path d="M20 46h24l2 8H18z" fill={`url(#${id})`} />
          <circle cx="32" cy="19" r="5" fill="#081430" opacity="0.35" />
        </>
      ) : kind === 'award' ? (
        <path
          d="m32 6 7.6 15.4 17 2.5-12.3 12 2.9 16.9L32 44.8 16.8 52.8l2.9-16.9-12.3-12 17-2.5L32 6Z"
          fill={`url(#${id})`}
          stroke={dark}
          strokeWidth="1.5"
        />
      ) : (
        <>
          <path d="M20 4h10l6 18h-10z" fill="#1d3770" />
          <path d="M44 4H34l-6 18h10z" fill="#13285a" />
          <path d="M22 4h6M36 4h6" stroke="#f2b321" strokeWidth="2" />
          <circle cx="32" cy="40" r="18" fill={`url(#${id})`} stroke={dark} strokeWidth="2" />
          <circle cx="32" cy="40" r="12" fill="none" stroke={dark} strokeWidth="1.5" opacity="0.6" />
          <text
            x="32"
            y="46"
            textAnchor="middle"
            fontSize="16"
            fontWeight="700"
            fill="#081430"
            fontFamily="system-ui, sans-serif"
          >
            {kind === 'gold' ? 1 : kind === 'silver' ? 2 : 3}
          </text>
        </>
      )}
    </svg>
  )
}

export function TrophiesSection({ achievements, locale }: { achievements: Achievement[]; locale: Locale }) {
  const t = getDict(locale)
  const bySeason = new Map<string, Achievement[]>()
  for (const a of achievements) bySeason.set(a.season, [...(bySeason.get(a.season) ?? []), a])
  const seasons = [...bySeason.keys()].sort().reverse()
  return (
    <div className="trophy-shelf">
      {seasons.map((season) => (
        <section key={season} className="trophy-season" data-reveal aria-labelledby={`trophy-${season}`}>
          <h3 className="subsection-title" id={`trophy-${season}`}>
            {t.trophies.season(seasonLabel(season))}
          </h3>
          <ul className="trophy-list" data-reveal="stagger">
            {bySeason
              .get(season)!
              .sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind))
              .map((a) => (
                <li key={a.id} className={`trophy-card is-${a.kind}`}>
                  <TrophyIcon kind={a.kind} uid={a.id} />
                  <div>
                    <span className="trophy-kind">{t.trophies.kinds[a.kind]}</span>
                    <strong className="trophy-title">{(locale === 'en' && a.titleEn) || a.title}</strong>
                    {a.note && locale === 'uk' && <span className="trophy-note">{a.note}</span>}
                  </div>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
