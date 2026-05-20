'use client'

import { Search, X } from 'lucide-react'

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  ariaLabel?: string
}

/**
 * Campo de busca padronizado do admin. Visualmente idêntico em todas as
 * páginas que listam registros (pedidos, produtos, clientes), com:
 *  - Ícone de lupa fixo à esquerda.
 *  - Botão X à direita quando há texto, pra limpar rapidamente.
 *  - Tipo `search` (mostra "Cancel" no iOS e estilo nativo de busca).
 *
 * O filtro em si fica a cargo da página — este componente é stateless.
 */
export function SearchInput({ value, onChange, placeholder, ariaLabel }: Props) {
  const hasValue = value.length > 0
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-brown/40" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className="h-11 w-full rounded-xl border border-brand-brown/12 bg-white pl-10 pr-10 text-sm text-brand-brown placeholder:text-brand-brown/40 shadow-sm transition-colors focus:border-brand-rose focus:outline-none focus:ring-2 focus:ring-brand-rose/20"
      />
      {hasValue && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Limpar busca"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-brand-brown/40 transition-colors hover:bg-brand-cream hover:text-brand-brown"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
