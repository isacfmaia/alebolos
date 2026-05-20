import type { Metadata } from 'next'

/**
 * Layout-mãe de /acompanhar — aplica `noindex` em todas as páginas de
 * rastreamento de pedido. Essas URLs contêm UUID privado e não devem
 * aparecer em buscadores (vazaria histórico de compras de clientes).
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

export default function AcompanharLayout({ children }: { children: React.ReactNode }) {
  return children
}
