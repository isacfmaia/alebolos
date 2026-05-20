import { Skeleton } from '@/components/ui/skeleton'

/**
 * Skeleton da página de acompanhamento de pedido.
 * Espelha a estrutura real (header com logo, card de status, timeline, itens)
 * para evitar layout shift quando os dados carregam.
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-brand-cream/30 px-4 py-10">
      <div className="mx-auto max-w-lg space-y-6">
        {/* ── Header (logo + título + saudação) ───────────── */}
        <div className="flex flex-col items-center text-center">
          <Skeleton className="h-16 w-16 rounded-2xl bg-brand-cream-dark/60" />
          <Skeleton className="mt-3 h-7 w-40 bg-brand-cream-dark/60" />
          <Skeleton className="mt-2 h-4 w-32 bg-brand-cream-dark/60" />
        </div>

        {/* ── Status atual (card grande centralizado) ────── */}
        <div className="rounded-xl border border-brand-rose/15 bg-white p-5">
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full bg-brand-cream-dark/60" />
            <Skeleton className="h-6 w-48 bg-brand-cream-dark/60" />
            <Skeleton className="h-3 w-40 bg-brand-cream-dark/60" />
          </div>
        </div>

        {/* ── Timeline de andamento ──────────────────────── */}
        <div className="rounded-xl border border-brand-rose/15 bg-white p-5">
          <Skeleton className="mb-4 h-3 w-24 bg-brand-cream-dark/60" />
          <ol className="space-y-3">
            {Array.from({ length: 5 }, (_, idx) => {
              const isLast = idx === 4
              return (
                <li key={idx} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <Skeleton className="h-6 w-6 shrink-0 rounded-full bg-brand-cream-dark/60" />
                    {!isLast && (
                      <Skeleton className="mt-1 w-px flex-1 bg-brand-cream-dark/60" style={{ minHeight: '1.5rem' }} />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5 pb-3">
                    <Skeleton className="h-4 w-36 bg-brand-cream-dark/60" />
                    <Skeleton className="h-3 w-24 bg-brand-cream-dark/60" />
                  </div>
                </li>
              )
            })}
          </ol>
        </div>

        {/* ── Itens do pedido ────────────────────────────── */}
        <div className="rounded-xl border border-brand-rose/15 bg-white p-5">
          <Skeleton className="mb-3 h-3 w-28 bg-brand-cream-dark/60" />
          <ul className="space-y-3">
            {Array.from({ length: 2 }, (_, idx) => (
              <li key={idx} className="flex items-start justify-between gap-2">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40 bg-brand-cream-dark/60" />
                  <Skeleton className="h-5 w-20 rounded-full bg-brand-cream-dark/60" />
                </div>
                <Skeleton className="h-4 w-16 shrink-0 bg-brand-cream-dark/60" />
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-dashed border-brand-rose/20 pt-3">
            <Skeleton className="h-4 w-12 bg-brand-cream-dark/60" />
            <Skeleton className="h-4 w-20 bg-brand-cream-dark/60" />
          </div>
          <Skeleton className="mt-2 h-3 w-32 bg-brand-cream-dark/60" />
        </div>

        {/* ── Footer (linha de contato) ──────────────────── */}
        <div className="flex justify-center">
          <Skeleton className="h-3 w-56 bg-brand-cream-dark/60" />
        </div>
      </div>
    </div>
  )
}
