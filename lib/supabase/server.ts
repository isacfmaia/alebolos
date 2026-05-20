import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

/**
 * Cliente Supabase para uso server-side (Server Components, Route Handlers,
 * Server Actions). Lê a sessão dos cookies httpOnly da requisição atual.
 *
 * Usa a anon key — respeita o RLS do banco. Para operações que precisam
 * bypassar RLS (ex: criar pedido público), use `createServiceClient()`.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Server Components não conseguem setar cookies — ignorar.
            // Cookies de sessão são gerenciados em Route Handlers/Server Actions.
          }
        },
      },
    },
  )
}
