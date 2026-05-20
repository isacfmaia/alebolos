import { createClient } from '@/lib/supabase/server'
import { OrdersPageClient } from '@/components/admin/pedidos/OrdersPageClient'
import type { OrderStatus } from '@/types/database'

type Props = { searchParams: Promise<{ status?: string }> }

export default async function PedidosPage({ searchParams }: Props) {
  const { status } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('orders')
    .select('*, customers(id, nome, whatsapp)')
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data: orders } = await query

  return (
    <OrdersPageClient
      orders={orders ?? []}
      activeStatus={(status as OrderStatus) || null}
    />
  )
}
