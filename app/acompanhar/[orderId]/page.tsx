import Link from 'next/link'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { formatBRL } from '@/lib/utils/order'
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/types/database'
import { PrazoBadge } from '@/components/ui/PrazoBadge'
import { SITE_LOGO_PATH, SITE_NAME } from '@/lib/seo/site'
import { CheckCircle2, Circle, Clock, ExternalLink, XCircle } from 'lucide-react'

type Props = { params: Promise<{ orderId: string }> }

export default async function TrackingPage({ params }: Props) {
  const { orderId } = await params

  // Dois clientes: o de service bypassa RLS pra ler o pedido (a página é
  // pública, qualquer pessoa com o UUID pode acessar). O cookie-based serve
  // só pra detectar se quem está vendo é um admin logado — nesse caso
  // mostramos um atalho pra tela de gestão do pedido.
  const supabase = createServiceClient()
  const supabaseAuth = await createClient()

  const [orderResult, userResult] = await Promise.all([
    supabase
      .from('orders')
      .select('*, customers(nome, whatsapp), order_items(*), order_status_history(*)')
      .eq('id', orderId)
      .single(),
    supabaseAuth.auth.getUser(),
  ])

  const order = orderResult.data
  const isAdmin = !!userResult.data.user

  if (!order) notFound()

  const customer = order.customers as { nome: string; whatsapp: string } | null
  const items = order.order_items as Array<{
    id: string; nome: string; preco: number; quantidade: number
    pronta_entrega: boolean; prazo_quantidade: number | null; prazo_unidade: string | null
  }>
  const history = (order.order_status_history as Array<{ status: string; created_at: string }>)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const currentStatus = order.status as OrderStatus
  const isCancelled = currentStatus === 'cancelado'

  const activeFlow: OrderStatus[] = [
    'realizado',
    'pagamento_confirmado',
    'em_producao',
    'aguardando_entrega',
    'concluido',
  ]

  const historyMap = new Map(history.map((h) => [h.status, h.created_at]))

  return (
    <div className="min-h-screen bg-brand-cream/30 px-4 py-10">
      <div className="mx-auto max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="relative mx-auto h-16 w-16 drop-shadow-[0_4px_12px_oklch(0.59_0.22_29/0.18)]">
            <Image
              src={SITE_LOGO_PATH}
              alt={SITE_NAME}
              fill
              priority
              sizes="64px"
              className="rounded-full object-cover"
            />
          </div>
          <h1 className="font-heading mt-3 text-2xl font-bold text-brand-brown">
            Pedido #{order.numero}
          </h1>
          {customer && (
            <p className="mt-0.5 text-sm text-muted-foreground">Olá, {customer.nome}!</p>
          )}
        </div>

        {/* Status atual */}
        <div
          className={[
            'rounded-xl border p-5 text-center',
            isCancelled
              ? 'border-destructive/20 bg-destructive/5'
              : currentStatus === 'concluido'
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-brand-rose/15 bg-white',
          ].join(' ')}
        >
          {isCancelled ? (
            <XCircle className="mx-auto h-8 w-8 text-destructive" />
          ) : currentStatus === 'concluido' ? (
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
          ) : (
            <Clock className="mx-auto h-8 w-8 text-brand-rose" />
          )}
          <p
            className={[
              'mt-2 text-lg font-bold',
              isCancelled
                ? 'text-destructive'
                : currentStatus === 'concluido'
                ? 'text-emerald-700'
                : 'text-brand-brown',
            ].join(' ')}
          >
            {ORDER_STATUS_LABELS[currentStatus]}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Atualizado em{' '}
            {new Date(order.updated_at).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        {/* Atalho admin — só renderiza se houver sessão Supabase válida.
            Usuários comuns nunca veem esse botão. */}
        {isAdmin && (
          <Link
            href={`/admin/pedidos/${order.id}`}
            className="flex items-center justify-center gap-2 rounded-xl border border-brand-brown/15 bg-white px-4 py-3 text-sm font-semibold text-brand-brown shadow-sm transition-all hover:border-brand-brown/30 hover:bg-brand-cream/50"
          >
            <ExternalLink className="h-4 w-4" />
            Ver pedido no admin
          </Link>
        )}

        {/* Timeline */}
        {!isCancelled && (
          <div className="rounded-xl border border-brand-rose/15 bg-white p-5">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wide text-brand-brown">
              Andamento
            </h2>
            <ol className="space-y-3">
              {activeFlow.map((status, idx) => {
                const done = historyMap.has(status)
                const isCurrent = status === currentStatus
                const isLast = idx === activeFlow.length - 1
                return (
                  <li key={status} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={[
                          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                          done
                            ? isCurrent && status !== 'concluido'
                              ? 'bg-brand-rose text-white'
                              : 'bg-emerald-500 text-white'
                            : 'border-2 border-border bg-white text-muted-foreground',
                        ].join(' ')}
                      >
                        {done ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </div>
                      {!isLast && (
                        <div
                          className={[
                            'mt-1 w-px flex-1',
                            done ? 'bg-emerald-400' : 'bg-border',
                          ].join(' ')}
                          style={{ minHeight: '1.5rem' }}
                        />
                      )}
                    </div>
                    <div className="pb-3">
                      <p
                        className={[
                          'text-sm font-semibold',
                          done ? 'text-brand-brown' : 'text-muted-foreground',
                        ].join(' ')}
                      >
                        {ORDER_STATUS_LABELS[status]}
                      </p>
                      {historyMap.has(status) && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(historyMap.get(status)!).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        )}

        {/* Itens */}
        <div className="rounded-xl border border-brand-rose/15 bg-white p-5">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-brand-brown">
            Itens do pedido
          </h2>
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-2 text-sm">
                <div>
                  <span className="text-brand-brown">
                    {item.quantidade}× {item.nome}
                  </span>
                  <div className="mt-0.5">
                    <PrazoBadge
                      prontaEntrega={item.pronta_entrega}
                      prazoQuantidade={item.prazo_quantidade}
                      prazoUnidade={item.prazo_unidade}
                    />
                  </div>
                </div>
                <span className="shrink-0 font-semibold tabular-nums text-brand-brown">
                  {formatBRL(item.preco * item.quantidade)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-dashed border-brand-rose/20 pt-3 text-sm font-bold">
            <span className="text-brand-brown">Total</span>
            <span className="text-brand-rose tabular-nums">{formatBRL(order.total)}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Pagamento: {order.forma_pagamento}
          </p>
          {order.observacoes && (
            <p className="mt-1 text-xs text-muted-foreground">Obs: {order.observacoes}</p>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Dúvidas? Entre em contato pelo WhatsApp.
        </p>
      </div>
    </div>
  )
}
