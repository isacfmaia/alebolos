'use client'

import { useRef, useState } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Upload, X, Loader2 } from 'lucide-react'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'
import { resizeAndCompress, extractStoragePath } from '@/lib/utils/image'
import { createProduto, updateProduto } from '@/app/admin/(protected)/produtos/actions'
import { createCategory } from '@/app/admin/(protected)/categorias/actions'
import type { CategoryRow, ProdutoWithCategory } from '@/types/database'

// Sentinela usado no <select> de categoria para indicar a opção
// "+ Criar nova categoria…". Não pode colidir com nenhum UUID real.
const NEW_CAT = '__nova__'

// Unidades aceitas para prazo de preparo. Deve bater com o tipo no banco.
const UNIDADES = ['minuto', 'hora', 'dia', 'semana', 'mes'] as const
const UNIDADE_LABELS: Record<string, string> = {
  minuto: 'Minuto(s)',
  hora: 'Hora(s)',
  dia: 'Dia(s)',
  semana: 'Semana(s)',
  mes: 'Mês/Meses',
}

const schema = z.object({
  nome: z.string().min(1, 'Nome obrigatório').max(100),
  descricao: z.string().max(500, 'Máximo 500 caracteres').optional(),
  categoria_id: z.string().optional(),
  preco: z
    .number({ error: 'Informe um preço válido' })
    .positive('Preço deve ser maior que zero'),
  ativo: z.boolean(),
  pronta_entrega: z.boolean(),
  prazo_quantidade: z.number().int().positive().nullable().optional(),
  prazo_unidade: z.enum(UNIDADES).nullable().optional(),
})

type FormValues = z.infer<typeof schema>

type Props = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  /** Quando passado, o modal entra em modo edição. Caso null, modo criação. */
  editProduto: ProdutoWithCategory | null
  categories: CategoryRow[]
}

const inputCls = (hasError?: boolean) =>
  [
    'w-full rounded-lg border bg-white px-3 text-sm transition-colors',
    'placeholder:text-muted-foreground',
    'focus:outline-none focus:ring-2 focus:ring-brand-rose/30 focus:border-brand-rose',
    hasError ? 'border-destructive' : 'border-border',
  ].join(' ')

/**
 * Modal de criar/editar produto.
 *
 * Funcionalidades:
 *  - Upload de foto com preview e redimensionamento (resize → JPEG 1200px)
 *  - Criação de categoria inline (atalho na lista do select)
 *  - Switch "Pronta entrega" condiciona a aparição dos campos de prazo
 *  - Em modo edição, foto antiga é deletada do Storage ao trocar/remover
 */
