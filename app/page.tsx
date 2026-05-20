import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { CatalogClient } from '@/components/catalog/CatalogClient'
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, SITE_TAGLINE } from '@/lib/seo/site'
import type { ProdutoWithCategory } from '@/types/database'

/**
 * Metadata dinâmica da home. Lê o nome configurado da loja e a quantidade
 * de produtos ativos para deixar o título mais específico no Google.
 */
export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient()
  const [{ data: settings }, { count: produtoCount }] = await Promise.all([
    supabase.from('settings').select('nome_loja, mensagem_boas_vindas').maybeSingle(),
    supabase.from('produtos').select('*', { count: 'exact', head: true }).eq('ativo', true),
  ])

  const nome = settings?.nome_loja ?? SITE_NAME
  const totalLine = produtoCount && produtoCount > 0
    ? ` · ${produtoCount} ${produtoCount === 1 ? 'produto' : 'produtos'} no cardápio`
    : ''
  const description =
    settings?.mensagem_boas_vindas?.trim() ||
    `${SITE_DESCRIPTION}${totalLine}`

  return {
    title: `${nome} — ${SITE_TAGLINE}`,
    description,
    alternates: { canonical: '/' },
    openGraph: {
      title: `${nome} — ${SITE_TAGLINE}`,
      description,
      url: SITE_URL,
      siteName: nome,
      type: 'website',
      locale: 'pt_BR',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${nome} — ${SITE_TAGLINE}`,
      description,
    },
  }
}

export default async function HomePage() {
  const supabase = await createClient()

  const [settingsResult, categoriesResult, produtosResult] = await Promise.all([
    supabase.from('settings').select('*').maybeSingle(),
    supabase.from('categories').select('*').order('ordem'),
    supabase.from('produtos').select('*, categories(*)').eq('ativo', true).order('nome'),
  ])

  const settings = settingsResult.data
  const produtos = (produtosResult.data as unknown as ProdutoWithCategory[]) ?? []

  // ─── Structured Data (JSON-LD) ───────────────────────────────
  // Dois schemas:
  //   1. Bakery (negócio local) — ajuda no Google Maps/Knowledge Panel.
  //   2. ItemList — lista os produtos do cardápio para rich results.
  // Documentação: https://schema.org/Bakery + https://schema.org/ItemList
  const nomeLoja = settings?.nome_loja ?? SITE_NAME
  const whatsapp = settings?.whatsapp_number

  const bakeryJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Bakery',
    name: nomeLoja,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    image: `${SITE_URL}/icon.svg`,
    servesCuisine: 'Confeitaria',
    priceRange: '$$',
    ...(whatsapp && {
      telephone: `+${whatsapp}`,
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: `+${whatsapp}`,
        contactType: 'customer service',
        availableLanguage: ['Portuguese'],
      },
    }),
  }

  const itemListJsonLd = produtos.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Cardápio ${nomeLoja}`,
    numberOfItems: produtos.length,
    itemListElement: produtos.slice(0, 30).map((p, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      item: {
        '@type': 'Product',
        name: p.nome,
        ...(p.descricao && { description: p.descricao }),
        ...(p.foto_url && { image: p.foto_url }),
        ...(p.categories && { category: p.categories.nome }),
        offers: {
          '@type': 'Offer',
          price: p.preco.toFixed(2),
          priceCurrency: 'BRL',
          availability: 'https://schema.org/InStock',
          url: SITE_URL,
        },
      },
    })),
  } : null

  return (
    <>
      {/* JSON-LD — invisível ao usuário, lido por crawlers (Google rich results) */}
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD precisa ser raw
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bakeryJsonLd) }}
      />
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}

      <CatalogClient
        settings={settings}
        categories={categoriesResult.data ?? []}
        produtos={produtos}
      />
    </>
  )
}
