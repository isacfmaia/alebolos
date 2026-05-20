import { ImageResponse } from 'next/og'
import { SITE_NAME, SITE_TAGLINE } from '@/lib/seo/site'

/**
 * Open Graph image dinâmica — aparece quando o link da home é compartilhado
 * em WhatsApp, Facebook, Telegram, X, LinkedIn, etc.
 *
 * Gerada em runtime pela Edge via `ImageResponse` do next/og.
 * 1200×630 é o tamanho recomendado pelo Open Graph protocol.
 *
 * O Next.js detecta este arquivo e expõe automaticamente em
 * `/opengraph-image` — basta o metadata do layout/page apontar para lá
 * (já configurado por convenção no App Router).
 */

export const runtime = 'edge'
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`
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
          // Gradiente quente — espelha a paleta da logo (#fef2e0 → coral suave)
          background: 'linear-gradient(135deg, #fef2e0 0%, #f8d9b8 50%, #f6b98a 100%)',
          position: 'relative',
        }}
      >
        {/* Borda decorativa interna */}
        <div
          style={{
            position: 'absolute',
            inset: 32,
            border: '2px solid rgba(65, 21, 1, 0.12)',
            borderRadius: 32,
          }}
        />

        {/* Tag eyebrow */}
        <div
          style={{
            display: 'flex',
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: 6,
            textTransform: 'uppercase',
            color: '#eb3121',
            marginBottom: 28,
          }}
        >
          Confeitaria Artesanal
        </div>

        {/* Nome da loja — destaque */}
        <div
          style={{
            display: 'flex',
            fontSize: 140,
            fontWeight: 700,
            color: '#411501',
            letterSpacing: -3,
            lineHeight: 1,
            textAlign: 'center',
          }}
        >
          {SITE_NAME}
        </div>

        {/* Subtítulo */}
        <div
          style={{
            display: 'flex',
            fontSize: 36,
            color: '#411501',
            opacity: 0.7,
            marginTop: 32,
            fontStyle: 'italic',
          }}
        >
          Feito com afeto
        </div>

        {/* Decorações nos cantos — corações */}
        <div
          style={{
            position: 'absolute',
            top: 60,
            right: 80,
            fontSize: 56,
            color: '#eb3121',
            opacity: 0.4,
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
            color: '#eb3121',
            opacity: 0.4,
          }}
        >
          ♥
        </div>
      </div>
    ),
    { ...size },
  )
}
