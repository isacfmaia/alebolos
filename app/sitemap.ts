import type { MetadataRoute } from 'next'
import { createServiceClient } from '@/lib/supabase/service'
import { SITE_URL } from '@/lib/seo/site'

/**
 * /sitemap.xml gerado dinamicamente.
 *
 * Hoje só temos a home (`/`) como página pública indexável — toda a navegação
 * acontece nela (cardápio + filtros). Futuras páginas individuais de produto
 * (ex: `/cardapio/[slug]`) podem ser adicionadas aqui.
 *
 * O `lastModified` da home reflete o `updated_at` mais recente entre produtos
 * ativos — assim o Google sabe quando vale revisitar.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Tenta buscar a data do produto mais recente para usar no lastModified.
  // Se falhar (banco offline, sem produtos), cai pra `new Date()`.
  let lastModified = new Date()
  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('produtos')
      .select('updated_at')
      .eq('ativo', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (data?.updated_at) lastModified = new Date(data.updated_at)
  } catch {
    // Silencioso — sitemap não deve quebrar build se o Supabase estiver fora.
  }

  return [
    {
      url: `${SITE_URL}/`,
      lastModified,
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ]
}
