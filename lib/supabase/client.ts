'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

/**
 * Cliente Supabase para uso em Client Components (browser).
 *
 * Usa a anon key — segura para expor ao browser, pois o RLS no banco
 * impõe o controle de acesso. Lê/escreve cookies da sessão automaticamente.
 *
 * Use este em: components com 'use client' que precisam falar com o Supabase
 * direto do navegador (ex: upload de imagem para o Storage).
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
