import { ImageResponse } from 'next/og'
import { SITE_NAME, SITE_TAGLINE } from '@/lib/seo/site'

export const runtime = 'edge'
export const alt = `${SITE_NAME} - ${SITE_TAGLINE}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #fbf4ec 0%, #f3d6cf 52%, #d99a91 100%)',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 32,
            border: '2px solid rgba(91, 50, 31, 0.12)',
            borderRadius: 32,
          }}
        />

        <div
          style={{
            display: 'flex',
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: 6,
            textTransform: 'uppercase',
            color: '#b87972',
            marginBottom: 28,
          }}
        >
          Confeitaria Artesanal
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 132,
            fontWeight: 700,
            color: '#5b321f',
            letterSpacing: -2,
            lineHeight: 1,
            textAlign: 'center',
          }}
        >
          {SITE_NAME}
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 36,
            color: '#5b321f',
            opacity: 0.72,
            marginTop: 32,
            fontStyle: 'italic',
          }}
        >
          {SITE_TAGLINE}
        </div>

        <div
          style={{
            position: 'absolute',
            top: 60,
            right: 80,
            fontSize: 56,
            color: '#d99a91',
            opacity: 0.48,
          }}
        >
          ♥
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            left: 80,
            fontSize: 56,
            color: '#d99a91',
            opacity: 0.48,
          }}
        >
          ♥
        </div>
      </div>
    ),
    { ...size },
  )
}
