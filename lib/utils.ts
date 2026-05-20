import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Helper para concatenar classes Tailwind condicionalmente, resolvendo
 * conflitos. Padrão shadcn/ui.
 *
 *   cn('p-2', 'p-4')              → 'p-4'        (twMerge resolve o conflito)
 *   cn('text-red-500', isOk && 'text-green-500') → conforme a flag
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
