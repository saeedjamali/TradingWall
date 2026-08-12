import { ImageResponse } from 'next/og'

export const alt = 'Trading Wall | دیوار معاملاتی'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * Latin-only text: @vercel/og does not fully support Arabic ligatures
 * (lookupType 5 / substFormat 3) and fails the production build.
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '72px',
          background:
            'linear-gradient(135deg, #0b1220 0%, #111827 45%, #1e3a8a 100%)',
          color: 'white',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 28,
            letterSpacing: 6,
            textTransform: 'uppercase',
            color: '#93c5fd',
            marginBottom: 24,
          }}
        >
          TRADING WALL
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.15,
            marginBottom: 28,
          }}
        >
          Trading Journal & Leaderboard
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 30,
            color: '#cbd5e1',
            maxWidth: 920,
            lineHeight: 1.4,
          }}
        >
          Journal · Leaderboards · Public Trading Walls
        </div>
      </div>
    ),
    { ...size },
  )
}
