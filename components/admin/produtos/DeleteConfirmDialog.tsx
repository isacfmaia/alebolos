'use client'

import { useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

type Props = {
  isOpen: boolean
  name: string
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function DeleteConfirmDialog({ isOpen, name, onClose, onConfirm }: Props) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose()}>
      <DialogContent showCloseButton={false} className="max-w-sm p-6">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-base">Excluir produto?</DialogTitle>
              <DialogDescription className="mt-1">
                <strong className="text-foreground">{name}</strong> será removido
                permanentemente, incluindo a foto. Esta ação não pode ser desfeita.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-brand-brown transition-colors hover:bg-brand-cream disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-2 text-sm font-bold text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Excluindo…
              </>
            ) : (
              'Excluir'
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
