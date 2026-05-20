'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Minus, Plus, Trash2, X, Loader2, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useCartStore, type CartEntry } from '@/lib/store/cart'
import { buildWhatsAppMessage, formatBRL } from '@/lib/utils/order'
import { createOrder } from '@/app/actions/createOrder'
import { PrazoBadge } from '@/components/ui/PrazoBadge'
import { PhoneInput } from '@/components/ui/PhoneInput'
import type { SettingsRow } from '@/types/database'

const checkoutSchema = z.object({
  nomeCliente: z.string().min(2, 'Informe seu nome (mínimo 2 caracteres)'),
  whatsapp: z
    .string()
    .regex(/^\d{8,15}$/, 'Informe o número sem espaços ou símbolos'),
  formaPagamento: z.string().min(1, 'Selecione uma forma de pagamento'),
  observacoes: z.string().optional(),
})

type CheckoutForm = z.infer<typeof checkoutSchema>

type Props = {
  isOpen: boolean
  onClose: () => void
  settings: SettingsRow | null
}

const inputCls = (hasError?: boolean) =>
  [
    'h-9 w-full rounded-lg border bg-white px-3 text-sm transition-colors',
    'placeholder:text-muted-foreground',
    'focus:ring-brand-rose/30 focus:border-brand-rose focus:ring-2 focus:outline-none',
    hasError ? 'border-destructive' : 'border-border',
  ].join(' ')

