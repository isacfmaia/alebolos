'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { formatBRL } from '@/lib/utils/order'
import { SearchInput } from '@/components/admin/SearchInput'

export type CustomerWithOrders = {
  id: string
  nome: string
  whatsapp: string
  created_at: string
  orders: Array<{ id: string; total: number; created_at: string; status: string }>
}

type Props = {
  customers: CustomerWithOrders[]
}

export function ClientesPageClient({ customers }: Props) {
  const [query, setQuery] = useState('')

  // Filtragem client-side: nome (case-insensitive) ou WhatsApp (compara só
  // dígitos, então "(11) 9999" casa com "11999990000" salvo no banco).
  const filteredCustomers = useMemo(() => {
    const q = query.trim()
    if (!q) return customers

    const qLower = q.toLowerCase()
    const qDigits = q.replace(/\D/g, '')

    return customers.filter((c) => {
      const nameMatch = c.nome.toLowerCase().includes(qLower)
      const phoneMatch = qDigits && c.whatsapp.includes(qDigits)
      return nameMatch || phoneMatch
    })
  }, [customers, query])

  const isSearching = query.trim().length > 0

  return (
    <div>
      {/* ── Page header ───────────────────────────────────── */}
      <header className="mb-8">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-rose/80">
          Operação
        </p>
        <h1 className="font-heading text-4xl font-semibold leading-none tracking-tight text-brand-brown">
          Clientes
        </h1>
        <p className="mt-2 text-sm text-brand-brown/60">
          {isSearching
            ? `${filteredCustomers.length} de ${customers.length} ${customers.length === 1 ? 'cliente' : 'clientes'}`
            : `${customers.length} ${customers.length === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}`}
        </p>
      </header>

      {/* ── Busca ────────────────────────────────────────── */}
      {customers.length > 0 && (
        <div className="mb-4">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Buscar por nome ou telefone…"
            ariaLabel="Buscar clientes"
          />
        </div>
      )}

      {customers.length === 0 ? (
        <EmptyState
          title="Nenhum cliente ainda"
          description="Os clientes são cadastrados automaticamente ao realizar um pedido."
        />
      ) : filteredCustomers.length === 0 ? (
        <EmptyState
          title="Nenhum resultado"
          description="Nenhum cliente corresponde à sua busca. Tente outro nome ou telefone."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-brand-brown/8 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-brown/8 bg-brand-cream/50">
                  <th className="px-5 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.1em] text-brand-brown/60">
                    Cliente
                  </th>
                  <th className="px-5 py-3 text-center text-[10.5px] font-semibold uppercase tracking-[0.1em] text-brand-brown/60">
                    Pedidos
                  </th>
                  <th className="px-5 py-3 text-right text-[10.5px] font-semibold uppercase tracking-[0.1em] text-brand-brown/60">
                    Total gasto
                  </th>
                  <th className="px-5 py-3 text-right text-[10.5px] font-semibold uppercase tracking-[0.1em] text-brand-brown/60">
                    Último pedido
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-brown/6">
                {filteredCustomers.map((customer) => {
                  const nonCancelled = customer.orders.filter((o) => o.status !== 'cancelado')
                  const totalSpent = nonCancelled.reduce((s, o) => s + o.total, 0)
                  const lastOrder = customer.orders.sort(
                    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
                  )[0]

                  const initials = customer.nome
                    .split(' ')
                    .map((s) => s[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()

                  return (
                    <tr key={customer.id} className="transition-colors hover:bg-brand-cream/30">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-cream-dark ring-1 ring-brand-brown/8">
                            <span className="text-[11px] font-semibold text-brand-brown">
                              {initials}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[14px] font-semibold tracking-tight text-brand-brown">
                              {customer.nome}
                            </p>
                            <p className="mt-0.5 text-[11.5px] font-medium tabular-nums text-brand-brown/50">
                              {customer.whatsapp}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-md bg-brand-cream-dark/60 px-2 text-[11.5px] font-bold tabular-nums text-brand-brown">
                          {customer.orders.length}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-heading text-[15px] font-semibold tabular-nums tracking-tight text-brand-brown">
                        {formatBRL(totalSpent)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {lastOrder ? (
                          <Link
                            href={`/admin/pedidos/${lastOrder.id}`}
                            className="text-[12px] font-medium text-brand-brown/65 transition-colors hover:text-brand-rose hover:underline"
                          >
                            {new Date(lastOrder.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit',
                            })}
                          </Link>
                        ) : (
                          <span className="text-brand-brown/35">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-brand-brown/8 bg-white py-20 text-center shadow-card">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-rose/8 ring-1 ring-brand-rose/15">
        <Users className="h-9 w-9 text-brand-rose/55" strokeWidth={1.5} />
      </div>
      <h2 className="font-heading text-2xl font-semibold tracking-tight text-brand-brown">
        {title}
      </h2>
      <p className="mt-2 max-w-xs text-sm text-brand-brown/60">{description}</p>
    </div>
  )
}
