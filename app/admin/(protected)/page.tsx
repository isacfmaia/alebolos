import { createClient } from '@/lib/supabase/server'
import { formatBRL } from '@/lib/utils/order'
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ShoppingBag, TrendingUp, Clock, Users, ArrowUpRight } from 'lucide-react'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const [
    { data: orders },
    { count: customerCount },
    { data: orderItems },
  ] = await Promise.all([
    supabase.from('orders').select('id, numero, status, total, created_at, customers(nome)'),
    supabase.from('customers').select('id', { count: 'exact', head: true }),
    supabase.from('order_items').select('nome, quantidade'),
  ])

  const allOrders = orders ?? []
  const nonCancelled = allOrders.filter((o) => o.status !== 'cancelado')
  const totalRevenue = nonCancelled.reduce((s, o) => s + o.total, 0)

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const ordersThisMonth = allOrders.filter(
    (o) => new Date(o.created_at) >= startOfMonth,
  ).length

  const activeOrders = allOrders.filter(
    (o) => !['concluido', 'cancelado'].includes(o.status),
  ).length

  const statusCounts = allOrders.reduce(
    (acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const topProducts = Object.entries(
    (orderItems ?? []).reduce(
      (acc, item) => {
        acc[item.nome] = (acc[item.nome] ?? 0) + item.quantidade
        return acc
      },
      {} as Record<string, number>,
    ),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const recentOrders = [...allOrders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  function statusVariant(status: string) {
    switch (status) {
      case 'concluido': return 'success' as const
      case 'cancelado': return 'destructive' as const
      case 'realizado': return 'secondary' as const
      default: return 'default' as const
    }
  }

  const formattedDate = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div>
      {/* ── Page header ───────────────────────────────────── */}
      <header className="mb-8">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-rose/80">
          {formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
        </p>
        <h1 className="font-heading text-4xl font-semibold leading-none tracking-tight text-brand-brown">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-brand-brown/60">
          Visão geral do negócio em tempo real.
        </p>
      </header>

      {/* ── Stat cards ─────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          tone="rose"
          label="Receita total"
          value={formatBRL(totalRevenue)}
          sub="pedidos não cancelados"
        />
        <StatCard
          icon={ShoppingBag}
          tone="orange"
          label="Pedidos este mês"
          value={String(ordersThisMonth)}
          sub={`${allOrders.length} no total`}
        />
        <StatCard
          icon={Clock}
          tone="gold"
          label="Em andamento"
          value={String(activeOrders)}
          sub="aguardando conclusão"
        />
        <StatCard
          icon={Users}
          tone="brown"
          label="Clientes"
          value={String(customerCount ?? 0)}
          sub="cadastrados"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {/* ── Pedidos por status ─────────────────────────── */}
        <SectionCard title="Pedidos por status">
          {Object.keys(statusCounts).length === 0 ? (
            <EmptyHint>Nenhum pedido ainda.</EmptyHint>
          ) : (
            <ul className="space-y-1.5">
              {Object.entries(statusCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => (
                  <li key={status}>
                    <Link
                      href={`/admin/pedidos?status=${status}`}
                      className="group flex items-center justify-between rounded-lg px-2 py-1.5 -mx-2 transition-colors hover:bg-brand-cream"
                    >
                      <span className="text-sm font-medium text-brand-brown/85 group-hover:text-brand-brown">
                        {ORDER_STATUS_LABELS[status as OrderStatus] ?? status}
                      </span>
                      <span className="rounded-md bg-brand-cream-dark/60 px-2 py-0.5 text-[11px] font-bold tabular-nums text-brand-brown">
                        {count}
                      </span>
                    </Link>
                  </li>
                ))}
            </ul>
          )}
        </SectionCard>

        {/* ── Top produtos ───────────────────────────────── */}
        <SectionCard title="Top 5 produtos">
          {topProducts.length === 0 ? (
            <EmptyHint>Nenhum pedido ainda.</EmptyHint>
          ) : (
            <ol className="space-y-2">
              {topProducts.map(([nome, qty], i) => (
                <li key={nome} className="flex items-center gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-brand-cream-dark/60 text-[10px] font-bold tabular-nums text-brand-brown/70">
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate text-sm font-medium text-brand-brown">
                    {nome}
                  </span>
                  <span className="text-xs font-bold tabular-nums text-brand-rose">
                    {qty}×
                  </span>
                </li>
              ))}
            </ol>
          )}
        </SectionCard>

        {/* ── Pedidos recentes ───────────────────────────── */}
        <div className="rounded-2xl border border-brand-brown/8 bg-white shadow-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-brand-brown/8 px-6 py-4">
            <h2 className="font-heading text-lg font-semibold tracking-tight text-brand-brown">
              Últimos pedidos
            </h2>
            <Link
              href="/admin/pedidos"
              className="group inline-flex items-center gap-1 text-xs font-semibold text-brand-rose transition-colors hover:text-brand-rose-dark"
            >
              Ver todos
              <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="px-6 py-8">
              <EmptyHint>Nenhum pedido ainda.</EmptyHint>
            </div>
          ) : (
            <ul className="divide-y divide-brand-brown/6">
              {recentOrders.map((order) => {
                const cust = order.customers as { nome: string } | null
                return (
                  <li key={order.id}>
                    <Link
                      href={`/admin/pedidos/${order.id}`}
                      className="flex items-center justify-between gap-4 px-6 py-3.5 transition-colors hover:bg-brand-cream/40"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <span className="flex h-8 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-cream-dark/50 text-[11px] font-bold tabular-nums text-brand-brown">
                          #{order.numero}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold tracking-tight text-brand-brown">
                            {cust?.nome ?? '—'}
                          </p>
                          <p className="mt-0.5 text-[11px] font-medium text-brand-brown/50">
                            {new Date(order.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant={statusVariant(order.status)}>
                          {ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status}
                        </Badge>
                        <span className="text-sm font-bold tabular-nums text-brand-brown">
                          {formatBRL(order.total)}
                        </span>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Sub-componentes editoriais ─────────────────────────── */

const TONE_STYLES = {
  rose:   { bg: 'bg-brand-rose/10',   text: 'text-brand-rose'   },
  orange: { bg: 'bg-brand-orange/12', text: 'text-brand-orange' },
  gold:   { bg: 'bg-brand-gold/18',   text: 'text-amber-700'    },
  brown:  { bg: 'bg-brand-brown/8',   text: 'text-brand-brown'  },
} as const

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = 'rose',
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub: string
  tone?: keyof typeof TONE_STYLES
}) {
  const t = TONE_STYLES[tone]
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-brand-brown/8 bg-white p-5 shadow-card transition-all duration-200 hover:shadow-elev hover:-translate-y-px">
      <div className="mb-4 flex items-center justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${t.bg}`}>
          <Icon className={`h-[18px] w-[18px] ${t.text}`} />
        </div>
      </div>
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-brand-brown/55">
        {label}
      </p>
      <p className="mt-1.5 font-heading text-[28px] font-semibold leading-none tracking-tight tabular-nums text-brand-brown">
        {value}
      </p>
      <p className="mt-1.5 text-[12px] font-medium text-brand-brown/50">
        {sub}
      </p>
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-brand-brown/8 bg-white p-6 shadow-card">
      <h2 className="mb-4 font-heading text-lg font-semibold tracking-tight text-brand-brown">
        {title}
      </h2>
      {children}
    </div>
  )
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium text-brand-brown/50">{children}</p>
}
