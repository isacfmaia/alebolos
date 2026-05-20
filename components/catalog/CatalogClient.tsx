'use client'

import { useState, useMemo, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Package } from 'lucide-react'
import { toast } from 'sonner'
import type { CategoryRow, SettingsRow, ProdutoWithCategory } from '@/types/database'
import { useCartStore } from '@/lib/store/cart'
import { ProdutoCard } from './ProdutoCard'
import { CartSheet } from './CartSheet'

type Props = {
  settings: SettingsRow | null
  categories: CategoryRow[]
  produtos: ProdutoWithCategory[]
}

export function CatalogClient({ settings, categories, produtos }: Props) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)

  useEffect(() => {
    void useCartStore.persist.rehydrate()
  }, [])

  const { entries, add } = useCartStore()
  const cartCount = entries.reduce((s, e) => s + e.quantity, 0)

  const filteredProdutos = useMemo(
    () =>
      activeCategory ? produtos.filter((p) => p.categoria_id === activeCategory) : produtos,
    [produtos, activeCategory],
  )

  const storeName = settings?.nome_loja ?? 'Cardápio'

  return (
    <div className="min-h-screen bg-gradient-warm">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 h-[68px] border-b border-brand-brown/8 glass">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-5">
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative h-11 w-11 shrink-0 transition-transform duration-200 group-hover:scale-105">
              <Image
                src="/logo_new.svg"
                alt={storeName}
                fill
                priority
                sizes="44px"
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="font-heading text-xl font-semibold leading-none tracking-tight text-brand-brown">
                {storeName}
              </h1>
              <p className="mt-1 text-[10.5px] font-medium uppercase tracking-[0.16em] text-brand-brown/50">
                Feito com afeto
              </p>
            </div>
          </Link>

          <button
            onClick={() => setIsCartOpen(true)}
            aria-label={`Abrir carrinho — ${cartCount} ${cartCount === 1 ? 'item' : 'itens'}`}
            className="relative rounded-full p-2.5 transition-colors hover:bg-brand-cream-dark/60"
          >
            <ShoppingCart className="h-[22px] w-[22px] text-brand-brown" strokeWidth={1.75} />
            {cartCount > 0 && (
              <span
                suppressHydrationWarning
                className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-rose px-1 text-[10px] font-bold leading-none text-white shadow-sm ring-2 ring-white"
              >
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── Filtro de categorias ────────────────────────────── */}
      <div className="sticky top-[68px] z-10 border-b border-brand-brown/6 glass">
        <div className="no-scrollbar mx-auto flex max-w-7xl gap-2 overflow-x-auto px-5 py-3.5">
          <CategoryChip
            label="Todos"
            active={activeCategory === null}
            onClick={() => setActiveCategory(null)}
          />
          {categories.map((cat) => (
            <CategoryChip
              key={cat.id}
              label={cat.nome}
              active={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Grid de produtos ────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-5 pb-36 pt-10">
        {filteredProdutos.length === 0 ? (
          <EmptyState hasFilter={activeCategory !== null} />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProdutos.map((produto, idx) => (
              <ProdutoCard
                key={produto.id}
                produto={produto}
                // Prioriza as 3 primeiras imagens (grid lg:grid-cols-3) — elas
                // ficam acima da dobra e o Next.js as detecta como LCP.
                priority={idx < 3}
                onAdd={() => {
                  add({
                    id: produto.id,
                    nome: produto.nome,
                    preco: produto.preco,
                    foto_url: produto.foto_url,
                    pronta_entrega: produto.pronta_entrega,
                    prazo_quantidade: produto.prazo_quantidade,
                    prazo_unidade: produto.prazo_unidade,
                  })
                  toast.success(`${produto.nome} adicionado ao carrinho`, {
                    action: {
                      label: 'Ver carrinho',
                      onClick: () => setIsCartOpen(true),
                    },
                  })
                }}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Barra do carrinho flutuante ─────────────────────── */}
      {cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-brown/8 glass">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5">
            <div className="flex items-center gap-3" suppressHydrationWarning>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-rose/10">
                <ShoppingCart className="h-4 w-4 text-brand-rose" strokeWidth={2} />
              </div>
              <p className="text-sm font-semibold tracking-tight text-brand-brown">
                {cartCount} {cartCount === 1 ? 'item' : 'itens'}
                <span className="ml-1 font-normal text-brand-brown/55">no carrinho</span>
              </p>
            </div>
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 rounded-full bg-gradient-rose px-5 py-2.5 text-sm font-semibold tracking-tight text-white shadow-elev transition-all hover:shadow-glow active:scale-[0.98]"
            >
              Ver carrinho
            </button>
          </div>
        </div>
      )}

      {/* ── Drawer do carrinho ──────────────────────────────── */}
      <CartSheet isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} settings={settings} />
    </div>
  )
}

/* ── Sub-componentes ─────────────────────────────────────── */

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold tracking-tight transition-all duration-150',
        active
          ? 'bg-brand-brown text-white shadow-card'
          : 'border border-brand-brown/12 bg-white text-brand-brown/75 hover:border-brand-brown/25 hover:bg-brand-cream hover:text-brand-brown',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-brand-rose/8 ring-1 ring-brand-rose/15">
        <Package className="h-10 w-10 text-brand-rose/55" strokeWidth={1.5} />
      </div>
      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-brand-brown">
          {hasFilter ? 'Nada por aqui ainda' : 'Cardápio em breve'}
        </h2>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-brand-brown/60">
          {hasFilter
            ? 'Tente selecionar outra categoria ou veja todos os produtos.'
            : 'Em breve nosso cardápio estará disponível. Volte logo!'}
        </p>
      </div>
    </div>
  )
}
