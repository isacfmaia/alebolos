'use client'

import { useMemo, useState, useOptimistic, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Package, Clock } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { formatBRL } from '@/lib/utils/order'
import { toggleProdutoAtivo, deleteProduto } from '@/app/admin/(protected)/produtos/actions'
import { ProdutoFormModal } from './ProdutoFormModal'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { SearchInput } from '@/components/admin/SearchInput'
import type { CategoryRow, ProdutoWithCategory } from '@/types/database'

const PAGE_SIZE = 20

type Props = {
  produtos: ProdutoWithCategory[]
  categories: CategoryRow[]
}

export function ProdutosPageClient({ produtos, categories }: Props) {
  const [page, setPage] = useState(0)
  const [query, setQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editProduto, setEditProduto] = useState<ProdutoWithCategory | null>(null)
  const [modalKey, setModalKey] = useState(0)
  const [deletePending, setDeletePending] = useState<ProdutoWithCategory | null>(null)
  const [, startTransition] = useTransition()

  const [optimisticProdutos, applyOptimistic] = useOptimistic(
    produtos,
    (state, { id, ativo }: { id: string; ativo: boolean }) =>
      state.map((p) => (p.id === id ? { ...p, ativo } : p)),
  )

  // Filtragem client-side por nome, descrição ou nome da categoria.
  const filteredProdutos = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return optimisticProdutos
    return optimisticProdutos.filter((p) => {
      return (
        p.nome.toLowerCase().includes(q) ||
        p.descricao?.toLowerCase().includes(q) ||
        p.categories?.nome.toLowerCase().includes(q)
      )
    })
  }, [optimisticProdutos, query])

  const isSearching = query.trim().length > 0

  // Quando há busca ativa, mostramos tudo de uma vez (sem paginação) — o
  // resultado já é pequeno e paginar confunde o usuário ("cadê o que digitei?").
  const totalPages = isSearching ? 1 : Math.ceil(filteredProdutos.length / PAGE_SIZE)
  const paginated = isSearching
    ? filteredProdutos
    : filteredProdutos.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const handleToggle = (id: string, ativo: boolean) => {
    startTransition(async () => {
      applyOptimistic({ id, ativo })
      const result = await toggleProdutoAtivo(id, ativo)
      if (result.error) toast.error(result.error)
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deletePending) return
    const result = await deleteProduto(deletePending.id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Produto excluído.')
      setDeletePending(null)
    }
  }

  const openEdit = (produto: ProdutoWithCategory) => {
    setEditProduto(produto)
    setModalKey((k) => k + 1)
    setIsModalOpen(true)
  }

  const openNew = () => {
    setEditProduto(null)
    setModalKey((k) => k + 1)
    setIsModalOpen(true)
  }

  const handleModalSuccess = () => {
    setIsModalOpen(false)
    setEditProduto(null)
  }

  return (
    <div>
      {/* ── Page header ───────────────────────────────────── */}
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-rose/80">
            Catálogo
          </p>
          <h1 className="font-heading text-4xl font-semibold leading-none tracking-tight text-brand-brown">
            Produtos
          </h1>
          <p className="mt-2 text-sm text-brand-brown/60">
            {isSearching
              ? `${filteredProdutos.length} de ${produtos.length} ${produtos.length === 1 ? 'produto' : 'produtos'}`
              : `${produtos.length} ${produtos.length === 1 ? 'produto cadastrado' : 'produtos cadastrados'}`}
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex shrink-0 items-center gap-2 rounded-full bg-gradient-rose px-5 py-2.5 text-sm font-semibold tracking-tight text-white shadow-elev transition-all duration-150 hover:shadow-glow active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Novo produto
        </button>
      </header>

      {/* ── Busca ────────────────────────────────────────── */}
      {produtos.length > 0 && (
        <div className="mb-4">
          <SearchInput
            value={query}
            onChange={(v) => {
              setQuery(v)
              setPage(0)
            }}
            placeholder="Buscar por nome, descrição ou categoria…"
            ariaLabel="Buscar produtos"
          />
        </div>
      )}

      {optimisticProdutos.length === 0 ? (
        <EmptyState onNew={openNew} />
      ) : filteredProdutos.length === 0 ? (
        <NoResults />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-brand-brown/8 bg-white shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-brown/8 bg-brand-cream/50">
                    <TH>Produto</TH>
                    <TH className="hidden sm:table-cell">Categoria</TH>
                    <TH className="hidden md:table-cell">Disponibilidade</TH>
                    <TH className="text-right">Preço</TH>
                    <TH className="text-center">Ativo</TH>
                    <TH className="text-right">Ações</TH>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-brown/6">
                  {paginated.map((produto) => (
                    <tr key={produto.id} className="group transition-colors hover:bg-brand-cream/30">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3.5">
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-brand-cream-dark ring-1 ring-brand-brown/6">
                            {produto.foto_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={produto.foto_url}
                                alt={produto.nome}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-lg opacity-60" aria-hidden>
                                🎂
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[14px] font-semibold tracking-tight text-brand-brown">
                              {produto.nome}
                            </p>
                            {produto.descricao && (
                              <p className="mt-0.5 max-w-[200px] truncate text-[12px] font-medium text-brand-brown/55">
                                {produto.descricao}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-5 py-3.5 sm:table-cell">
                        {produto.categories ? (
                          <Badge variant="secondary">{produto.categories.nome}</Badge>
                        ) : (
                          <span className="text-brand-brown/35">—</span>
                        )}
                      </td>
                      <td className="hidden px-5 py-3.5 md:table-cell">
                        {produto.pronta_entrega ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                            Pronta entrega
                          </span>
                        ) : produto.prazo_quantidade ? (
                          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-brand-brown/65">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            {produto.prazo_quantidade} {produto.prazo_unidade ?? ''}
                          </span>
                        ) : (
                          <span className="text-brand-brown/35">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right font-heading text-[15px] font-semibold tabular-nums tracking-tight text-brand-brown">
                        {formatBRL(produto.preco)}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <Switch
                          checked={produto.ativo}
                          onCheckedChange={(v) => handleToggle(produto.id, v)}
                          aria-label={produto.ativo ? 'Desativar' : 'Ativar'}
                        />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(produto)}
                            aria-label={`Editar ${produto.nome}`}
                            className="rounded-lg p-1.5 text-brand-brown/45 transition-colors hover:bg-brand-cream-dark/40 hover:text-brand-brown"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletePending(produto)}
                            aria-label={`Excluir ${produto.nome}`}
                            className="rounded-lg p-1.5 text-brand-brown/45 transition-colors hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-lg border border-brand-brown/12 bg-white px-3.5 py-1.5 text-[13px] font-medium text-brand-brown transition-colors hover:bg-brand-cream disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="px-2 text-[12px] font-semibold tabular-nums text-brand-brown/55">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="rounded-lg border border-brand-brown/12 bg-white px-3.5 py-1.5 text-[13px] font-medium text-brand-brown transition-colors hover:bg-brand-cream disabled:opacity-40"
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}

      <ProdutoFormModal
        key={modalKey}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        editProduto={editProduto}
        categories={categories}
      />

      <DeleteConfirmDialog
        isOpen={!!deletePending}
        name={deletePending?.nome ?? ''}
        onClose={() => setDeletePending(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}

/* ── Sub-componentes ─────────────────────────────────────── */

function TH({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={[
        'px-5 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.1em] text-brand-brown/60',
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </th>
  )
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-brand-brown/8 bg-white py-20 text-center shadow-card">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-rose/8 ring-1 ring-brand-rose/15">
        <Package className="h-9 w-9 text-brand-rose/55" strokeWidth={1.5} />
      </div>
      <h2 className="font-heading text-2xl font-semibold tracking-tight text-brand-brown">
        Nenhum produto cadastrado
      </h2>
      <p className="mt-2 max-w-xs text-sm text-brand-brown/60">
        Adicione seu primeiro produto para começar a montar o cardápio.
      </p>
      <button
        onClick={onNew}
        className="mt-6 flex items-center gap-2 rounded-full bg-gradient-rose px-5 py-2.5 text-sm font-semibold tracking-tight text-white shadow-elev transition-all hover:shadow-glow active:scale-[0.98]"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        Novo produto
      </button>
    </div>
  )
}

function NoResults() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-brand-brown/8 bg-white py-20 text-center shadow-card">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-rose/8 ring-1 ring-brand-rose/15">
        <Package className="h-9 w-9 text-brand-rose/55" strokeWidth={1.5} />
      </div>
      <h2 className="font-heading text-2xl font-semibold tracking-tight text-brand-brown">
        Nenhum resultado
      </h2>
      <p className="mt-2 max-w-xs text-sm text-brand-brown/60">
        Nenhum produto corresponde à sua busca. Tente outro nome, descrição ou categoria.
      </p>
    </div>
  )
}
