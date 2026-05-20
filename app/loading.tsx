import { ProdutoCardSkeleton } from '@/components/catalog/ProdutoCardSkeleton'

/**
 * Skeleton da home (cardápio público).
 * Espelha a estrutura do CatalogClient: header glass de 68px, barra
 * sticky de categorias e grid 1/2/3 colunas.
 */

const SKELETON_WIDTHS = [72, 96, 80, 112, 88]

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-warm">
      {/* Header glass — mesma altura do CatalogClient (68px) */}
      <div className="sticky top-0 z-20 h-[68px] border-b border-brand-brown/8 glass" />

      {/* Barra sticky das categorias */}
      <div className="sticky top-[68px] z-10 border-b border-brand-brown/6 glass">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-hidden px-5 py-3.5">
          {SKELETON_WIDTHS.map((w, i) => (
            <div
              key={i}
              className="h-8 shrink-0 animate-pulse rounded-full bg-brand-cream-dark/70"
              style={{ width: w }}
            />
          ))}
        </div>
      </div>

      {/* Grid de produtos */}
      <main className="mx-auto max-w-7xl px-5 pt-10 pb-36">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <ProdutoCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  )
}
