import { createClient } from '@/lib/supabase/server'
import {
  ClientesPageClient,
  type CustomerWithOrders,
} from '@/components/admin/clientes/ClientesPageClient'

export default async function ClientesPage() {
  const supabase = await createClient()

  const { data: customers } = await supabase
    .from('customers')
    .select('*, orders(id, total, created_at, status)')
    .order('created_at', { ascending: false })

  const rows = (customers ?? []) as CustomerWithOrders[]

  return <ClientesPageClient customers={rows} />
}
