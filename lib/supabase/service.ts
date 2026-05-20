import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Cliente Supabase com `service_role` — bypassa TODAS as policies de RLS.
 *
 * ⚠️ USAR COM CUIDADO. A service_role key dá acesso total ao banco.
 *
 * Casos de uso legítimos:
 *  - Server Actions PÚBLICAS que precisam escrever em tabelas protegidas
 *    (ex: criar pedido sem login do cliente).
 *  - Operações administrativas que precisam ler dados de todos os usuários.
 *
 * Nunca use isso em código que rode no browser ('use client'). A chave
 * está apenas em SUPABASE_SERVICE_ROLE_KEY (sem prefixo NEXT_PUBLIC_),
 * então o Next.js não a inclui em bundles client-side.
 */
export function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}
