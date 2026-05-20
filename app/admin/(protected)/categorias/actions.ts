'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const categorySchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório').max(60),
  ordem: z.number().int().nonnegative().optional(),
})

type CategoryPayload = z.infer<typeof categorySchema>

async function revalidateAll() {
  revalidatePath('/admin/categorias')
  revalidatePath('/admin/produtos')
  revalidatePath('/')
}

export async function createCategory(
  payload: CategoryPayload,
): Promise<{ error?: string; id?: string }> {
  try {
    const data = categorySchema.parse(payload)
    const supabase = await createClient()
    const { data: created, error } = await supabase
      .from('categories')
      .insert(data)
      .select('id')
      .single()
    if (error) return { error: error.message }
    await revalidateAll()
    return { id: created.id }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro ao criar categoria.' }
  }
}

export async function updateCategory(
  id: string,
  payload: CategoryPayload,
): Promise<{ error?: string }> {
  try {
    const data = categorySchema.parse(payload)
    const supabase = await createClient()
    const { error } = await supabase.from('categories').update(data).eq('id', id)
    if (error) return { error: error.message }
    await revalidateAll()
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro ao salvar categoria.' }
  }
}

export async function deleteCategory(id: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    await supabase.from('produtos').update({ categoria_id: null }).eq('categoria_id', id)
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) return { error: error.message }
    await revalidateAll()
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro ao excluir categoria.' }
  }
}
