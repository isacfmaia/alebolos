import Image from 'next/image'
import { Plus } from 'lucide-react'
import type { ProdutoWithCategory } from '@/types/database'
import { PrazoBadge } from '@/components/ui/PrazoBadge'

type Props = {
  produto: ProdutoWithCategory
  onAdd: () => void
  /**
   * Marca a imagem como LCP (Largest Contentful Paint). Use `true` para os
   * primeiros cards acima da dobra — habilita preload e remove o lazy loading.
   */
  priority?: boolean
}

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export function ProdutoCard({ produto, onAdd, priority = false }: Props) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-brand-brown/6 bg-white shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-pop">
      {/* ── Imagem ────────────────────────────────────────── */}
      <div className="relative aspect-[5/4] shrink-0 overflow-hidden bg-brand-cream-dark">
        {produto.foto_url ? (
          <Image
            src={produto.foto_url}
            alt={produto.nome}
            fill
            priority={priority}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center select-none">
            <span className="text-7xl opacity-60">🎂</span>
          </div>
        )}

        {/* Gradiente sutil de baixo para realce */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-brand-brown/15 to-transparent"
        />

        {produto.categories && (
          <span className="absolute left-3.5 top-3.5 rounded-full bg-white/95 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-brand-brown shadow-sm ring-1 ring-brand-brown/8 backdrop-blur-sm">
            {produto.categories.nome}
          </span>
        )}
      </div>

      {/* ── Conteúdo ──────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex-1">
          <h3 className="font-heading text-[19px] font-semibold leading-[1.2] tracking-tight text-brand-brown">
            {produto.nome}
          </h3>
          {produto.descricao && (
            <p className="mt-2 line-clamp-2 text-[13.5px] leading-relaxed text-brand-brown/60">
              {produto.descricao}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <PrazoBadge
            prontaEntrega={produto.pronta_entrega}
            prazoQuantidade={produto.prazo_quantidade}
            prazoUnidade={produto.prazo_unidade}
          />

          <div className="flex items-end justify-between gap-2 pt-1">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-brown/45">
                A partir de
              </p>
              <p className="mt-0.5 font-heading text-[22px] font-semibold leading-none tracking-tight tabular-nums text-brand-brown">
                {formatBRL(produto.preco)}
              </p>
            </div>
            <button
              onClick={onAdd}
              aria-label={`Adicionar ${produto.nome} ao carrinho`}
              className="flex items-center gap-1.5 rounded-full bg-brand-brown px-4 py-2.5 text-[13px] font-semibold tracking-tight text-white shadow-soft transition-all hover:bg-brand-rose hover:shadow-glow active:scale-[0.97]"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              Adicionar
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
