import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-brand-cream text-center">
      <span className="text-6xl" aria-hidden>🎂</span>
      <h1 className="font-heading text-4xl font-bold text-brand-brown">404</h1>
      <p className="text-lg font-semibold text-brand-brown">Página não encontrada</p>
      <p className="max-w-xs text-sm text-muted-foreground">
        O endereço que você acessou não existe ou foi removido.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-full bg-brand-rose px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-rose-dark"
      >
        Voltar ao cardápio
      </Link>
    </div>
  )
}
