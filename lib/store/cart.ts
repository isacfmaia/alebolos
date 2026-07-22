import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/**
 * Store global do carrinho de compras (Zustand + persist em localStorage).
 *
 * O carrinho sobrevive entre reloads de página — usuário pode adicionar
 * itens, fechar a aba, voltar depois, e o carrinho continua lá.
 *
 * Operações:
 *  - add(item):      adiciona; se já existe, incrementa a quantidade.
 *  - increment(id):  +1 na quantidade.
 *  - decrement(id):  -1; se chegar a 0, remove o item automaticamente.
 *  - remove(id):     remove o item por completo.
 *  - clear():        zera o carrinho (chamado após finalizar pedido).
 */

export type CartItem = {
  id: string
  nome: string
  preco: number
  foto_url: string | null
  pronta_entrega: boolean
  prazo_quantidade: number | null
  prazo_unidade: string | null
}

export type CartEntry = {
  item: CartItem
  quantity: number
}

type CartStore = {
  entries: CartEntry[]
  add: (item: CartItem) => void
  remove: (id: string) => void
  increment: (id: string) => void
  decrement: (id: string) => void
  clear: () => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      entries: [],

      add: (item) =>
        set((s) => {
          const found = s.entries.find((e) => e.item.id === item.id)
          if (found) {
            return {
              entries: s.entries.map((e) =>
                e.item.id === item.id ? { ...e, quantity: e.quantity + 1 } : e,
              ),
            }
          }
          return { entries: [...s.entries, { item, quantity: 1 }] }
        }),

      remove: (id) => set((s) => ({ entries: s.entries.filter((e) => e.item.id !== id) })),

      increment: (id) =>
        set((s) => ({
          entries: s.entries.map((e) =>
            e.item.id === id ? { ...e, quantity: e.quantity + 1 } : e,
          ),
        })),

      decrement: (id) =>
        set((s) => ({
          entries: s.entries
            .map((e) => (e.item.id === id ? { ...e, quantity: e.quantity - 1 } : e))
            .filter((e) => e.quantity > 0),
        })),

      clear: () => set({ entries: [] }),
    }),
    {
      name: 'alebolos-cart',
      storage: createJSONStorage(() => localStorage),
      // skipHydration evita mismatch de SSR; rehydrate() é chamado no useEffect do CatalogClient
      skipHydration: true,
    },
  ),
)
