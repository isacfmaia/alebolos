import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import {
  SITE_URL,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_DESCRIPTION,
  SITE_LOCALE,
  SITE_KEYWORDS,
} from '@/lib/seo/site'
import './globals.css'

/**
 * Metadata raiz — herdada por TODAS as páginas que não definem a sua.
 * As pages podem sobrescrever campos individualmente via export `metadata`
 * ou `generateMetadata()`.
 */
export const metadata: Metadata = {
  // Base obrigatória para resolver URLs relativas em og:image, canonical, etc.
  metadataBase: new URL(SITE_URL),

  // Título: padrão para todas as páginas. `template` aplica em sub-rotas que
  // exportam `title` simples (ex: { title: 'Pedido #42' } vira "Pedido #42 · Sabor e Afeto").
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'food',

  // Robots — público por padrão. Rotas privadas sobrescrevem para noindex.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },

  // Open Graph — preview rico em WhatsApp, Facebook, LinkedIn.
  openGraph: {
    type: 'website',
    locale: SITE_LOCALE,
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    // /opengraph-image (Next.js gera automaticamente a partir de app/opengraph-image.tsx)
  },

  // Twitter / X
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },

  // Canonical do site (cada página pode sobrescrever).
  alternates: {
    canonical: '/',
  },

  // Verificações de propriedade (preencher quando registrar Search Console etc.)
  // verification: { google: 'token-aqui' },

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
}

/**
 * Viewport e theme-color separados (Next.js 16 exige fora do metadata).
 * `themeColor` colore a barra do navegador no Android com a cor da marca.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fef2e0' },
    { media: '(prefers-color-scheme: dark)', color: '#411501' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full font-sans antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
