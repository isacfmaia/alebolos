import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

/**
 * Route handler de autenticação do admin.
 *
 * Recebe { email, password } no body, valida com o Supabase Auth via
 * signInWithPassword, e em caso de sucesso grava o cookie httpOnly da sessão
 * no response. Aplica rate limit por IP para mitigar tentativas de
 * força bruta.
 */

// ─────────────────────────────────────────────────────────────
// Rate limiter em memória — janela deslizante por IP.
// Estrutura: Map<ip, { count, windowStart }>.
//
// LIMITAÇÃO: por ser em memória, não funciona em deploys multi-instância
// (cada instância tem seu próprio Map). Para produção em escala, trocar por
// Redis/Upstash. Para a confeitaria atual com 1 instância, é suficiente.
// ─────────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; windowStart: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutos

/** Extrai o IP real do cliente, considerando proxies (Vercel, Nginx, etc.). */
function getClientIp(req: NextRequest): string {
  return (
    // x-forwarded-for pode trazer cadeia "client, proxy1, proxy2" — pegamos o primeiro.
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

/**
 * Decide se a requisição atual pode prosseguir.
 * - Janela expirada ou IP novo → reseta contador e libera.
 * - Atingiu o teto na janela atual → bloqueia e informa quanto falta.
 * - Caso contrário → incrementa contador e libera.
 */
function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now })
    return { allowed: true, retryAfterMs: 0 }
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfterMs = WINDOW_MS - (now - entry.windowStart)
    return { allowed: false, retryAfterMs }
  }

  entry.count += 1
  return { allowed: true, retryAfterMs: 0 }
}

export async function POST(request: NextRequest) {
  // 1. Rate limit por IP — protege contra força bruta de senha.
  const ip = getClientIp(request)
  const { allowed, retryAfterMs } = checkRateLimit(ip)

  if (!allowed) {
    const retryAfterSec = Math.ceil(retryAfterMs / 1000)
    return NextResponse.json(
      {
        error: `Muitas tentativas. Tente novamente em ${Math.ceil(retryAfterSec / 60)} minuto(s).`,
      },
      {
        status: 429,
        // Header padrão HTTP — clientes bem-comportados respeitam.
        headers: { 'Retry-After': String(retryAfterSec) },
      },
    )
  }

  // 2. Valida o corpo da requisição. Try/catch porque request.json()
  // lança em payload malformado.
  let body: { email?: unknown; password?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 })
  }

  // typeof check defensivo — body.email pode ser qualquer coisa
  // (number, objeto, etc.) e queremos rejeitar antes de chamar Supabase.
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!email || !password) {
    return NextResponse.json({ error: 'Email e senha são obrigatórios.' }, { status: 400 })
  }

  // 3. Prepara o response. Os cookies setados pelo Supabase serão anexados aqui.
  const response = NextResponse.json({ ok: true })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Set cookies no response — assim o browser recebe o cookie httpOnly
          // da sessão e o proxy passa a reconhecer o usuário.
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // 4. Tenta autenticar contra o Supabase.
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Mensagem genérica intencional: não revela se o email existe
    // (mitiga enumeração de contas).
    return NextResponse.json({ error: 'Email ou senha incorretos.' }, { status: 401 })
  }

  // 5. Login bem-sucedido — reseta o contador desse IP. Caso contrário,
  // um usuário legítimo que errou 4× a senha ficaria "marcado" pelos 15 min.
  rateLimitMap.delete(ip)

  return response
}
