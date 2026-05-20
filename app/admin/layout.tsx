import type { Metadata } from 'next'

/**
 * Layout-mãe de /admin (login + área protegida).
 *
 * Único propósito: aplicar `noindex, nofollow` em TODAS as rotas admin via
 * metadata. Os crawlers não devem catalogar páginas de login nem o painel.
 *
 * Não renderiza UI — só passa children adiante para o layout específico
 * (login renderiza direto, área protegida usa app/admin/(protected)/layout.tsx).
 */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children
}
