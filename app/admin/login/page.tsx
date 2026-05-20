'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, ArrowRight } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function AdminLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/admin'

  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setServerError(null)
    setIsLoading(true)

    try {
      const res = await fetch('/admin/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
      })

      if (!res.ok) {
        const body = (await res.json()) as { error?: string }
        setServerError(body.error ?? 'Erro ao fazer login.')
        return
      }

      router.push(redirectTo)
      router.refresh()
    } catch {
      setServerError('Erro de conexão. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const inputCls = (hasError?: boolean) =>
    [
      'h-11 w-full rounded-xl border bg-white px-4 text-sm font-medium tracking-tight transition-all duration-150',
      'placeholder:text-brand-brown/35 placeholder:font-normal',
      'focus:border-brand-rose focus:outline-none focus:ring-2 focus:ring-brand-rose/25',
      hasError ? 'border-destructive' : 'border-brand-brown/12',
    ].join(' ')

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-warm px-4">
      {/* Decorações de fundo — gradientes radiais sutis */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-rose/8 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-brand-orange/8 blur-3xl"
      />

      <div className="relative w-full max-w-sm">
        {/* ── Brand ──────────────────────────────────────── */}
        <div className="mb-10 flex flex-col items-center gap-5">
          <div className="relative h-20 w-20 drop-shadow-[0_8px_24px_oklch(0.59_0.22_29/0.25)]">
            <Image
              src="/logo_new.svg"
              alt="Sabor e Afeto"
              fill
              priority
              sizes="80px"
              className="object-contain"
            />
          </div>
          <div className="text-center">
            <h1 className="font-heading text-[28px] font-semibold leading-none tracking-tight text-brand-brown">
              Sabor e Afeto
            </h1>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-brown/45">
              Área administrativa
            </p>
          </div>
        </div>

        {/* ── Card ────────────────────────────────────────── */}
        <div className="rounded-3xl border border-brand-brown/8 bg-white p-7 shadow-pop">
          <h2 className="mb-1 font-heading text-xl font-semibold tracking-tight text-brand-brown">
            Bem-vindo de volta
          </h2>
          <p className="mb-6 text-sm text-brand-brown/55">
            Entre para acessar o painel.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {serverError && (
              <div
                role="alert"
                className="rounded-xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm font-medium text-destructive"
              >
                {serverError}
              </div>
            )}

            <fieldset className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-brown/65"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                placeholder="seu@email.com"
                className={inputCls(!!errors.email)}
              />
              {errors.email && (
                <p role="alert" className="text-xs font-medium text-destructive">
                  {errors.email.message}
                </p>
              )}
            </fieldset>

            <fieldset className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-brown/65"
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
                placeholder="••••••••"
                className={inputCls(!!errors.password)}
              />
              {errors.password && (
                <p role="alert" className="text-xs font-medium text-destructive">
                  {errors.password.message}
                </p>
              )}
            </fieldset>

            <button
              type="submit"
              disabled={isLoading}
              className="group mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-rose text-sm font-semibold tracking-tight text-white shadow-elev transition-all duration-150 hover:shadow-glow active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Entrando…
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[11px] font-medium text-brand-brown/40">
          Sabor e Afeto · Confeitaria artesanal
        </p>
      </div>
    </div>
  )
}
