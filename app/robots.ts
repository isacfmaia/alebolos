import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo/site'

/**
 * /robots.txt gerado dinamicamente pelo Next.js (App Router).
 *
 * Regras:
 *  - Tudo público pode ser indexado por padrão.
 *  - /admin/* é o painel administrativo (privado).
 *  - /acompanhar/* expõe pedidos por UUID — privado por design.
 *  - /api/* e /_next/* não devem aparecer em buscas.
 *
 * O sitemap declarado aqui ajuda o Google a descobrir as rotas.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/acompanhar/', '/api/', '/_next/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
