'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  Package,
  Settings,
  LayoutDashboard,
  LogOut,
  Tag,
  ShoppingBag,
  Users,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

type NavItem = {
  href: string
  label: string
  icon: typeof LayoutDashboard
  exact: boolean
}

type NavGroup = {
  title: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Visão geral',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    title: 'Operação',
    items: [
      { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag, exact: false },
      { href: '/admin/clientes', label: 'Clientes', icon: Users, exact: false },
    ],
  },
  {
    title: 'Catálogo',
    items: [
      { href: '/admin/produtos', label: 'Produtos', icon: Package, exact: false },
      { href: '/admin/categorias', label: 'Categorias', icon: Tag, exact: false },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { href: '/admin/configuracoes', label: 'Configurações', icon: Settings, exact: false },
    ],
  },
]

type AdminSidebarProps = {
  userEmail: string
  /** Controla a visibilidade no mobile (drawer). Em md+ a sidebar é sempre visível. */
  isOpen?: boolean
  /** Callback chamado pelo botão X interno (mobile). */
  onClose?: () => void
}

export function AdminSidebar({ userEmail, isOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await fetch('/admin/api/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  const initials = userEmail
    .split('@')[0]
    .slice(0, 2)
    .toUpperCase()

  return (
    <aside
      id="admin-sidebar"
      // Mobile: fixed + slide-in via translate. Desktop (md+): fixed mas sempre
      // visível (translate-x-0). O `pl-64` no main em md+ compensa o espaço.
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col border-r border-brand-brown/8 bg-white transition-transform duration-200 ease-out md:translate-x-0',
        isOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full md:shadow-none',
      )}
      aria-label="Navegação do admin"
    >
      {/* ── Brand ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-6 pb-5">
        <Link href="/admin" className="group flex min-w-0 items-center gap-3">
          <div className="relative h-11 w-11 shrink-0 transition-transform duration-200 group-hover:scale-105">
            <Image
              src="/logo_new.svg"
              alt="Sabor e Afeto"
              fill
              priority
              sizes="44px"
              className="object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="font-heading text-[15px] font-semibold leading-tight text-brand-brown tracking-tight">
              Sabor e Afeto
            </p>
            <p className="mt-0.5 text-[10.5px] font-medium uppercase tracking-[0.14em] text-brand-brown/50">
              Admin
            </p>
          </div>
        </Link>
        {/* Botão X dentro do drawer (mobile-only) — fallback ao overlay/ESC. */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-brand-brown/60 transition-colors hover:bg-brand-cream hover:text-brand-brown md:hidden"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        )}
      </div>

      {/* ── Navegação ────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="mb-5 last:mb-0">
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-brown/40">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon, exact }) => {
                const isActive = exact ? pathname === href : pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={[
                      'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150',
                      isActive
                        ? 'bg-brand-rose/8 font-semibold text-brand-rose'
                        : 'font-medium text-brand-brown/70 hover:bg-brand-cream hover:text-brand-brown',
                    ].join(' ')}
                  >
                    {/* Indicador lateral do item ativo */}
                    {isActive && (
                      <span
                        aria-hidden
                        className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-rose"
                      />
                    )}
                    <Icon
                      className={[
                        'h-[17px] w-[17px] shrink-0 transition-colors',
                        isActive ? 'text-brand-rose' : 'text-brand-brown/55 group-hover:text-brand-brown',
                      ].join(' ')}
                      strokeWidth={isActive ? 2.25 : 1.75}
                    />
                    <span className="tracking-tight">{label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── User + logout ────────────────────────────────── */}
      <div className="border-t border-brand-brown/8 px-3 py-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-cream-dark ring-1 ring-brand-brown/8">
            <span className="text-[11px] font-semibold text-brand-brown">{initials}</span>
          </div>
          <p
            className="min-w-0 flex-1 truncate text-[12px] font-medium text-brand-brown/70"
            title={userEmail}
          >
            {userEmail}
          </p>
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-brand-brown/65 transition-all duration-150 hover:bg-destructive/8 hover:text-destructive disabled:opacity-50"
        >
          <LogOut className="h-[17px] w-[17px] shrink-0" strokeWidth={1.75} />
          <span className="tracking-tight">{isLoggingOut ? 'Saindo…' : 'Sair'}</span>
        </button>
      </div>
    </aside>
  )
}
