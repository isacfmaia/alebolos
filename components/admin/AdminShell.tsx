'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { AdminSidebar } from './AdminSidebar'

/**
 * Shell do painel admin — gerencia o drawer mobile.
 *
 * Layout responsivo:
 *  - md+ (≥768px): sidebar fixa à esquerda, main com padding-left.
 *  - <md: topbar com logo + botão hambúrguer; sidebar vira drawer off-canvas
 *    com overlay clicável.
 *
 * Auto-fecha o drawer ao navegar (mudança de `pathname`) — assim o usuário
 * mobile não precisa fechar manualmente depois de escolher uma rota.
 */
export function AdminShell({
  userEmail,
  children,
}: {
  userEmail: string
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const [prevPath, setPrevPath] = useState(pathname)

  // Fecha o drawer ao trocar de rota. Comparamos durante o render em vez de
  // usar useEffect — pattern recomendado em React 19 para reagir a mudanças
  // de valor sem disparar render extra.
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  if (pathname !== prevPath) {
    setPrevPath(pathname)
    if (isOpen) setIsOpen(false)
  }

  // ESC fecha o drawer (boa prática de acessibilidade pra dialogs).
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen])

  // Trava o scroll do body enquanto o drawer mobile está aberto, pra evitar
  // que o conteúdo de trás role junto. Só relevante em telas pequenas — em
  // md+ a sidebar é estática e o drawer nem aparece.
  useEffect(() => {
    if (!isOpen) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [isOpen])

  return (
    <div className="min-h-screen bg-gradient-warm">
      {/* ── Topbar mobile ─────────────────────────────────── */}
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-brand-brown/8 bg-white/95 px-4 backdrop-blur-md md:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Abrir menu"
          aria-expanded={isOpen}
          aria-controls="admin-sidebar"
          className="-ml-2 flex h-10 w-10 items-center justify-center rounded-lg text-brand-brown transition-colors hover:bg-brand-cream"
        >
          <Menu className="h-5 w-5" strokeWidth={2} />
        </button>
        <Link href="/admin" className="flex items-center gap-2">
          <div className="relative h-8 w-8 shrink-0">
            <Image
              src="/logo_new.svg"
              alt="Sabor e Afeto"
              fill
              priority
              sizes="32px"
              className="object-contain"
            />
          </div>
          <span className="font-heading text-sm font-semibold tracking-tight text-brand-brown">
            Sabor e Afeto
          </span>
        </Link>
      </header>

      {/* ── Sidebar (fixed em md+, drawer em mobile) ──────── */}
      <AdminSidebar
        userEmail={userEmail}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />

      {/* ── Overlay clicável (só mobile, só quando aberto) ── */}
      {isOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-brand-brown/40 backdrop-blur-[2px] md:hidden"
        />
      )}

      {/* ── Conteúdo principal ────────────────────────────── */}
      <main className="min-w-0 md:pl-64">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 md:px-10 md:py-10">
          {children}
        </div>
      </main>
    </div>
  )
}
