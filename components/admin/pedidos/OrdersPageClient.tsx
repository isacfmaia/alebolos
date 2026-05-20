'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatBRL } from '@/lib/utils/order'
import { ORDER_STATUS_LABELS, ORDER_STATUS_LIST, type OrderStatus } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import type { VariantProps } from 'class-variance-authority'
import type { badgeVariants } from '@/components/ui/badge'
import { ChevronRight, ShoppingBag } from 'lucide-react'
import { SearchInput } from '@/components/admin/SearchInput'

type OrderWithCustomer = {
  id: string
  numero: number
  status: string
  forma_pagamento: string
  total: number
  created_at: string
  customers: { id: string; nome: string; whatsapp: string } | null
}

type Props = {
  orders: OrderWithCustomer[]
  activeStatus: OrderStatus | null
}

function statusVariant(status: string): VariantProps<typeof badgeVariants>['variant'] {
  switch (status) {
    case 'concluido': return 'success'
    case 'cancelado': return 'destructive'
    case 'realizado': return 'secondary'
    default: return 'default'
  }
}

export function OrdersPageClient({ orders, activeStatus }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const setFilter = (status: OrderStatus | null) => {
    const url = status ? `/admin/pedidos?status=${status}` : '/admin/pedidos'
    router.push(url)
  }

  // Filtragem client-side: nome (case-insensitive), WhatsApp (compara só
  // dígitos, então "(11) 9999" casa com "11999990000") e número do pedido
  // (aceita "#42" ou "42"). A busca trabalha sobre o resultado já filtrado
  // por status pelo servidor.
  const filteredOrders = useMemo(() => {
    const q = query.trim()
    if (!q) return orders

    const qLower = q.toLowerCase()
    const qDigits = q.replace(/\D/g, '')

    return orders.filter((order) => {
      const nameMatch = order.customers?.nome.toLowerCase().includes(qLower)
      const phoneMatch = qDigits && order.customers?.whatsapp.includes(qDigits)
      const numberMatch = qDigits && String(order.numero) === qDigits
      return nameMatch || phoneMatch || numberMatch
    })
  }, [orders, query])

  const isSearching = query.trim().length > 0

  return (
    <div>
      {/* ── Page header ───────────────────────────────────── */}
      <header className="mb-8">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-rose/80">
          Operação
        </p>
        <h1 className="font-heading text-4xl font-semibold leading-none tracking-tight text-brand-brown">
          Pedidos
        </h1>
        <p className="mt-2 text-sm text-brand-brown/60">
          {isSearching
            ? `${filteredOrders.length} de ${orders.length} ${orders.length === 1 ? 'pedido' : 'pedidos'}`
            : `${orders.length} ${orders.length === 1 ? 'pedido' : 'pedidos'}`}
          {activeStatus ? ` · filtrado por "${ORDER_STATUS_LABELS[activeStatus]}"` : ''}
        </p>
      </header>

      {/* ── Busca ────────────────────────────────────────── */}
      <div className="mb-4">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Buscar por nome, telefone ou número do pedido…"
          ariaLabel="Buscar pedidos"
        />
      </div>

      {/* ── Filtros por status ────────────────────────────── */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        <FilterChip
          label="Todos"
          active={!activeStatus}
          onClick={() => setFilter(null)}
        />
        {ORDER_STATUS_LIST.map((s) => (
          <FilterChip
            key={s}
            label={ORDER_STATUS_LABELS[s]}
            active={activeStatus === s}
            onClick={() => setFilter(s)}
          />
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-brand-brown/8 bg-white py-20 text-center shadow-card">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-rose/8 ring-1 ring-brand-rose/15">
            <ShoppingBag className="h-9 w-9 text-brand-rose/55" strokeWidth={1.5} />
          </div>
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-brand-brown">
            {isSearching ? 'Nenhum resultado' : 'Nenhum pedido'}
          </h2>
          <p className="mt-2 max-w-xs text-sm text-brand-brown/60">
            {isSearching
              ? 'Nenhum pedido corresponde à sua busca. Tente outro nome, telefone ou número.'
              : activeStatus
                ? 'Nenhum pedido com esse status no momento.'
                : 'Os pedidos vão aparecer aqui assim que chegarem.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-brand-brown/8 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-brown/8 bg-brand-cream/50">
                  <TH>Pedido</TH>
                  <TH>Cliente</TH>
                  <TH>Data</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Total</TH>
                  <th className="w-8 px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-brown/6">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="group cursor-pointer transition-colors hover:bg-brand-cream/30"
                    onClick={() => router.push(`/admin/pedidos/${order.id}`)}
                  >
                    <td className="px-5 py-4">
                      <span className="font-heading text-[15px] font-semibold tabular-nums tracking-tight text-brand-brown">
                        #{order.numero}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-[14px] font-semibold tracking-tight text-brand-brown">
                        {order.customers?.nome ?? '—'}
                      </p>
                      <p className="mt-0.5 text-[11.5px] font-medium tabular-nums text-brand-brown/50">
                        {order.customers?.whatsapp}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-[12.5px] font-medium tabular-nums text-brand-brown/65">
                      {new Date(order.created_at).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={statusVariant(order.status)}>
                        {ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right font-heading text-[15px] font-semibold tabular-nums tracking-tight text-brand-brown">
                      {formatBRL(order.total)}
                    </td>
                    <td className="px-5 py-4 pr-5 text-brand-brown/30 transition-colors group-hover:text-brand-brown/60">
                      <ChevronRight className="h-4 w-4" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Sub-componentes ─────────────────────────────────────── */

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'rounded-full px-3.5 py-1.5 text-[12px] font-semibold tracking-tight transition-all duration-150',
        active
          ? 'bg-brand-brown text-white shadow-card'
          : 'border border-brand-brown/12 bg-white text-brand-brown/70 hover:border-brand-brown/25 hover:text-brand-brown',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

function TH({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={[
        'px-5 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.1em] text-brand-brown/60',
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </th>
  )
}
