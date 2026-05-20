'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, GripVertical, Loader2, Tag } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { DeleteConfirmDialog } from '@/components/admin/produtos/DeleteConfirmDialog'
import { createCategory, updateCategory, deleteCategory } from '@/app/admin/(protected)/categorias/actions'
import type { CategoryRow } from '@/types/database'

const schema = z.object({
  nome: z.string().min(1, 'Nome obrigatório').max(60),
  ordem: z.number().int().nonnegative().optional(),
})
type FormValues = z.infer<typeof schema>

type Props = { categories: CategoryRow[] }

export function CategoriesPageClient({ categories }: Props) {
  const [editCategory, setEditCategory] = useState<CategoryRow | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deletePending, setDeletePending] = useState<CategoryRow | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nome: '', ordem: 0 },
  })

  const openNew = () => {
    setEditCategory(null)
    reset({ nome: '', ordem: categories.length })
    setIsModalOpen(true)
  }

  const openEdit = (cat: CategoryRow) => {
    setEditCategory(cat)
    reset({ nome: cat.nome, ordem: cat.ordem ?? 0 })
    setIsModalOpen(true)
  }

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    try {
      const result = editCategory
        ? await updateCategory(editCategory.id, data)
        : await createCategory(data)
      if (result.error) { toast.error(result.error); return }
      toast.success(editCategory ? 'Categoria atualizada!' : 'Categoria criada!')
      setIsModalOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletePending) return
    const result = await deleteCategory(deletePending.id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Categoria excluída. Bolos vinculados ficaram sem categoria.')
      setDeletePending(null)
    }
  }

  const inputCls = (hasError?: boolean) =>
    [
      'h-10 w-full rounded-xl border bg-white px-3.5 text-sm font-medium tracking-tight transition-all',
      'placeholder:text-brand-brown/35 placeholder:font-normal',
      'focus:border-brand-rose focus:outline-none focus:ring-2 focus:ring-brand-rose/25',
      hasError ? 'border-destructive' : 'border-brand-brown/12',
    ].join(' ')

  return (
    <div>
      {/* ── Page header ───────────────────────────────────── */}
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-rose/80">
            Catálogo
          </p>
          <h1 className="font-heading text-4xl font-semibold leading-none tracking-tight text-brand-brown">
            Categorias
          </h1>
          <p className="mt-2 text-sm text-brand-brown/60">
            {categories.length} {categories.length === 1 ? 'categoria' : 'categorias'}
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex shrink-0 items-center gap-2 rounded-full bg-gradient-rose px-5 py-2.5 text-sm font-semibold tracking-tight text-white shadow-elev transition-all hover:shadow-glow active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Nova categoria
        </button>
      </header>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-brand-brown/8 bg-white py-20 text-center shadow-card">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-rose/8 ring-1 ring-brand-rose/15">
            <Tag className="h-9 w-9 text-brand-rose/55" strokeWidth={1.5} />
          </div>
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-brand-brown">
            Nenhuma categoria
          </h2>
          <p className="mt-2 max-w-xs text-sm text-brand-brown/60">
            Crie categorias para organizar seus produtos no cardápio.
          </p>
          <button
            onClick={openNew}
            className="mt-6 flex items-center gap-2 rounded-full bg-gradient-rose px-5 py-2.5 text-sm font-semibold tracking-tight text-white shadow-elev transition-all hover:shadow-glow active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Nova categoria
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-brand-brown/8 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-brown/8 bg-brand-cream/50">
                  <th className="w-8 px-3 py-3" />
                  <th className="px-5 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.1em] text-brand-brown/60">
                    Nome
                  </th>
                  <th className="px-5 py-3 text-center text-[10.5px] font-semibold uppercase tracking-[0.1em] text-brand-brown/60">
                    Ordem
                  </th>
                  <th className="px-5 py-3 text-right text-[10.5px] font-semibold uppercase tracking-[0.1em] text-brand-brown/60">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-brown/6">
                {categories.map((cat) => (
                  <tr key={cat.id} className="transition-colors hover:bg-brand-cream/30">
                    <td className="px-3 py-4 text-brand-brown/30">
                      <GripVertical className="h-4 w-4" />
                    </td>
                    <td className="px-5 py-4 text-[14px] font-semibold tracking-tight text-brand-brown">
                      {cat.nome}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-md bg-brand-cream-dark/60 px-2 text-[11.5px] font-bold tabular-nums text-brand-brown">
                        {cat.ordem ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(cat)}
                          aria-label={`Editar ${cat.nome}`}
                          className="rounded-lg p-1.5 text-brand-brown/45 transition-colors hover:bg-brand-cream-dark/40 hover:text-brand-brown"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletePending(cat)}
                          aria-label={`Excluir ${cat.nome}`}
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
      )}

      {/* ── Create / Edit dialog ──────────────────────────── */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && !isSubmitting && setIsModalOpen(false)}>
        <DialogContent showCloseButton={false} className="max-w-sm rounded-2xl p-6">
          <DialogHeader className="mb-5">
            <DialogTitle className="font-heading text-xl font-semibold tracking-tight text-brand-brown">
              {editCategory ? 'Editar categoria' : 'Nova categoria'}
            </DialogTitle>
          </DialogHeader>

          <form id="cat-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="cat-nome"
                className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-brown/65"
              >
                Nome *
              </label>
              <input
                id="cat-nome"
                {...register('nome')}
                placeholder="Ex: Bolos gelados"
                autoFocus
                className={inputCls(!!errors.nome)}
              />
              {errors.nome && (
                <p role="alert" className="text-xs font-medium text-destructive">
                  {errors.nome.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="cat-ordem"
                className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-brown/65"
              >
                Ordem de exibição
              </label>
              <input
                id="cat-ordem"
                type="number"
                min="0"
                {...register('ordem', { valueAsNumber: true })}
                placeholder="0"
                className={inputCls()}
              />
            </div>
          </form>

          <DialogFooter className="mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              className="rounded-full border border-brand-brown/12 bg-white px-4 py-2 text-sm font-semibold text-brand-brown transition-colors hover:bg-brand-cream disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="cat-form"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-full bg-gradient-rose px-5 py-2 text-sm font-semibold tracking-tight text-white shadow-elev transition-all hover:shadow-glow active:scale-[0.98] disabled:opacity-60"
            >
              {isSubmitting ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvando…</>
              ) : editCategory ? 'Salvar' : 'Criar'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        isOpen={!!deletePending}
        name={deletePending?.nome ?? ''}
        onClose={() => setDeletePending(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
