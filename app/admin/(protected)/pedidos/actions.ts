'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { ORDER_STATUS_LIST, type OrderStatus } from '@/types/database'

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
): Promise<{ error?: string }> {
  if (!ORDER_STATUS_LIST.includes(newStatus)) {
    return { error: 'Status inválido.' }
  }

  const supabase = await createClient()

  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)

  if (updateError) return { error: updateError.message }

  await supabase.from('order_status_history').insert({
    order_id: orderId,
    status: newStatus,
  })

  revalidatePath('/admin/pedidos')
  revalidatePath(`/admin/pedidos/${orderId}`)
  revalidatePath(`/acompanhar/${orderId}`)

  return {}
}
