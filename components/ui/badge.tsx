import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-brand-rose/10 text-brand-rose-dark',
        success: 'bg-emerald-500/10 text-emerald-700',
        destructive: 'bg-destructive/10 text-destructive',
        secondary: 'bg-muted text-muted-foreground',
        outline: 'border border-border text-foreground bg-transparent',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

type BadgeProps = React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
