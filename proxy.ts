import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Proxy de autenticação para o painel admin.
 *
 * Responsabilidades:
 *  - Validar a sessão Supabase server-side em toda rota /admin/*
 *  - Redirecionar usuários não autenticados para /admin/login
 *  - Redirecionar usuários já logados para fora de /admin/login
 *  - Deixar as rotas /admin/api/* passarem livres (cada uma cuida da própria auth)
 *
 * IMPORTANTE: a confiança fica server-side. O estado do cliente
 * (localStorage, cookies acessíveis ao JS) NUNCA é tratado como fonte de verdade.
 *
 * Nota: a partir do Next.js 16 o arquivo `middleware.ts` foi renomeado
 * para `proxy.ts` (a função também passou a se chamar `proxy`).
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  // Cliente Supabase com gestão de cookies sincronizada entre request/response.
  // Necessário para refresh automático da sessão.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const { pathname } = request.nextUrl

  // Rotas de API admin cuidam da própria autenticação (login, logout, etc.) —
  // nunca devem ser bloqueadas aqui, senão o login fica inacessível.
  if (pathname.startsWith('/admin/api/')) {
    return response
  }

  // Valida a sessão no servidor — getUser() verifica o token JWT contra o
  // Supabase Auth. Nunca confiar apenas em estado do cliente.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Acessou rota admin protegida sem sessão → redireciona para login
  // preservando o destino original em ?redirectTo=...
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!user) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/admin/login'
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Usuário já autenticado tentou acessar /admin/login → manda direto pro
  // dashboard, evitando UX confusa de pedir login de quem já está logado.
  if (pathname === '/admin/login' && user) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/admin'
    dashboardUrl.searchParams.delete('redirectTo')
    return NextResponse.redirect(dashboardUrl)
  }

  return response
}

// O proxy roda apenas em rotas admin — economiza overhead nas demais.
export const config = {
  matcher: ['/admin/:path*'],
}
