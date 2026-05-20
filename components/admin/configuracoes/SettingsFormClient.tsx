'use client'

import { useState, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, X, Loader2 } from 'lucide-react'
import { upsertSettings } from '@/app/admin/(protected)/configuracoes/actions'
import { PhoneInput } from '@/components/ui/PhoneInput'
import type { SettingsRow } from '@/types/database'

const schema = z.object({
  nome_loja: z.string().min(1, 'Nome da loja obrigatório').max(100),
  whatsapp_number: z
    .string()
    .min(1, 'Número obrigatório')
    .regex(/^\d{8,15}$/, 'Informe o número sem espaços ou símbolos'),
  mensagem_boas_vindas: z.string().max(300).optional(),
})
type FormValues = z.infer<typeof schema>

const DEFAULT_METHODS = ['PIX', 'Dinheiro', 'Cartão de crédito']

type Props = { settings: SettingsRow | null }

const inputCls = (hasError?: boolean) =>
  [
    'w-full rounded-xl border bg-white px-3.5 text-sm font-medium tracking-tight transition-all',
    'placeholder:text-brand-brown/35 placeholder:font-normal',
    'focus:border-brand-rose focus:outline-none focus:ring-2 focus:ring-brand-rose/25',
    hasError ? 'border-destructive' : 'border-brand-brown/12',
  ].join(' ')

const labelCls =
  'block text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-brown/65'

export function SettingsFormClient({ settings }: Props) {
  const initialMethods = Array.isArray(settings?.formas_pagamento)
    ? (settings.formas_pagamento as string[])
    : DEFAULT_METHODS

  const [methods, setMethods] = useState<string[]>(initialMethods)
  const [newMethod, setNewMethod] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const newMethodRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome_loja: settings?.nome_loja ?? '',
      whatsapp_number: settings?.whatsapp_number ?? '',
      mensagem_boas_vindas: settings?.mensagem_boas_vindas ?? '',
    },
  })

  const addMethod = () => {
    const trimmed = newMethod.trim()
    if (!trimmed) return
    if (methods.includes(trimmed)) {
      toast.error('Essa forma de pagamento já existe.')
      return
    }
    setMethods((prev) => [...prev, trimmed])
    setNewMethod('')
    newMethodRef.current?.focus()
  }

  const removeMethod = (method: string) => {
    setMethods((prev) => prev.filter((m) => m !== method))
  }

  const onSubmit = async (data: FormValues) => {
    if (methods.length === 0) {
      toast.error('Adicione ao menos uma forma de pagamento.')
      return
    }
    setIsSubmitting(true)
    try {
      const result = await upsertSettings({
        nome_loja: data.nome_loja,
        whatsapp_number: data.whatsapp_number,
        mensagem_boas_vindas: data.mensagem_boas_vindas || null,
        formas_pagamento: methods,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Configurações salvas!')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl">
      {/* ── Page header ───────────────────────────────────── */}
      <header className="mb-8">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-rose/80">
          Sistema
        </p>
        <h1 className="font-heading text-4xl font-semibold leading-none tracking-tight text-brand-brown">
          Configurações
        </h1>
        <p className="mt-2 text-sm text-brand-brown/60">
          Informações gerais da loja e formas de pagamento.
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-6 rounded-2xl border border-brand-brown/8 bg-white p-7 shadow-card">

          {/* Nome da loja */}
          <div className="space-y-1.5">
            <label htmlFor="nome_loja" className={labelCls}>
              Nome da loja *
            </label>
            <input
              id="nome_loja"
              {...register('nome_loja')}
              placeholder="Ex: Sabor e Afeto Confeitaria"
              className={inputCls(!!errors.nome_loja) + ' h-10'}
            />
            {errors.nome_loja && (
              <p role="alert" className="text-xs font-medium text-destructive">
                {errors.nome_loja.message}
              </p>
            )}
          </div>

          {/* WhatsApp */}
          <div className="space-y-1.5">
            <label htmlFor="whatsapp_number" className={labelCls}>
              Número do WhatsApp *
            </label>
            <Controller
              name="whatsapp_number"
              control={control}
              render={({ field }) => (
                <PhoneInput
                  id="whatsapp_number"
                  value={field.value}
                  onChange={field.onChange}
                  error={!!errors.whatsapp_number}
                />
              )}
            />
            {errors.whatsapp_number && (
              <p role="alert" className="text-xs font-medium text-destructive">
                {errors.whatsapp_number.message}
              </p>
            )}
          </div>

          {/* Mensagem de boas-vindas */}
          <div className="space-y-1.5">
            <label htmlFor="mensagem_boas_vindas" className={labelCls}>
              Mensagem de boas-vindas
              <span className="ml-1.5 font-normal normal-case tracking-normal text-brand-brown/40">
                (opcional)
              </span>
            </label>
            <textarea
              id="mensagem_boas_vindas"
              {...register('mensagem_boas_vindas')}
              rows={3}
              placeholder="Ex: Feito com amor para você ♡ Encomendas com 48h de antecedência."
              className={inputCls() + ' resize-none py-2.5 leading-relaxed'}
            />
          </div>

          {/* Formas de pagamento */}
          <div className="space-y-2.5">
            <span className={labelCls}>Formas de pagamento</span>

            <div className="flex min-h-[2.25rem] flex-wrap gap-2">
              {methods.length === 0 && (
                <p className="text-xs font-medium text-brand-brown/45">
                  Nenhuma forma adicionada
                </p>
              )}
              {methods.map((method) => (
                <span
                  key={method}
                  className="group flex items-center gap-1.5 rounded-full border border-brand-brown/12 bg-brand-cream-dark/30 px-3 py-1 text-sm font-medium tracking-tight text-brand-brown"
                >
                  {method}
                  <button
                    type="button"
                    onClick={() => removeMethod(method)}
                    aria-label={`Remover ${method}`}
                    className="text-brand-brown/40 transition-colors hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2.25} />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                ref={newMethodRef}
                type="text"
                value={newMethod}
                onChange={(e) => setNewMethod(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMethod() } }}
                placeholder="Adicionar forma de pagamento…"
                className={inputCls() + ' h-10 flex-1'}
              />
              <button
                type="button"
                onClick={addMethod}
                className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-brand-brown/12 bg-white px-3.5 text-sm font-semibold text-brand-brown transition-colors hover:bg-brand-cream"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
                Adicionar
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-full bg-gradient-rose px-6 py-2.5 text-sm font-semibold tracking-tight text-white shadow-elev transition-all hover:shadow-glow active:scale-[0.98] disabled:opacity-60"
          >
            {isSubmitting ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvando…</>
            ) : (
              'Salvar configurações'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
