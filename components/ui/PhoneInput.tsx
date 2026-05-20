'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search } from 'lucide-react'

/* ── Tipos ──────────────────────────────────────────────────── */

interface Country {
  code: string
  dialCode: string
  name: string
  flag: string
}

/* ── Lista de países ────────────────────────────────────────── */

const COUNTRIES: Country[] = [
  // Brasil primeiro (padrão)
  { code: 'BR', dialCode: '55',  name: 'Brasil',               flag: '🇧🇷' },
  // Demais em ordem alfabética (pt-BR)
  { code: 'ZA', dialCode: '27',  name: 'África do Sul',        flag: '🇿🇦' },
  { code: 'AL', dialCode: '355', name: 'Albânia',              flag: '🇦🇱' },
  { code: 'DE', dialCode: '49',  name: 'Alemanha',             flag: '🇩🇪' },
  { code: 'SA', dialCode: '966', name: 'Arábia Saudita',       flag: '🇸🇦' },
  { code: 'AR', dialCode: '54',  name: 'Argentina',            flag: '🇦🇷' },
  { code: 'AU', dialCode: '61',  name: 'Austrália',            flag: '🇦🇺' },
  { code: 'AT', dialCode: '43',  name: 'Áustria',              flag: '🇦🇹' },
  { code: 'BE', dialCode: '32',  name: 'Bélgica',              flag: '🇧🇪' },
  { code: 'BO', dialCode: '591', name: 'Bolívia',              flag: '🇧🇴' },
  { code: 'CA', dialCode: '1',   name: 'Canadá',               flag: '🇨🇦' },
  { code: 'CL', dialCode: '56',  name: 'Chile',                flag: '🇨🇱' },
  { code: 'CN', dialCode: '86',  name: 'China',                flag: '🇨🇳' },
  { code: 'CO', dialCode: '57',  name: 'Colômbia',             flag: '🇨🇴' },
  { code: 'KR', dialCode: '82',  name: 'Coreia do Sul',        flag: '🇰🇷' },
  { code: 'CR', dialCode: '506', name: 'Costa Rica',           flag: '🇨🇷' },
  { code: 'HR', dialCode: '385', name: 'Croácia',              flag: '🇭🇷' },
  { code: 'CU', dialCode: '53',  name: 'Cuba',                 flag: '🇨🇺' },
  { code: 'DK', dialCode: '45',  name: 'Dinamarca',            flag: '🇩🇰' },
  { code: 'SV', dialCode: '503', name: 'El Salvador',          flag: '🇸🇻' },
  { code: 'EC', dialCode: '593', name: 'Equador',              flag: '🇪🇨' },
  { code: 'SK', dialCode: '421', name: 'Eslováquia',           flag: '🇸🇰' },
  { code: 'SI', dialCode: '386', name: 'Eslovênia',            flag: '🇸🇮' },
  { code: 'ES', dialCode: '34',  name: 'Espanha',              flag: '🇪🇸' },
  { code: 'US', dialCode: '1',   name: 'Estados Unidos',       flag: '🇺🇸' },
  { code: 'EE', dialCode: '372', name: 'Estônia',              flag: '🇪🇪' },
  { code: 'FI', dialCode: '358', name: 'Finlândia',            flag: '🇫🇮' },
  { code: 'FR', dialCode: '33',  name: 'França',               flag: '🇫🇷' },
  { code: 'GR', dialCode: '30',  name: 'Grécia',               flag: '🇬🇷' },
  { code: 'GT', dialCode: '502', name: 'Guatemala',            flag: '🇬🇹' },
  { code: 'HT', dialCode: '509', name: 'Haiti',                flag: '🇭🇹' },
  { code: 'NL', dialCode: '31',  name: 'Holanda',              flag: '🇳🇱' },
  { code: 'HN', dialCode: '504', name: 'Honduras',             flag: '🇭🇳' },
  { code: 'HU', dialCode: '36',  name: 'Hungria',              flag: '🇭🇺' },
  { code: 'IN', dialCode: '91',  name: 'Índia',                flag: '🇮🇳' },
  { code: 'ID', dialCode: '62',  name: 'Indonésia',            flag: '🇮🇩' },
  { code: 'IE', dialCode: '353', name: 'Irlanda',              flag: '🇮🇪' },
  { code: 'IL', dialCode: '972', name: 'Israel',               flag: '🇮🇱' },
  { code: 'IT', dialCode: '39',  name: 'Itália',               flag: '🇮🇹' },
  { code: 'JP', dialCode: '81',  name: 'Japão',                flag: '🇯🇵' },
  { code: 'MX', dialCode: '52',  name: 'México',               flag: '🇲🇽' },
  { code: 'NO', dialCode: '47',  name: 'Noruega',              flag: '🇳🇴' },
  { code: 'NZ', dialCode: '64',  name: 'Nova Zelândia',        flag: '🇳🇿' },
  { code: 'PA', dialCode: '507', name: 'Panamá',               flag: '🇵🇦' },
  { code: 'PY', dialCode: '595', name: 'Paraguai',             flag: '🇵🇾' },
  { code: 'PE', dialCode: '51',  name: 'Peru',                 flag: '🇵🇪' },
  { code: 'PL', dialCode: '48',  name: 'Polônia',              flag: '🇵🇱' },
  { code: 'PT', dialCode: '351', name: 'Portugal',             flag: '🇵🇹' },
  { code: 'GB', dialCode: '44',  name: 'Reino Unido',          flag: '🇬🇧' },
  { code: 'DO', dialCode: '1',   name: 'República Dominicana', flag: '🇩🇴' },
  { code: 'RO', dialCode: '40',  name: 'Romênia',              flag: '🇷🇴' },
  { code: 'RU', dialCode: '7',   name: 'Rússia',               flag: '🇷🇺' },
  { code: 'SE', dialCode: '46',  name: 'Suécia',               flag: '🇸🇪' },
  { code: 'CH', dialCode: '41',  name: 'Suíça',                flag: '🇨🇭' },
  { code: 'TH', dialCode: '66',  name: 'Tailândia',            flag: '🇹🇭' },
  { code: 'TR', dialCode: '90',  name: 'Turquia',              flag: '🇹🇷' },
  { code: 'UA', dialCode: '380', name: 'Ucrânia',              flag: '🇺🇦' },
  { code: 'UY', dialCode: '598', name: 'Uruguai',              flag: '🇺🇾' },
  { code: 'VE', dialCode: '58',  name: 'Venezuela',            flag: '🇻🇪' },
]

