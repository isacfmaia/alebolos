'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

/**
 * Server Actions de produtos (área admin).
 *
 * Todas exigem usuário autenticado — usam `createClient()` (server com cookies)
 * que respeita o RLS do Supabase. Após cada mutação, revalidamos tanto a
 * página admin quanto a home (cardápio público) para refletir o estado novo.
 */

// Unidades aceitas para prazo de preparo (deve bater com o tipo no banco).
const UNIDADES = ['minuto', 'hora', 'dia', 'semana', 'mes'] as const

// Schema Zod replicado no servidor — não confie no cliente.
const produtoSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório').max(100),
  descricao: z.string().max(500).nullable().optional(),
  categoria_id: z.string().uuid().nullable().optional(),
  preco: z.number({ error: 'Informe um preço válido' }).positive('Preço deve ser positivo'),
  foto_url: z.string().url().nullable().optional(),
  ativo: z.boolean(),
  pronta_entrega: z.boolean(),
  prazo_quantidade: z.number().int().positive().nullable().optional(),
  prazo_unidade: z.enum(UNIDADES).nullable().optional(),
})

type ProdutoPayload = z.infer<typeof produtoSchema>

/**
 * Invalida o cache do Next.js para as rotas que dependem da tabela `produtos`.
 * Roda após qualquer create/update/delete.
 */
async function revalidateAll() {
  revalidatePath('/admin/produtos')
  revalidatePath('/')
}

/** Cria um novo produto. */
export async function createProduto(payload: ProdutoPayload): Promise<{ error?: string }> {
  try {
    // Re-valida o payload no servidor — defesa em profundidade.
    const data = produtoSchema.parse(payload)
    const supabase = await createClient()
    const { error } = await supabase.from('produtos').insert(data)
    if (error) return { error: error.message }
    await revalidateAll()
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro ao salvar produto.' }
  }
}

/** Atualiza um produto existente. */
export async function updateProduto(
  id: string,
  payload: ProdutoPayload,
): Promise<{ error?: string }> {
  try {
    const data = produtoSchema.parse(payload)
    const supabase = await createClient()
    const { error } = await supabase.from('produtos').update(data).eq('id', id)
    if (error) return { error: error.message }
    await revalidateAll()
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro ao salvar produto.' }
  }
}

/**
 * Exclui o produto E o arquivo de foto associado no Storage.
 *
 * Faz o cleanup ANTES do delete do banco — se o delete falhar, a foto
 * já foi removida (degradação aceitável). O oposto seria pior: deletar
 * o registro mas deixar o arquivo órfão no Storage.
 */
export async function deleteProduto(id: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    // Busca a URL atual da foto para localizar o arquivo no Storage.
    const { data: produto } = await supabase
      .from('produtos')
      .select('foto_url')
      .eq('id', id)
      .single()

    if (produto?.foto_url) {
      const path = pickStoragePath(produto.foto_url)
      if (path) await supabase.storage.from('product-images').remove([path])
    }

    const { error } = await supabase.from('produtos').delete().eq('id', id)
    if (error) return { error: error.message }
    await revalidateAll()
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro ao excluir produto.' }
  }
}

/**
 * Liga/desliga a flag `ativo` (visibilidade no cardápio público).
 * Usado pelo Switch da listagem para toggle rápido sem abrir o modal.
 */
export async function toggleProdutoAtivo(
  id: string,
  ativo: boolean,
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('produtos').update({ ativo }).eq('id', id)
    if (error) return { error: error.message }
    await revalidateAll()
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro ao atualizar.' }
  }
}

/**
 * Extrai o caminho relativo dentro do bucket a partir de uma URL pública
 * do Supabase Storage. Necessário porque `storage.remove()` exige o caminho,
 * não a URL completa.
 *
 * Exemplo:
 *   URL  = "https://xyz.supabase.co/storage/v1/object/public/product-images/abc.jpg"
 *   path = "abc.jpg"
 *
 * Retorna null se a URL não bater com o padrão esperado (ex: foto hospedada
 * em outro lugar) — nesse caso o caller simplesmente pula a remoção.
 */
function pickStoragePath(url: string): string | null {
  const marker = '/object/public/product-images/'
  const idx = url.indexOf(marker)
  return idx !== -1 ? url.slice(idx + marker.length) : null
}
