import { createClient } from '@/lib/supabase/server'
import type { CategoryRow, ProdutoWithCategory } from '@/types/database'
import { ProdutosPageClient } from '@/components/admin/produtos/ProdutosPageClient'

export default async function AdminProdutosPage() {
  const supabase = await createClient()

  const [produtosResult, categoriesResult] = await Promise.all([
    supabase.from('produtos').select('*, categories(*)').order('nome'),
    supabase.from('categories').select('*').order('ordem'),
  ])

  const produtos = (produtosResult.data ?? []) as unknown as ProdutoWithCategory[]
  const categories = (categoriesResult.data ?? []) as CategoryRow[]

  return <ProdutosPageClient produtos={produtos} categories={categories} />
}
