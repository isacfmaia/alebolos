<div align="center">

<img src="public/alebolos-logo.jpeg" alt="Bolos da Alê" width="140" />

# Bolos da Alê

Cardápio digital com pedidos via WhatsApp para uma confeitaria artesanal.

[![Next.js](https://img.shields.io/badge/Next.js-16.2-000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)

</div>

---

## Sobre

**Bolos da Alê** é um cardápio digital para venda de bolos artesanais, doces e encomendas pelo WhatsApp. O cliente navega pelo catálogo, adiciona produtos ao carrinho e finaliza o pedido enviando uma mensagem pré-formatada para a loja.

O painel administrativo permite gerenciar produtos, categorias, clientes, configurações da loja e acompanhar pedidos por status.

## Funcionalidades

- Cardápio responsivo com filtro por categoria.
- Carrinho persistente no navegador.
- Produtos de pronta entrega ou sob encomenda com prazo.
- Checkout via WhatsApp com mensagem formatada.
- Página pública de acompanhamento do pedido.
- Admin autenticado com dashboard, produtos, categorias, clientes, pedidos e configurações.
- SEO com sitemap, robots, Open Graph dinâmico, manifest e JSON-LD.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16, App Router, React 19 e Turbopack |
| Linguagem | TypeScript 5 |
| Estilo | Tailwind CSS v4 com tema via CSS variables |
| UI | shadcn/ui, Base UI e Lucide |
| Banco, Auth e Storage | Supabase |
| Forms e validação | React Hook Form e Zod |
| Estado global | Zustand |
| Deploy | Vercel |

## Estrutura

```text
alebolos/
├── app/                         # Rotas, layouts, metadata e Server Actions
├── components/                  # UI do catálogo, admin e componentes base
├── lib/                         # SEO, Supabase, store e utilitários
├── public/                      # Assets públicos da marca
├── supabase/schema.sql          # Schema completo do banco
├── types/                       # Tipos compartilhados
├── proxy.ts                     # Proteção das rotas admin
└── next.config.ts               # Configuração Next.js
```

## Primeiros Passos

### Pré-requisitos

- Node.js 20.9 ou superior.
- npm.
- Projeto Supabase configurado.

### Instalação

```bash
git clone https://github.com/isacfmaia/alebolos.git
cd alebolos
npm install
```

### Supabase

1. Crie um projeto no Supabase.
2. Execute [`supabase/schema.sql`](supabase/schema.sql) no SQL Editor.
3. Confirme que o bucket público `product-images` foi criado.
4. Crie o primeiro usuário admin em Authentication > Users.
5. Copie as chaves em Settings > API.

### Variáveis de Ambiente

Copie `.env.example` para `.env.local` e preencha:

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública anon |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role, somente server-side |
| `NEXT_PUBLIC_BASE_URL` | URL pública, exemplo `https://alebolos.vercel.app` |

### Desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). O painel admin fica em `/admin`.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
npm run format
npm run format:check
```

## Deploy

O projeto está preparado para deploy na Vercel. Pushes na branch `main` disparam deploy de produção quando o projeto Vercel está conectado ao repositório GitHub.

Variáveis obrigatórias em Production na Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_BASE_URL`

## Segurança

Veja [SECURITY.md](SECURITY.md). O projeto usa cookies httpOnly para sessão, validação server-side, RLS no Supabase, service role isolada no servidor e headers de segurança no Next.js.

## Autor

Isac Maia

- GitHub: [@isacfmaia](https://github.com/isacfmaia)
- Email: isacfmaia@gmail.com