export function ProdutoFormModal({ isOpen, onClose, onSuccess, editProduto, categories }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Arquivo selecionado pelo usuário (ainda não enviado para o Storage).
  const [imageFile, setImageFile] = useState<File | null>(null)
  // URL exibida no preview. Pode ser:
  //   - blob:... (selecionou novo arquivo)
  //   - https://...supabase.co/... (foto já salva, modo edição)
  //   - null (sem foto)
  const [previewUrl, setPreviewUrl] = useState<string | null>(() => editProduto?.foto_url ?? null)
  // Flag para distinguir "remoção explícita" de "nunca teve foto" — necessária
  // para deletar a foto antiga do Storage no submit.
  const [imageRemoved, setImageRemoved] = useState(false)
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: editProduto?.nome ?? '',
      descricao: editProduto?.descricao ?? '',
      categoria_id: editProduto?.categoria_id ?? '',
      preco: editProduto?.preco ?? 0,
      ativo: editProduto?.ativo ?? true,
      pronta_entrega: editProduto?.pronta_entrega ?? true,
      prazo_quantidade: editProduto?.prazo_quantidade ?? null,
      prazo_unidade: (editProduto?.prazo_unidade as typeof UNIDADES[number] | null) ?? null,
    },
  })

  const prontaEntrega = useWatch({ control, name: 'pronta_entrega' })

  /**
   * Usuário escolheu um novo arquivo no <input type="file">.
   * Revoga o blob anterior (se existir) para não vazar memória, gera um novo
   * preview e limpa o value do input — assim selecionar o MESMO arquivo de
   * novo dispara onChange (caso contrário o browser ignora).
   */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    setImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setImageRemoved(false)
    e.target.value = ''
  }

  /**
   * Usuário clicou no "X" para remover a foto.
   * Marca o estado como "removeu" para que o submit saiba que precisa apagar
   * o arquivo antigo do Storage (não basta gravar foto_url=null no banco).
   */
  const handleRemoveImage = () => {
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    setImageFile(null)
    setPreviewUrl(null)
    setImageRemoved(true)
  }

  /**
   * Submit do formulário. Fluxo:
   *   1. Se selecionou "+ Criar nova categoria", cria a categoria primeiro
   *      para ter o ID antes de salvar o produto.
   *   2. Se há arquivo de imagem novo, sobe pro Storage com nome único (UUID)
   *      e usa a URL pública resultante.
   *   3. Se trocou OU removeu a foto, apaga o arquivo antigo do Storage
   *      (evita lixo acumulando no bucket).
   *   4. Chama createProduto/updateProduto com o payload final.
   */
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    try {
      // ─── 1. Resolver categoria ──────────────────────────
      // Se o usuário escolheu "criar nova", precisamos criar PRIMEIRO
      // para obter o id antes de gravar o produto.
      let categoriaId: string | null = data.categoria_id || null
      if (data.categoria_id === NEW_CAT) {
        const trimmed = newCategoryName.trim()
        if (!trimmed) {
          toast.error('Informe o nome da nova categoria.')
          return
        }
        const catResult = await createCategory({ nome: trimmed, ordem: 0 })
        if (catResult.error) { toast.error(catResult.error); return }
        categoriaId = catResult.id ?? null
      }

      // ─── 2. Resolver foto ───────────────────────────────
      const supabase = createClient()
      // Estado base de fotoUrl: se removeu, null; senão mantém a antiga (modo edição).
      let fotoUrl = imageRemoved ? null : (editProduto?.foto_url ?? null)

      if (imageFile) {
        // Há um arquivo novo: comprime no browser, sobe pro Storage, pega a URL pública.
        const blob = await resizeAndCompress(imageFile)
        // Nome único via UUID evita colisão e dispensa upsert (mais seguro).
        const path = `produtos/${crypto.randomUUID()}.jpg`
        const { error: uploadErr } = await supabase.storage
          .from('product-images')
          .upload(path, blob, { contentType: 'image/jpeg', upsert: false })
        if (uploadErr) { toast.error('Erro ao enviar foto: ' + uploadErr.message); return }
        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path)
        fotoUrl = publicUrl

        // Foto antiga ficou órfã — remove do Storage para não acumular lixo.
        if (editProduto?.foto_url) {
          const oldPath = extractStoragePath(editProduto.foto_url, 'product-images')
          if (oldPath) await supabase.storage.from('product-images').remove([oldPath])
        }
      } else if (imageRemoved && editProduto?.foto_url) {
        // Não subiu nada novo, mas o usuário removeu a foto que existia.
        const oldPath = extractStoragePath(editProduto.foto_url, 'product-images')
        if (oldPath) await supabase.storage.from('product-images').remove([oldPath])
      }

      // ─── 3. Montar payload e salvar ─────────────────────
      // Se pronta_entrega = true, força prazo a null (estado mutuamente exclusivo).
      const payload = {
        nome: data.nome,
        descricao: data.descricao || null,
        categoria_id: categoriaId,
        preco: data.preco,
        foto_url: fotoUrl,
        ativo: data.ativo,
        pronta_entrega: data.pronta_entrega,
        prazo_quantidade: data.pronta_entrega ? null : (data.prazo_quantidade ?? null),
        prazo_unidade: data.pronta_entrega ? null : (data.prazo_unidade ?? null),
      }

      const result = editProduto
        ? await updateProduto(editProduto.id, payload)
        : await createProduto(payload)

      if (result.error) { toast.error(result.error); return }

      toast.success(editProduto ? 'Produto atualizado!' : 'Produto criado!')
      onSuccess()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro inesperado.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[90dvh] flex-col gap-0 p-0"
      >
        <DialogHeader className="shrink-0 border-b border-brand-rose/15 px-6 py-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">
              {editProduto ? 'Editar produto' : 'Novo produto'}
            </DialogTitle>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Fechar"
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-brand-cream hover:text-brand-brown disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <form
          id="produto-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex-1 overflow-y-auto"
        >
          <div className="space-y-4 px-6 py-5">
            {/* Foto */}
            <div className="space-y-1.5">
              <span className="block text-xs font-bold uppercase tracking-wide text-brand-brown">
                Foto
              </span>
              <div
                role="button"
                tabIndex={0}
                aria-label="Selecionar foto"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                className="relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-brand-rose/30 transition-colors hover:border-brand-rose/60"
              >
                {previewUrl ? (
                  <div className="relative h-44">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      fill
                      className="object-cover"
                      sizes="(max-width: 512px) 100vw, 512px"
                      unoptimized={previewUrl.startsWith('blob:')}
                    />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleRemoveImage() }}
                      aria-label="Remover foto"
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                    <Upload className="h-7 w-7" strokeWidth={1.5} />
                    <p className="text-sm font-medium">Clique para selecionar foto</p>
                    <p className="text-xs">JPG, PNG, WebP · será redimensionada para 1200px</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            {/* Nome */}
            <div className="space-y-1.5">
              <label htmlFor="nome" className="block text-xs font-bold uppercase tracking-wide text-brand-brown">
                Nome *
              </label>
              <input
                id="nome"
                {...register('nome')}
                placeholder="Ex: Bolo de morango"
                className={inputCls(!!errors.nome) + ' h-9'}
              />
              {errors.nome && (
                <p role="alert" className="text-xs text-destructive">{errors.nome.message}</p>
              )}
            </div>

            {/* Descrição */}
            <div className="space-y-1.5">
              <label htmlFor="descricao" className="block text-xs font-bold uppercase tracking-wide text-brand-brown">
                Descrição
                <span className="ml-1 font-normal normal-case text-muted-foreground">(opcional)</span>
              </label>
              <textarea
                id="descricao"
                {...register('descricao')}
                rows={2}
                placeholder="Ex: Massa fofinha com recheio de brigadeiro..."
                className={inputCls(!!errors.descricao) + ' resize-none py-2'}
              />
              {errors.descricao && (
                <p role="alert" className="text-xs text-destructive">{errors.descricao.message}</p>
              )}
            </div>

            {/* Categoria */}
            <div className="space-y-1.5">
              <label htmlFor="categoria_id" className="block text-xs font-bold uppercase tracking-wide text-brand-brown">
                Categoria
              </label>
              <select
                id="categoria_id"
                {...register('categoria_id', {
                  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
                    setIsCreatingCategory(e.target.value === NEW_CAT)
                    if (e.target.value !== NEW_CAT) setNewCategoryName('')
                  },
                })}
                className={inputCls() + ' h-9 cursor-pointer'}
              >
                <option value="">Sem categoria</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nome}
                  </option>
                ))}
                <option value={NEW_CAT}>+ Criar nova categoria…</option>
              </select>
              {isCreatingCategory && (
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nome da nova categoria"
                  autoFocus
                  className={inputCls() + ' mt-1.5 h-9'}
                />
              )}
            </div>

            {/* Preço */}
            <div className="space-y-1.5">
              <label htmlFor="preco" className="block text-xs font-bold uppercase tracking-wide text-brand-brown">
                Preço *
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  R$
                </span>
                <input
                  id="preco"
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...register('preco', { valueAsNumber: true })}
                  placeholder="0,00"
                  className={inputCls(!!errors.preco) + ' h-9 pl-9'}
                />
              </div>
              {errors.preco && (
                <p role="alert" className="text-xs text-destructive">{errors.preco.message}</p>
              )}
            </div>

            {/* Pronta entrega */}
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl border border-border bg-brand-cream/30 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-brand-brown">Pronta entrega</p>
                  <p className="text-xs text-muted-foreground">
                    Disponível imediatamente
                  </p>
                </div>
                <Controller
                  name="pronta_entrega"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label="Pronta entrega"
                    />
                  )}
                />
              </div>

              {!prontaEntrega && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wide text-brand-brown">
                    Prazo de preparo *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      {...register('prazo_quantidade', { valueAsNumber: true })}
                      placeholder="Ex: 2"
                      className={inputCls(!!errors.prazo_quantidade) + ' h-9 flex-1'}
                    />
                    <select
                      {...register('prazo_unidade')}
                      className={inputCls() + ' h-9 flex-1 cursor-pointer'}
                    >
                      <option value="">Unidade</option>
                      {UNIDADES.map((u) => (
                        <option key={u} value={u}>{UNIDADE_LABELS[u]}</option>
                      ))}
                    </select>
                  </div>
                  {errors.prazo_quantidade && (
                    <p role="alert" className="text-xs text-destructive">
                      {errors.prazo_quantidade.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Ativo */}
            <div className="flex items-center justify-between rounded-xl border border-border bg-brand-cream/30 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-brand-brown">Produto ativo</p>
                <p className="text-xs text-muted-foreground">Aparece no cardápio público</p>
              </div>
              <Controller
                name="ativo"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-label="Produto ativo"
                  />
                )}
              />
            </div>
          </div>
        </form>

        <DialogFooter className="shrink-0 border-t border-brand-rose/15 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full border border-border px-5 py-2 text-sm font-medium text-brand-brown transition-colors hover:bg-brand-cream disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="produto-form"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-full bg-brand-rose px-5 py-2 text-sm font-bold text-white transition-all hover:bg-brand-rose-dark active:scale-[0.98] disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Salvando…
              </>
            ) : editProduto ? (
              'Salvar alterações'
            ) : (
              'Criar produto'
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
