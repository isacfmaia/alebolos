# Práticas de Segurança

## Autenticação

- **Supabase Auth** com e-mail + senha via `signInWithPassword`.
- As sessões são armazenadas em **cookies httpOnly** gerenciados pelo `@supabase/ssr` — nunca em `localStorage` nem acessíveis ao JavaScript.
- A validação da sessão acontece **no servidor** a cada requisição admin: tanto o `proxy.ts` (via `supabase.auth.getUser()`) quanto o `app/admin/layout.tsx` verificam a sessão de forma independente. O estado do cliente nunca é a única fonte de verdade.
- O formulário de login envia para um Route Handler (`/admin/api/auth`), então a senha nunca trafega pelo estado do cliente além do campo do form.

## Rate Limiting

- O endpoint de login (`POST /admin/api/auth`) aplica **5 tentativas por IP a cada 15 minutos**.
- Ao exceder, retorna HTTP 429 com header `Retry-After`.
- Login bem-sucedido reseta o contador daquele IP.
- O estado do rate limit é em memória (Map). Para deploys multi-instância, substituir por Redis ou Upstash.

## Sanitização de Entrada

- Todos os inputs de formulários são validados com **Zod** antes do uso (type coercion, `.trim()`, `.toLowerCase()` no e-mail).
- O Route Handler de auth valida `typeof` antes de aceitar valores string — rejeita corpos JSON malformados.
- O cliente Supabase faz parameterização SQL internamente — nenhuma interpolação de query crua em lugar algum.

## Cabeçalhos de Segurança (next.config.ts)

| Cabeçalho | Valor |
|---|---|
| `Content-Security-Policy` | `default-src 'self'`; restringe scripts, estilos, fontes, imagens e conexões; `frame-ancestors 'none'` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | câmera, microfone e geolocalização desabilitados |

Observação: `X-Frame-Options` foi omitido intencionalmente — `frame-ancestors 'none'` no CSP é o equivalente moderno e o substitui.

## Gestão de Chaves

- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` podem ser expostas ao browser com segurança (são read-only, com RLS impondo o controle de acesso).
- `SUPABASE_SERVICE_ROLE_KEY` **nunca deve aparecer em bundles client-side**. É usada apenas em código server-side (Route Handlers, Server Actions). Verificado garantindo que nenhum arquivo `'use client'` a importe.
- `.env.local` está no `.gitignore` — segredos nunca são commitados.

## Logout

- O logout chama `supabase.auth.signOut()` no servidor via `POST /admin/api/logout`, invalidando a sessão e limpando o cookie de auth via cabeçalhos `Set-Cookie`.

## Segurança de Dependências

Rode `pnpm audit` regularmente. Mantenha `@supabase/ssr`, `next` e `react` atualizados.