const DEFAULT_COUNTRY = COUNTRIES[0] // Brasil

/* ── Helpers ────────────────────────────────────────────────── */

/** Tenta identificar o país pelo prefixo do número completo salvo. */
function parsePhoneValue(value: string): { country: Country; local: string } {
  if (!value) return { country: DEFAULT_COUNTRY, local: '' }

  // Ordena do código mais longo para o mais curto para evitar falsos positivos
  const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length)
  for (const c of sorted) {
    if (value.startsWith(c.dialCode)) {
      return { country: c, local: value.slice(c.dialCode.length) }
    }
  }
  return { country: DEFAULT_COUNTRY, local: value }
}

/* ── Componente ─────────────────────────────────────────────── */

interface PhoneInputProps {
  value?: string
  onChange: (value: string) => void
  error?: boolean
  id?: string
  autoComplete?: string
}

export function PhoneInput({ value = '', onChange, error, id, autoComplete }: PhoneInputProps) {
  const initial = parsePhoneValue(value)
  const [country, setCountry] = useState<Country>(initial.country)
  const [local, setLocal] = useState(initial.local)
  // Mantém o último `value` visto pelo render para detectar mudanças externas
  // (ex: reset do form) sem precisar de useEffect com setState.
  // Pattern recomendado em React 19:
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const [prevValue, setPrevValue] = useState(value)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  if (value !== prevValue) {
    setPrevValue(value)
    const combined = country.dialCode + local
    if (value !== combined) {
      const p = parsePhoneValue(value)
      setCountry(p.country)
      setLocal(p.local)
    }
  }

  /* Fecha ao clicar fora */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  /* Foca busca ao abrir */
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 0)
    }
  }, [open])

  const handleCountrySelect = (c: Country) => {
    setCountry(c)
    setOpen(false)
    setSearch('')
    onChange(c.dialCode + local)
  }

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '')
    setLocal(val)
    onChange(country.dialCode + val)
  }

  const filtered = search.trim()
    ? COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.dialCode.includes(search.replace(/\D/g, '')),
      )
    : COUNTRIES

  const borderCls = error ? 'border-destructive' : 'border-border'

  return (
    <div ref={wrapperRef} className="relative flex">
      {/* ── Botão seletor de país ── */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Selecionar código do país"
        aria-expanded={open}
        className={[
          'flex h-9 shrink-0 items-center gap-1.5 rounded-l-lg border-y border-l bg-white px-2.5 text-sm transition-colors',
          'hover:bg-brand-cream/60 focus:outline-none focus:ring-2 focus:ring-brand-rose/30',
          borderCls,
        ].join(' ')}
      >
        <span className="text-lg leading-none">{country.flag}</span>
        <span className="text-muted-foreground text-xs font-medium">+{country.dialCode}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* ── Separador visual ── */}
      <div className={`w-px self-stretch border-r ${borderCls}`} />

      {/* ── Campo do número local ── */}
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        value={local}
        onChange={handleLocalChange}
        placeholder="11 99999-9999"
        autoComplete={autoComplete}
        className={[
          'h-9 flex-1 rounded-r-lg border-y border-r bg-white px-3 text-sm transition-colors',
          'placeholder:text-muted-foreground focus:border-brand-rose focus:outline-none focus:ring-2 focus:ring-brand-rose/30',
          borderCls,
        ].join(' ')}
      />

      {/* ── Dropdown de países ── */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
          {/* Busca */}
          <div className="border-b border-border p-2">
            <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-1.5">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar país ou código…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Lista */}
          <ul className="max-h-60 overflow-y-auto py-1" role="listbox">
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-sm text-muted-foreground">
                Nenhum país encontrado
              </li>
            )}
            {filtered.map((c) => (
              <li
                key={c.code}
                role="option"
                aria-selected={c.code === country.code}
                onClick={() => handleCountrySelect(c)}
                className={[
                  'flex cursor-pointer items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-brand-cream/60',
                  c.code === country.code
                    ? 'bg-brand-rose/5 font-medium text-brand-brown'
                    : 'text-foreground',
                ].join(' ')}
              >
                <span className="text-xl leading-none">{c.flag}</span>
                <span className="flex-1 truncate">{c.name}</span>
                <span className="text-xs text-muted-foreground">+{c.dialCode}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
