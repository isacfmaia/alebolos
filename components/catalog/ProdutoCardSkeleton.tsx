import { Skeleton } from '@/components/ui/skeleton'

export function ProdutoCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-brand-brown/6 bg-white shadow-card">
      <Skeleton className="aspect-[5/4] w-full rounded-none bg-brand-cream-dark/60" />
      <div className="flex flex-col gap-4 p-5">
        <div className="space-y-2">
          <Skeleton className="h-6 w-3/4 bg-brand-cream-dark/60" />
          <Skeleton className="h-4 w-full bg-brand-cream-dark/60" />
          <Skeleton className="h-4 w-2/3 bg-brand-cream-dark/60" />
        </div>
        <Skeleton className="h-5 w-32 rounded-full bg-brand-cream-dark/60" />
        <div className="flex items-end justify-between pt-1">
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16 bg-brand-cream-dark/60" />
            <Skeleton className="h-7 w-24 bg-brand-cream-dark/60" />
          </div>
          <Skeleton className="h-10 w-28 rounded-full bg-brand-cream-dark/60" />
        </div>
      </div>
    </div>
  )
}
