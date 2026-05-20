'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { updateOrderStatus } from '@/app/admin/(protected)/pedidos/actions'
import { ORDER_STATUS_LABELS, ORDER_STATUS_LIST, type OrderStatus } from '@/types/database'

type Props = { orderId: string; currentStatus: OrderStatus }

/**
 * Controle para alterar o status de um pedido (admin).
 *
 * Padrão: o usuário escolhe um novo status no select e clica em "Salvar".
 * Em caso de erro do servidor, o estado local é REVERTIDO (`setSelected(currentStatus)`)
 * para que a UI mostre o status antigo — evita inconsistência visual.
 *
 * O botão "Salvar" fica desabilitado quando o select é igual ao status atual,
 * impedindo no-ops contra o banco.
 */
export function OrderStatusChanger({ orderId, currentStatus }: Props) {
  const [selected, setSelected] = useState<OrderStatus>(currentStatus)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    // Guarda: se o usuário não mudou nada, não faz request.
    if (selected === currentStatus) return
    setIsSaving(true)
    try {
      const result = await updateOrderStatus(orderId, selected)
      if (result.error) {
        toast.error(result.error)
        // Rollback otimista — volta o select ao valor antigo do servidor.
        setSelected(currentStatus)
      } else {
        toast.success('Status atualizado!')
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-2.5">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value as OrderStatus)}
        disabled={isSaving}
        className="h-10 flex-1 cursor-pointer rounded-xl border border-brand-brown/12 bg-white px-3.5 text-sm font-medium tracking-tight text-brand-brown transition-all focus:border-brand-rose focus:outline-none focus:ring-2 focus:ring-brand-rose/25 disabled:opacity-60"
      >
        {ORDER_STATUS_LIST.map((s) => (
          <option key={s} value={s}>
            {ORDER_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving || selected === currentStatus}
        className="flex h-10 items-center gap-2 rounded-full bg-gradient-rose px-5 text-sm font-semibold tracking-tight text-white shadow-elev transition-all hover:shadow-glow active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
      >
        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        Salvar
      </button>
    </div>
  )
}
