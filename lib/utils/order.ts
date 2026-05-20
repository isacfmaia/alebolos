/**
 * Formata um número como moeda BRL (ex: 1234.5 → "R$ 1.234,50").
 * Usa Intl nativo — sem dependências extras.
 */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

/**
 * Monta a mensagem de pedido formatada para envio via WhatsApp.
 *
 * Usa markdown leve do WhatsApp (`*negrito*`, quebras de linha simples).
 * O resultado é o texto bruto — o caller precisa fazer `encodeURIComponent`
 * antes de colocar em `wa.me/<numero>?text=...`.
 */
export function buildWhatsAppMessage({
  orderNumber,
  nomeCliente,
  items,
  total,
  formaPagamento,
  observacoes,
  trackingUrl,
}: {
  orderNumber: number
  nomeCliente: string
  items: Array<{ nome: string; quantity: number; preco: number }>
  total: number
  formaPagamento: string
  observacoes?: string
  trackingUrl?: string
}): string {
  const lines: string[] = [
    `*Pedido #${orderNumber}*`,
    '',
    `*Cliente:* ${nomeCliente}`,
    '',
    '*Itens:*',
    ...items.map((i) => `• ${i.quantity}x ${i.nome} - ${formatBRL(i.preco * i.quantity)}`),
    '',
    `*Total:* ${formatBRL(total)}`,
    `*Pagamento:* ${formaPagamento}`,
  ]

  if (observacoes?.trim()) {
    lines.push('', `*Obs:* ${observacoes.trim()}`)
  }

  if (trackingUrl) {
    lines.push('', `*Acompanhar pedido:* ${trackingUrl}`)
  }

  return lines.join('\n')
}
