<div align="center">

<img src="public/logo_new.svg" alt="Sabor e Afeto" width="100" />

# Sabor e Afeto

**Cardápio digital com pedidos via WhatsApp para uma confeitaria artesanal.**

[![Next.js](https://img.shields.io/badge/Next.js-16.2-000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

</div>

---

## Sumário

- [Sobre o projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Stack](#%EF%B8%8F-stack)
- [Estrutura do projeto](#-estrutura-do-projeto)
- [Primeiros passos](#-primeiros-passos)
- [Scripts disponíveis](#-scripts-disponíveis)
- [Segurança](#-segurança)
- [Roadmap](#%EF%B8%8F-roadmap)
- [Licença](#-licença)
- [Autor](#-autor)

---

## ✨ Sobre o projeto

**Sabor e Afeto** é um cardápio digital pensado para confeitarias e pequenos negócios que recebem pedidos pelo WhatsApp. O cliente navega no catálogo, monta o pedido em um carrinho e é redirecionado para o WhatsApp da loja com a mensagem pré-formatada — **sem pagamento online**, apenas encomenda.

O painel administrativo permite gerenciar produtos, categorias, clientes e acompanhar o ciclo de vida dos pedidos (do "Realizado" ao "Concluído"), tudo com responsividade total e UI moderna.

> **Por que?** Substituir o processo manual de receber pedidos por mensagem solta, ter histórico organizado e oferecer um link bonito de cardápio para divulgar nas redes.

---

## 🎯 Funcionalidades

### Cliente (público)

- 🍰 Cardápio responsivo com filtro por categoria
- 🛒 Carrinho persistente (mantém os itens mesmo se a aba fechar)
- ⏱️ Identificação de produtos de pronta entrega vs sob encomenda (com prazo)
- 📱 Checkout que abre o WhatsApp da loja com mensagem formatada
- 🔗 Página pública de **acompanhamento do pedido** (timeline de status)
- 🔍 SEO completo (sitemap, robots, Open Graph dinâmico, JSON-LD `Bakery`)

### Admin (autenticado)

- 📊 Dashboard com visão geral do negócio
- 📦 **Produtos** — CRUD completo com upload de imagem para o Supabase Storage
- 🏷️ **Categorias** — organização do cardápio com drag-to-reorder
- 👥 **Clientes** — lista com histórico de pedidos e total gasto
- 🧾 **Pedidos** — kanban-like com mudança de status e auditoria de histórico
- 🔍 Busca em tempo real em todas as listas (nome, telefone, número, descrição)
- ⚙️ Configurações da loja (nome, WhatsApp, formas de pagamento, mensagem de boas-vindas)
- 📱 Sidebar responsiva com drawer mobile

---

## 🛠️ Stack

| Camada | Tecnologia |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router + React 19 + Turbopack) |
| **Linguagem** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Estilo** | [Tailwind CSS v4](https://tailwindcss.com/) (sem `tailwind.config.js`, tema via CSS vars) |
| **UI** | [shadcn/ui](https://ui.shadcn.com/) (preset `base-nova` / [Base UI](https://base-ui.com/)) + [Lucide](https://lucide.dev/) |
| **Banco & Auth** | [Supabase](https://supabase.com/) (Postgres + Auth + Storage) |
| **Validação** | [Zod 4](https://zod.dev/) |
| **Forms** | [React Hook Form](https://react-hook-form.com/) |
| **Estado global** | [Zustand](https://zustand.docs.pmnd.rs/) (carrinho persistente) |
| **Notificações** | [Sonner](https://sonner.emilkowal.ski/) |
| **Qualidade** | ESLint 9 (flat config), Prettier 3 |

---

## 📁 Estrutura do projeto

```
saboreafeto/
├── app/                          # App Router (rotas + actions)
│   ├── (rota pública)
│   ├── acompanhar/[orderId]/     # Rastreamento de pedido (público com UUID)
│   ├── actions/                  # Server Actions
│   └── admin/
│       ├── (protected)/          # Área protegida — sidebar + páginas
│       ├── api/                  # Route handlers (auth, logout)
│       └── login/
├── components/
│   ├── admin/                    # UI exclusiva do admin
│   ├── catalog/                  # UI do cardápio público
│   └── ui/                       # shadcn/ui + componentes próprios
├── lib/
│   ├── seo/                      # Constantes de SEO/identidade
│   ├── store/                    # Zustand (carrinho)
│   ├── supabase/                 # client / server / service
│   └── utils/                    # Helpers (image, order, cn)
├── supabase/
│   └── schema.sql                # DDL completo (rodar no SQL Editor)
├── types/                        # Tipos compartilhados (Database, Order…)
├── proxy.ts                      # Auth proxy do Next.js 16
└── next.config.ts                # Headers de segurança + remotePatterns
```

---

## 🚀 Primeiros passos

### Pré-requisitos

- **Node.js** ≥ 20.9
- **npm** (ou pnpm/yarn — o lock file é npm)
- Uma conta gratuita no **[Supabase](https://supabase.com/)**

### 1. Clonar e instalar

```bash
git clone https://github.com/<seu-usuario>/saboreafeto.git
cd saboreafeto
npm install
```

### 2. Configurar o Supabase

1. Crie um novo projeto em [supabase.com](https://supabase.com).
2. No painel, vá em **SQL Editor** e cole o conteúdo de [`supabase/schema.sql`](supabase/schema.sql). Execute.
3. Em **Storage**, confirme que o bucket `product-images` foi criado e está público.
4. Em **Authentication → Users**, crie o primeiro usuário admin (e-mail + senha).
5. Em **Settings → API**, copie as três chaves que você vai usar a seguir.

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha o `.env.local`:

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública (anon) — pode ir pro browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de service role — **NUNCA** no client |
| `NEXT_PUBLIC_BASE_URL` | URL pública (ex: `https://saboreafeto.com`) |

### 4. Rodar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

O painel admin fica em [http://localhost:3000/admin](http://localhost:3000/admin).

---

## 📜 Scripts disponíveis

```bash
npm run dev          # servidor de desenvolvimento (Turbopack)
npm run build        # build de produção
npm run start        # servidor de produção (após build)
npm run lint         # checar ESLint
npm run lint:fix     # corrigir erros de lint automaticamente
npm run format       # formatar com Prettier
npm run format:check # checar formatação
```

### Adicionar componentes shadcn/ui

```bash
npx shadcn@latest add <componente>
# exemplos:
npx shadcn@latest add card
npx shadcn@latest add dropdown-menu
```

---

## 🔒 Segurança

A documentação completa de práticas de segurança está em [SECURITY.md](SECURITY.md). Resumo:

- ✅ Sessões em **cookies httpOnly** (nunca em `localStorage`)
- ✅ Validação dupla server-side (proxy + layout)
- ✅ **Rate limit** no endpoint de login (5 tentativas / 15min por IP)
- ✅ Validação **Zod no servidor** para todo Server Action público
- ✅ Recálculo server-side de preço/total no checkout (cliente envia só `id + qtd`)
- ✅ Headers de segurança configurados (CSP, HSTS, X-Content-Type-Options, etc.)
- ✅ Row Level Security (RLS) habilitado em todas as tabelas
- ✅ Service role isolada em código exclusivamente server-side

---

## 🗺️ Roadmap

- [ ] Suporte a múltiplos admins com permissões diferenciadas
- [ ] Notificações push para novos pedidos (PWA)
- [ ] Integração com gateway de pagamento (PIX in-app)
- [ ] Dashboard com métricas (ticket médio, top produtos, clientes recorrentes)
- [ ] Migrations versionadas via Supabase CLI
- [ ] Testes E2E com Playwright
- [ ] Rate limiter externo (Upstash Redis) para multi-instância

---

## 📄 Licença

Distribuído sob a licença MIT. Veja [`LICENSE`](LICENSE) para mais informações.

---

## 👤 Autor

**Isac Maia**

- GitHub: [@isacfmaia](https://github.com/isacfmaia)
- Email: isacfmaia@gmail.com

---

<div align="center">

Feito com 💛 e muito café

</div>