export function CartSheet({ isOpen, onClose, settings }: Props) {
  const { entries, increment, decrement, remove, clear } = useCartStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const total = entries.reduce((s, e) => s + e.item.preco * e.quantity, 0)
  const count = entries.reduce((s, e) => s + e.quantity, 0)

  const paymentMethods: string[] = Array.isArray(settings?.formas_pagamento)
    ? (settings.formas_pagamento as string[])
    : ['PIX', 'Dinheiro', 'Cartão de crédito']

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { nomeCliente: '', whatsapp: '', formaPagamento: '', observacoes: '' },
  })

  /**
   * Finalização do pedido. Fluxo:
   *   1. Cria o pedido no banco via Server Action `createOrder`.
   *   2. Monta a mensagem formatada para o WhatsApp (com link de acompanhamento).
   *   3. Abre o app WhatsApp do cliente em nova aba via `wa.me`.
   *   4. Limpa o carrinho e fecha o drawer.
   *
   * O número de telefone usado em `wa.me/<numero>` é o da LOJA, não o do
   * cliente — assim a mensagem chega ao WhatsApp do estabelecimento e ele
   * pode confirmar pelo canal direto.
   */
  const onSubmit = async (data: CheckoutForm) => {
    setIsSubmitting(true)
    try {
      // 1. Grava o pedido no banco. O `createOrder` retorna o id e o número (#N).
      // Enviamos apenas id + quantidade; o servidor lê o preço/nome do banco.
      const result = await createOrder({
        nomeCliente: data.nomeCliente,
        whatsapp: data.whatsapp,
        items: entries.map((e) => ({
          produtoId: e.item.id,
          quantidade: e.quantity,
        })),
        formaPagamento: data.formaPagamento,
        observacoes: data.observacoes,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      // 2. Telefone da LOJA (não do cliente) — destino da mensagem do WhatsApp.
      const phone = settings?.whatsapp_number ?? ''
      // URL pública de acompanhamento — o cliente recebe esse link no WhatsApp
      // e pode acompanhar o status do pedido sem precisar conversar.
      const trackingUrl = `${window.location.origin}/acompanhar/${result.orderId}`

      // 3. Monta a mensagem (texto formatado com emojis, valores, link).
      const message = buildWhatsAppMessage({
        orderNumber: result.orderNumber!,
        nomeCliente: data.nomeCliente,
        items: entries.map((e) => ({
          nome: e.item.nome,
          quantity: e.quantity,
          preco: e.item.preco,
        })),
        total,
        formaPagamento: data.formaPagamento,
        observacoes: data.observacoes,
        trackingUrl,
      })

      // 4. Abre wa.me em nova aba. O `encodeURIComponent` é OBRIGATÓRIO —
      // sem isso, quebras de linha e emojis arruinam a URL.
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
      clear()
      reset()
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        {/* ── Cabeçalho ─────────────────────────────────────── */}
        <SheetHeader className="border-brand-rose/15 shrink-0 border-b px-5 py-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-heading text-brand-brown flex items-center gap-2 text-xl">
              <ShoppingCart className="h-5 w-5 text-brand-brown" strokeWidth={1.75} />
              Seu Pedido
              {count > 0 && (
                <span className="text-muted-foreground ml-0.5 font-sans text-sm font-normal">
                  ({count} {count === 1 ? 'item' : 'itens'})
                </span>
              )}
            </SheetTitle>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar carrinho"
              className="hover:bg-brand-cream text-muted-foreground hover:text-brand-brown rounded-full p-1.5 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </SheetHeader>

        {/* ── Carrinho vazio ─────────────────────────────────── */}
        {entries.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
            <span className="text-6xl" aria-hidden>
              🛍️
            </span>
            <p className="font-heading text-brand-brown text-lg font-semibold">Carrinho vazio</p>
            <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
              Adicione produtos do cardápio para montar seu pedido.
            </p>
          </div>
        )}

        {/* ── Com itens ──────────────────────────────────────── */}
        {entries.length > 0 && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col"
            noValidate
          >
            {/* Lista de itens — scrollável */}
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {entries.map((entry) => (
                <CartItemRow
                  key={entry.item.id}
                  entry={entry}
                  onIncrement={() => increment(entry.item.id)}
                  onDecrement={() => decrement(entry.item.id)}
                  onRemove={() => remove(entry.item.id)}
                />
              ))}
            </div>

            {/* Formulário + total + botão */}
            <div className="border-brand-rose/15 shrink-0 border-t">
              <div className="space-y-4 px-5 pt-5 pb-3">
                {/* Nome do cliente */}
                <fieldset className="space-y-1.5">
                  <label
                    htmlFor="nomeCliente"
                    className="text-brand-brown block text-xs font-bold tracking-wide uppercase"
                  >
                    Seu nome *
                  </label>
                  <input
                    id="nomeCliente"
                    {...register('nomeCliente')}
                    placeholder="Ex: Maria Silva"
                    autoComplete="name"
                    className={inputCls(!!errors.nomeCliente)}
                  />
                  {errors.nomeCliente && (
                    <p role="alert" className="text-destructive text-xs">
                      {errors.nomeCliente.message}
                    </p>
                  )}
                </fieldset>

                {/* WhatsApp */}
                <fieldset className="space-y-1.5">
                  <label
                    htmlFor="whatsapp"
                    className="text-brand-brown block text-xs font-bold tracking-wide uppercase"
                  >
                    WhatsApp *
                  </label>
                  <Controller
                    name="whatsapp"
                    control={control}
                    render={({ field }) => (
                      <PhoneInput
                        id="whatsapp"
                        value={field.value}
                        onChange={field.onChange}
                        error={!!errors.whatsapp}
                        autoComplete="tel"
                      />
                    )}
                  />
                  {errors.whatsapp && (
                    <p role="alert" className="text-destructive text-xs">
                      {errors.whatsapp.message}
                    </p>
                  )}
                </fieldset>

                {/* Forma de pagamento */}
                <fieldset className="space-y-1.5">
                  <label
                    htmlFor="formaPagamento"
                    className="text-brand-brown block text-xs font-bold tracking-wide uppercase"
                  >
                    Forma de pagamento *
                  </label>
                  <select
                    id="formaPagamento"
                    {...register('formaPagamento')}
                    className={[
                      'h-9 w-full cursor-pointer rounded-lg border bg-white px-3 text-sm transition-colors',
                      'focus:ring-brand-rose/30 focus:border-brand-rose focus:ring-2 focus:outline-none',
                      errors.formaPagamento ? 'border-destructive' : 'border-border',
                    ].join(' ')}
                  >
                    <option value="">Selecione...</option>
                    {paymentMethods.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  {errors.formaPagamento && (
                    <p role="alert" className="text-destructive text-xs">
                      {errors.formaPagamento.message}
                    </p>
                  )}
                </fieldset>

                {/* Observações */}
                <fieldset className="space-y-1.5">
                  <label
                    htmlFor="observacoes"
                    className="text-brand-brown block text-xs font-bold tracking-wide uppercase"
                  >
                    Observações{' '}
                    <span className="text-muted-foreground font-normal normal-case">
                      (opcional)
                    </span>
                  </label>
                  <textarea
                    id="observacoes"
                    {...register('observacoes')}
                    placeholder="Ex: Entregar sábado às 15h, sem glúten..."
                    rows={2}
                    className="border-border placeholder:text-muted-foreground focus:ring-brand-rose/30 focus:border-brand-rose w-full resize-none rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:ring-2 focus:outline-none"
                  />
                </fieldset>
              </div>

              {/* Total + submit */}
              <div className="space-y-4 px-5 pt-2 pb-5">
                <div className="border-brand-rose/20 flex items-center justify-between border-t border-dashed py-2">
                  <span className="text-brand-brown font-semibold">Total do pedido</span>
                  <span className="text-brand-rose text-xl font-bold tabular-nums">
                    {formatBRL(total)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2.5 rounded-full bg-[#25D366] py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#1ebe5d] active:scale-[0.98] disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <WhatsAppIcon />
                  )}
                  {isSubmitting ? 'Registrando pedido…' : 'Finalizar pelo WhatsApp'}
                </button>
              </div>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  )
}

/* ── Componentes internos ──────────────────────────────────── */

function CartItemRow({
  entry,
  onIncrement,
  onDecrement,
  onRemove,
}: {
  entry: CartEntry
  onIncrement: () => void
  onDecrement: () => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-3">
      {/* Miniatura */}
      <div className="bg-brand-cream-dark relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
        {entry.item.foto_url ? (
          <Image
            src={entry.item.foto_url}
            alt={entry.item.nome}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-2xl" aria-hidden>
            🎂
          </span>
        )}
      </div>

      {/* Info + controles de quantidade */}
      <div className="min-w-0 flex-1">
        <p className="text-brand-brown truncate text-sm font-semibold">{entry.item.nome}</p>
        <p className="text-brand-rose text-sm font-bold tabular-nums">
          {formatBRL(entry.item.preco * entry.quantity)}
        </p>
        <div className="mt-1">
          <PrazoBadge
            prontaEntrega={entry.item.pronta_entrega}
            prazoQuantidade={entry.item.prazo_quantidade}
            prazoUnidade={entry.item.prazo_unidade}
          />
        </div>

        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={onDecrement}
            aria-label="Diminuir quantidade"
            className="border-brand-rose/30 hover:bg-brand-rose/10 flex h-7 w-7 items-center justify-center rounded-full border transition-colors"
          >
            <Minus className="text-brand-rose h-3 w-3" strokeWidth={2.5} />
          </button>
          <span className="text-brand-brown w-5 text-center text-sm font-bold tabular-nums">
            {entry.quantity}
          </span>
          <button
            type="button"
            onClick={onIncrement}
            aria-label="Aumentar quantidade"
            className="border-brand-rose/30 hover:bg-brand-rose/10 flex h-7 w-7 items-center justify-center rounded-full border transition-colors"
          >
            <Plus className="text-brand-rose h-3 w-3" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Remover */}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remover ${entry.item.nome}`}
        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full p-2 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

function WhatsAppIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}
