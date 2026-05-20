export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type OrderStatus =
  | 'realizado'
  | 'pagamento_confirmado'
  | 'em_producao'
  | 'aguardando_entrega'
  | 'concluido'
  | 'cancelado'

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  realizado: 'Pedido Realizado',
  pagamento_confirmado: 'Pagamento Confirmado',
  em_producao: 'Em Produção',
  aguardando_entrega: 'Aguardando Entrega/Retirada',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

export const ORDER_STATUS_LIST: OrderStatus[] = [
  'realizado',
  'pagamento_confirmado',
  'em_producao',
  'aguardando_entrega',
  'concluido',
  'cancelado',
]

export type Database = {
  public: {
    Tables: {
      produtos: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          preco: number
          foto_url: string | null
          categoria_id: string | null
          ativo: boolean
          pronta_entrega: boolean
          prazo_quantidade: number | null
          prazo_unidade: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          descricao?: string | null
          preco: number
          foto_url?: string | null
          categoria_id?: string | null
          ativo?: boolean
          pronta_entrega?: boolean
          prazo_quantidade?: number | null
          prazo_unidade?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          descricao?: string | null
          preco?: number
          foto_url?: string | null
          categoria_id?: string | null
          ativo?: boolean
          pronta_entrega?: boolean
          prazo_quantidade?: number | null
          prazo_unidade?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'produtos_categoria_id_fkey'
            columns: ['categoria_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
      categories: {
        Row: {
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      customers: {
        Row: {
          id: string
          whatsapp: string
          nome: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          whatsapp: string
          nome: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          whatsapp?: string
          nome?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          numero: number
          customer_id: string
          status: string
          forma_pagamento: string
          observacoes: string | null
          total: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          status?: string
          forma_pagamento: string
          observacoes?: string | null
          total: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          status?: string
          forma_pagamento?: string
          observacoes?: string | null
          total?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'orders_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'customers'
            referencedColumns: ['id']
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          produto_id: string | null
          nome: string
          preco: number
          quantidade: number
          pronta_entrega: boolean
          prazo_quantidade: number | null
          prazo_unidade: string | null
        }
        Insert: {
          id?: string
          order_id: string
          produto_id?: string | null
          nome: string
          preco: number
          quantidade: number
          pronta_entrega?: boolean
          prazo_quantidade?: number | null
          prazo_unidade?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          produto_id?: string | null
          nome?: string
          preco?: number
          quantidade?: number
          pronta_entrega?: boolean
          prazo_quantidade?: number | null
          prazo_unidade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_produto_id_fkey'
            columns: ['produto_id']
            isOneToOne: false
            referencedRelation: 'produtos'
            referencedColumns: ['id']
          },
        ]
      }
      order_status_history: {
        Row: {
          id: string
          order_id: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          status: string
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'order_status_history_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
        ]
      }
      settings: {
        Row: {
          id: string
          whatsapp_number: string
          nome_loja: string
          mensagem_boas_vindas: string | null
          formas_pagamento: Json
        }
        Insert: {
          id?: string
          whatsapp_number: string
          nome_loja: string
          mensagem_boas_vindas?: string | null
          formas_pagamento?: Json
        }
        Update: {
          id?: string
          whatsapp_number?: string
          nome_loja?: string
          mensagem_boas_vindas?: string | null
          formas_pagamento?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type ProdutoRow = Database['public']['Tables']['produtos']['Row']
export type ProdutoInsert = Database['public']['Tables']['produtos']['Insert']
export type ProdutoUpdate = Database['public']['Tables']['produtos']['Update']

export type CategoryRow = Database['public']['Tables']['categories']['Row']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']

export type CustomerRow = Database['public']['Tables']['customers']['Row']
export type OrderRow = Database['public']['Tables']['orders']['Row']
export type OrderItemRow = Database['public']['Tables']['order_items']['Row']
export type OrderStatusHistoryRow = Database['public']['Tables']['order_status_history']['Row']

export type SettingsRow = Database['public']['Tables']['settings']['Row']
export type SettingsInsert = Database['public']['Tables']['settings']['Insert']
export type SettingsUpdate = Database['public']['Tables']['settings']['Update']

export type ProdutoWithCategory = ProdutoRow & { categories: CategoryRow | null }

export type PaymentMethod = string
