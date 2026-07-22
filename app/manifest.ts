import type { MetadataRoute } from 'next'
import { SITE_NAME, SITE_DESCRIPTION } from '@/lib/seo/site'

/**
 * /manifest.webmanifest — habilita "Adicionar à tela inicial" (PWA básica).
 *
 * Usuários no celular podem instalar o cardápio como um atalho que abre em
 * tela cheia, parecendo um app nativo. Além de melhorar UX mobile, o manifest
 * é um sinal positivo para o Google (PWA-friendly).
 *
 * Os ícones apontam para o `app/icon.svg` (mesmo arquivo do favicon),
 * servido pelo Next.js automaticamente.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Cardápio`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#fbf4ec',
    theme_color: '#d99a91',
    lang: 'pt-BR',
    dir: 'ltr',
    categories: ['food', 'shopping', 'lifestyle'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  }
}
