/**
 * Constantes centrais de SEO/identidade do site.
 *
 * Reaproveitadas em metadata, sitemap, robots, manifest, JSON-LD e geração
 * dinâmica de Open Graph image. Mantenha tudo aqui para evitar divergência
 * entre páginas.
 */

/** URL absoluta do site (sem barra no final). Cai para localhost no dev. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
).replace(/\/$/, '')

/** Nome curto da loja, usado no title, manifest e schema. */
export const SITE_NAME = 'Bolos da Alê'

/** Slogan/tagline curta para subtítulos e og:title. */
export const SITE_TAGLINE = 'Bolos artesanais sob encomenda'

/** Logo principal da marca dentro de /public. */
export const SITE_LOGO_PATH = '/alebolos-logo.jpeg'

/**
 * Descrição padrão para meta description e og:description.
 * Mantém até 160 caracteres.
 */
export const SITE_DESCRIPTION =
  'Cardápio digital da Bolos da Alê: bolos artesanais, doces e encomendas feitas com carinho pelo WhatsApp.'

/** Locale primário do site (impacta SEO regional). */
export const SITE_LOCALE = 'pt_BR'

/** Palavras-chave principais (ainda usado por alguns indexadores menores). */
export const SITE_KEYWORDS = [
  'confeitaria',
  'bolos artesanais',
  'bolos da Alê',
  'doces caseiros',
  'cardápio digital',
  'pedidos WhatsApp',
  'alebolos',
]
