import { Clock, CheckCircle2 } from 'lucide-react'

const UNIDADE_LABELS: Record<string, [string, string]> = {
  minuto: ['minuto', 'minutos'],
  hora: ['hora', 'horas'],
  dia: ['dia', 'dias'],
  semana: ['semana', 'semanas'],
  mes: ['mês', 'meses'],
}

export function formatPrazo(quantidade: number, unidade: string): string {
  const [singular, plural] = UNIDADE_LABELS[unidade] ?? [unidade, unidade]
  return `${quantidade} ${quantidade === 1 ? singular : plural}`
}

type Props = {
  prontaEntrega: boolean
  prazoQuantidade?: number | null
  prazoUnidade?: string | null
  size?: 'sm' | 'xs'
}

export function PrazoBadge({ prontaEntrega, prazoQuantidade, prazoUnidade, size = 'xs' }: Props) {
  const cls =
    size === 'xs'
      ? 'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-tight'
      : 'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-tight'

  const iconSize = size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5'

  if (prontaEntrega) {
    return (
      <span className={`${cls} bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60`}>
        <CheckCircle2 className={`${iconSize} shrink-0`} strokeWidth={2.25} />
        Pronta entrega
      </span>
    )
  }

  if (prazoQuantidade && prazoUnidade) {
    return (
      <span className={`${cls} bg-brand-cream-dark/50 text-brand-brown ring-1 ring-brand-brown/8`}>
        <Clock className={`${iconSize} shrink-0`} strokeWidth={2} />
        {formatPrazo(prazoQuantidade, prazoUnidade)}
      </span>
    )
  }

  return null
}
