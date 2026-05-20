'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const settingsSchema = z.object({
  nome_loja: z.string().min(1, 'Nome da loja obrigatório').max(100),
  whatsapp_number: z
    .string()
    .min(1, 'Número obrigatório')
    .regex(/^\d{10,15}$/, 'Digite só os números, ex: 5511999999999'),
  mensagem_boas_vindas: z.string().max(300).nullable().optional(),
  formas_pagamento: z
    .array(z.string().min(1))
    .min(1, 'Adicione ao menos uma forma de pagamento'),
})

type SettingsPayload = z.infer<typeof settingsSchema>

export async function upsertSettings(
  payload: SettingsPayload,
): Promise<{ error?: string }> {
  try {
    const data = settingsSchema.parse(payload)
    const supabase = await createClient()

    const { data: existing } = await supabase.from('settings').select('id').maybeSingle()

    const row = {
      nome_loja: data.nome_loja,
      whatsapp_number: data.whatsapp_number,
      mensagem_boas_vindas: data.mensagem_boas_vindas ?? null,
      formas_pagamento: data.formas_pagamento,
    }

    if (existing?.id) {
      const { error } = await supabase.from('settings').update(row).eq('id', existing.id)
      if (error) return { error: error.message }
    } else {
      const { error } = await supabase.from('settings').insert(row)
      if (error) return { error: error.message }
    }

    revalidatePath('/admin/configuracoes')
    revalidatePath('/')
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro ao salvar configurações.' }
  }
}
