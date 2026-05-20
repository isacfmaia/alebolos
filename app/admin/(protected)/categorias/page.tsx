import { createClient } from '@/lib/supabase/server'
import type { CategoryRow } from '@/types/database'
import { CategoriesPageClient } from '@/components/admin/categorias/CategoriesPageClient'

export default async function AdminCategoriasPage() {
  const supabase = await createClient()

  const { data } = await supabase.from('categories').select('*').order('ordem')
  const categories = (data ?? []) as CategoryRow[]

  return <CategoriesPageClient categories={categories} />
}
