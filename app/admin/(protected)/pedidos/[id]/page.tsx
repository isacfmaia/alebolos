import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatBRL } from '@/lib/utils/order'
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { OrderStatusChanger } from '@/components/admin/pedidos/OrderStatusChanger'
import { ArrowLeft, ExternalLink, User, ListChecks, History, LinkIcon } from 'lucide-react'

type Props = { params: Promise<{ id: string }> }

function statusVariant(status: string) {
  switch (status) {
    case 'concluido': return 'success' as const
    case 'cancelado': return 'destructive' as const
    case 'realizado': return 'secondary' as const
    default: return 'default' as const
  }
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*, customers(id, nome, whatsapp), order_items(*), order_status_history(*)')
    .eq('id', id)
    .single()

  if (!order) notFound()

  const customer = order.customers as { id: string; nome: string; whatsapp: string } | null
  const items = order.order_items as Array<{
    id: string; nome: string; preco: number; quantidade: number
  }>
  const history = (order.order_status_history as Array<{ status: string; created_at: string }>)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const currentStatus = order.status as OrderStatus
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ''

  return (
    <div className="max-w-3xl">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="mb-8">
        <Link
          href="/admin/pedidos"
          className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-brand-brown/55 transition-colors hover:text-brand-brown"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.25} />
          Voltar para pedidos
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-rose/80">
              Operação
            </p>
            <h1 className="font-heading text-4xl font-semibold leading-none tracking-tight text-brand-brown">
              Pedido <span className="tabular-nums">#{order.numero}</span>
            </h1>
            <p className="mt-2 text-sm text-brand-brown/60">
              {new Date(order.created_at).toLocaleString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant={statusVariant(currentStatus)}>
              {ORDER_STATUS_LABELS[currentStatus]}
            </Badge>
            <Link
              href={`/acompanhar/${id}`}
              target="_blank"
              className="flex items-center gap-1.5 rounded-full border border-brand-brown/12 bg-white px-3 py-1.5 text-[12px] font-semibold text-brand-brown transition-colors hover:bg-brand-cream"
            >
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.25} />
              Ver link
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* ── Cliente ─────────────────────────────────────── */}
        <SectionCard icon={User} title="Cliente">
          {customer ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold tracking-tight text-brand-brown">
                  {customer.nome}
                </p>
                <p className="mt-0.5 text-[13px] font-medium tabular-nums text-brand-brown/55">
                  {customer.whatsapp}
                </p>
              </div>
              <Link
                href="/admin/clientes"
                className="text-[12px] font-semibold text-brand-rose transition-colors hover:text-brand-rose-dark hover:underline"
              >
                Ver histórico
              </Link>
            </div>
          ) : (
            <p className="text-sm font-medium text-brand-brown/50">Cliente não encontrado</p>
          )}
        </SectionCard>

        {/* ── Mudar status ────────────────────────────────── */}
        <SectionCard icon={ListChecks} title="Alterar status">
          <OrderStatusChanger orderId={id} currentStatus={currentStatus} />
        </SectionCard>

        {/* ── Itens ───────────────────────────────────────── */}
        <SectionCard icon={ListChecks} title="Itens do pedido">
          <ul className="space-y-2.5">
            {items.map((item) => (
              <li key={item.id} className="flex items-baseline justify-between gap-4">
                <div className="flex items-baseline gap-3 min-w-0">
                  <span className="inline-flex h-6 min-w-[26px] shrink-0 items-center justify-center rounded-md bg-brand-cream-dark/60 px-1.5 text-[11px] font-bold tabular-nums text-brand-brown">
                    {item.quantidade}×
                  </span>
                  <span className="truncate text-[14px] font-medium tracking-tight text-brand-brown">
                    {item.nome}
                  </span>
                </div>
                <span className="font-heading text-[14px] font-semibold tabular-nums tracking-tight text-brand-brown shrink-0">
                  {formatBRL(item.preco * item.quantidade)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-baseline justify-between border-t border-dashed border-brand-brown/12 pt-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-brown/55">
              Total
            </span>
            <span className="font-heading text-[20px] font-semibold tabular-nums tracking-tight text-brand-rose">
              {formatBRL(order.total)}
            </span>
          </div>
          <div className="mt-3 space-y-1 text-[12px] font-medium text-brand-brown/55">
            <p>
              <span className="text-brand-brown/40">Pagamento:</span>{' '}
              <span className="text-brand-brown/80">{order.forma_pagamento}</span>
            </p>
            {order.observacoes && (
              <p>
                <span className="text-brand-brown/40">Obs:</span>{' '}
                <span className="text-brand-brown/80">{order.observacoes}</span>
              </p>
            )}
          </div>
        </SectionCard>

        {/* ── Histórico de status ─────────────────────────── */}
        <SectionCard icon={History} title="Histórico de status">
          <ol className="space-y-3">
            {history.map((h, i) => {
              const isLast = i === history.length - 1
              return (
                <li key={i} className="relative flex items-start gap-3">
                  {/* Linha vertical entre pontos */}
                  {!isLast && (
                    <span
                      aria-hidden
                      className="absolute left-[5px] top-3 h-full w-px bg-brand-brown/10"
                    />
                  )}
                  <span
                    className={[
                      'relative mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-4',
                      isLast
                        ? 'bg-brand-rose ring-brand-rose/15'
                        : 'bg-brand-brown/30 ring-brand-brown/8',
                    ].join(' ')}
                  />
                  <div className="pb-1">
                    <p className="text-[13.5px] font-semibold tracking-tight text-brand-brown">
                      {ORDER_STATUS_LABELS[h.status as OrderStatus] ?? h.status}
                    </p>
                    <p className="mt-0.5 text-[11.5px] font-medium tabular-nums text-brand-brown/50">
                      {new Date(h.created_at).toLocaleString('pt-BR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        </SectionCard>

        {/* ── Link de acompanhamento ──────────────────────── */}
        {baseUrl && (
          <SectionCard icon={LinkIcon} title="Link para o cliente">
            <p className="break-all rounded-xl bg-brand-cream-dark/40 px-4 py-3 font-mono text-[12px] text-brand-brown/75 ring-1 ring-brand-brown/6">
              {baseUrl}/acompanhar/{id}
            </p>
          </SectionCard>
        )}
      </div>
    </div>
  )
}

/* ── Sub-componente ──────────────────────────────────────── */

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-brand-brown/8 bg-white p-6 shadow-card">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-brand-brown/45" strokeWidth={2} />
        <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-brand-brown/55">
          {title}
        </h2>
      </div>
      {children}
    </div>
  )
}
