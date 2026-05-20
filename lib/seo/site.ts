/**
 * Constantes centrais de SEO/identidade do site.
 *
 * Reaproveitadas em metadata, sitemap, robots, manifest, JSON-LD e
 * geração dinâmica de Open Graph image. Mantenha tudo aqui pra evitar
 * divergência entre páginas.
 */

/** URL absoluta do site (sem barra no final). Cai pra localhost no dev. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
).replace(/\/$/, '')

/** Nome curto da loja — usado no <title>, manifest e schema. */
export const SITE_NAME = 'Sabor e Afeto'

/** Slogan/tagline curta para subtítulos e og:title. */
export const SITE_TAGLINE = 'Confeitaria artesanal · Feito com afeto'

/**
 * Descrição padrão para meta description e og:description.
 * Mantém ≤160 caracteres (limite do Google).
 */
export const SITE_DESCRIPTION =
  'Cardápio digital da Sabor e Afeto: bolos artesanais, doces e quitutes feitos com carinho. Faça seu pedido pelo WhatsApp em poucos cliques.'

/** Locale primário do site (impacta SEO regional). */
export const SITE_LOCALE = 'pt_BR'

/** Palavras-chave principais (ainda usado por alguns indexadores menores). */
export const SITE_KEYWORDS = [
  'confeitaria',
  'bolos artesanais',
  'doces caseiros',
  'cardápio digital',
  'pedidos WhatsApp',
  'Sabor e Afeto',
]
