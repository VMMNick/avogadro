import 'server-only'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import { getMatchDetail } from './data'
import { formatMatchDate, getDict, type Locale } from './i18n'

export const OG_SIZE = { width: 1200, height: 630 }

const asset = (name: string) => readFile(path.join(process.cwd(), 'assets', 'og', name))

/** Картинка для поширення матчу в месенджерах і соцмережах. */
export async function matchOgImage(id: string, locale: Locale) {
  const t = getDict(locale)
  const [cyr, lat, emblem] = await Promise.all([
    asset('russo-one-cyrillic.woff'),
    asset('russo-one-latin.woff'),
    asset('emblem.png'),
  ])
  const data = /^[0-9a-f-]{36}$/i.test(id) ? await getMatchDetail(id).catch(() => null) : null
  const m = data?.match
  const scored = m && m.ourSets !== null && m.theirSets !== null
  const won = scored && m.ourSets! > m.theirSets!
  const emblemSrc = `data:image/png;base64,${emblem.toString('base64')}`
  const logoSrc = await teamLogo(data?.team?.logoUrl)
  const sub = m ? [formatMatchDate(m.startsAt, locale), m.location].filter(Boolean).join(' · ') : t.siteDescription
  const badge = m
    ? [m.kind === 'friendly' ? t.matches.friendlyBadge : null, data?.tournament?.name].filter(Boolean).join(' · ')
    : ''

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '56px 64px',
        background: 'linear-gradient(135deg, #050d22 0%, #0d1f4d 60%, #13285a 100%)',
        color: '#ffffff',
        // Шрифт розбито на дві частини (латиниця і кирилиця) — підключаємо обидві
        fontFamily: 'Russo Latin, Russo Cyrillic',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', fontSize: 30, color: '#f2b321', letterSpacing: 2 }}>
          {t.clubFull.toUpperCase()}
        </div>
        {badge ? (
          <div
            style={{
              display: 'flex',
              fontSize: 24,
              padding: '8px 20px',
              borderRadius: 999,
              border: '2px solid #f2b321',
              color: '#f2b321',
            }}
          >
            {badge}
          </div>
        ) : null}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 360 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={emblemSrc} width={200} height={200} alt="" />
          <div style={{ display: 'flex', fontSize: 44, marginTop: 16 }}>{t.clubName}</div>
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: scored ? 120 : 84,
            color: scored ? (won ? '#4ade80' : '#f87171') : '#f2b321',
          }}
        >
          {scored ? `${m.ourSets}:${m.theirSets}` : 'VS'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 360 }}>
          {logoSrc ? (
            <div
              style={{
                display: 'flex',
                width: 200,
                height: 200,
                borderRadius: 32,
                background: 'rgba(255,255,255,0.95)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoSrc} width={170} height={170} alt="" style={{ objectFit: 'contain' }} />
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                width: 200,
                height: 200,
                borderRadius: 999,
                border: '6px solid rgba(255,255,255,0.25)',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 110,
                color: 'rgba(255,255,255,0.85)',
              }}
            >
              {(m?.opponent ?? '?').trim().charAt(0).toUpperCase()}
            </div>
          )}
          <div
            style={{
              display: 'flex',
              fontSize: m && m.opponent.length > 14 ? 34 : 44,
              marginTop: 16,
              textAlign: 'center',
            }}
          >
            {m?.opponent ?? ''}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', fontSize: 30, color: 'rgba(255,255,255,0.8)' }}>{sub}</div>
    </div>,
    {
      ...OG_SIZE,
      fonts: [
        { name: 'Russo Latin', data: lat, weight: 400, style: 'normal' },
        { name: 'Russo Cyrillic', data: cyr, weight: 400, style: 'normal' },
      ],
    },
  )
}

/** Логотип суперника як data-URL: з Vercel Blob або (локально) з public/uploads. Будь-яка помилка — без логотипа. */
async function teamLogo(url: string | null | undefined) {
  if (!url) return null
  try {
    let bytes: Buffer
    let type = 'image/webp'
    if (url.startsWith('/uploads/')) {
      bytes = await readFile(path.join(process.cwd(), 'public', url))
    } else if (/^https:\/\/[^/]+\.public\.blob\.vercel-storage\.com\//.test(url)) {
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
      if (!res.ok) return null
      type = res.headers.get('content-type') ?? type
      bytes = Buffer.from(await res.arrayBuffer())
    } else {
      return null
    }
    if (url.endsWith('.png')) type = 'image/png'
    if (url.endsWith('.jpg')) type = 'image/jpeg'
    return `data:${type};base64,${bytes.toString('base64')}`
  } catch {
    return null
  }
}
