'use server'

import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * Server Action de criação de pedido.
 *
 * Fluxo (4 inserts no banco, em ordem):
 *   1. UPSERT em `customers` usando WhatsApp como chave única
 *      → se for cliente novo, cria; se já existe, atualiza o nome.
 *   2. INSERT em `orders` com status inicial 'realizado'.
 *      → o campo `numero` é gerado pelo banco (IDENTITY) — é o que aparece como #N.
 *   3. INSERT em `order_items` — snapshot dos produtos no momento da compra
 *      (nome/preço gravados aqui, não dependem do produto futuramente mudar).
 *   4. INSERT em `order_status_history` — primeira entrada do histórico/auditoria.
 *
 * Usa `service_role` (bypassa RLS) porque o fluxo é público (sem login do cliente)
 * mas precisa escrever em tabelas protegidas.
 *
 * Segurança:
 *   - Todo o payload é revalidado com Zod no servidor (não confiamos no cliente).
 *   - Preço, nome, prazo e flag `ativo` de CADA item são lidos do banco —
 *     o cliente envia apenas `produtoId` + `quantidade`. Isso impede que um
 *     usuário malicioso manipule `total` ou `preco` no DevTools.
 *   - Total é recalculado server-side a partir dos preços oficiais.
 *   - `formaPagamento` é verificado contra a lista em `settings.formas_pagamento`.
 */

const itemSchema = z.object({
  produtoId: z.string().uuid('ID de produto inválido'),
  quantidade: z.number().int().positive().max(99),
})

const payloadSchema = z.object({
  nomeCliente: z.string().trim().min(2, 'Nome muito curto').max(120),
  whatsapp: z
    .string()
    .trim()
    .regex(/^\d{8,15}$/, 'WhatsApp inválido'),
  items: z.array(itemSchema).min(1, 'Carrinho vazio').max(50),
  formaPagamento: z.string().trim().min(1).max(60),
  observacoes: z.string().trim().max(500).optional(),
})

export type CreateOrderInput = z.input<typeof payloadSchema>

export async function createOrder(
  input: CreateOrderInput,
): Promise<{ orderId?: string; orderNumber?: number; error?: string }> {
  // 0. Valida o payload no servidor. Erros de validação retornam mensagem
  // amigável (não vazam o schema interno).
  const parsed = payloadSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }
  const { nomeCliente, whatsapp, items, formaPagamento, observacoes } = parsed.data

  const supabase = createServiceClient()

  // 0.1. Busca os produtos pelos IDs enviados. SÓ aceitamos produtos ATIVOS —
  // se o admin desativou um produto enquanto o cliente preenchia o carrinho,
  // o pedido é rejeitado em vez de prosseguir com preço/dados desatualizados.
  const produtoIds = items.map((i) => i.produtoId)
  const { data: produtos, error: prodError } = await supabase
    .from('produtos')
    .select('id, nome, preco, ativo, pronta_entrega, prazo_quantidade, prazo_unidade')
    .in('id', produtoIds)

  if (prodError) {
    return { error: 'Erro ao validar produtos.' }
  }

  // Mapa para lookup O(1) e detecção de produtos faltantes/inativos.
  const produtosMap = new Map(produtos?.map((p) => [p.id, p]) ?? [])
  for (const item of items) {
    const p = produtosMap.get(item.produtoId)
    if (!p || !p.ativo) {
      return { error: 'Um dos produtos do carrinho não está mais disponível.' }
    }
  }

  // 0.2. Verifica a forma de pagamento contra a lista configurada em `settings`.
  // Evita receber pedido com forma de pagamento inventada (ex: "Bitcoin").
  const { data: settings } = await supabase
    .from('settings')
    .select('formas_pagamento')
    .maybeSingle()

  const formasValidas = Array.isArray(settings?.formas_pagamento)
    ? (settings.formas_pagamento as string[])
    : []
  if (formasValidas.length > 0 && !formasValidas.includes(formaPagamento)) {
    return { error: 'Forma de pagamento inválida.' }
  }

  // 0.3. Constrói itens com preço/nome/prazo OFICIAIS (do banco) e calcula o
  // total. O cliente nunca define esses valores — só escolhe id e quantidade.
  const itemsParaInserir = items.map((item) => {
    const p = produtosMap.get(item.produtoId)!
    return {
      produto_id: p.id,
      nome: p.nome,
      preco: p.preco,
      quantidade: item.quantidade,
      pronta_entrega: p.pronta_entrega,
      prazo_quantidade: p.prazo_quantidade,
      prazo_unidade: p.prazo_unidade,
    }
  })

  const total = itemsParaInserir.reduce((sum, i) => sum + i.preco * i.quantidade, 0)

  // 1. Upsert do cliente pelo WhatsApp (constraint UNIQUE no banco).
  // Se já existe um cliente com esse número, o nome é atualizado.
  const { data: customer, error: custError } = await supabase
    .from('customers')
    .upsert({ whatsapp, nome: nomeCliente }, { onConflict: 'whatsapp' })
    .select('id')
    .single()

  if (custError || !customer) {
    return { error: 'Erro ao registrar cliente.' }
  }

  // 2. Cria o pedido com status inicial 'realizado'.
  // O `numero` (ex: #42) vem do IDENTITY auto-incremento do Postgres.
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_id: customer.id,
      status: 'realizado',
      forma_pagamento: formaPagamento,
      observacoes: observacoes || null,
      total,
    })
    .select('id, numero')
    .single()

  if (orderError || !order) {
    return { error: 'Erro ao criar pedido.' }
  }

  // 3. Insere os itens como snapshot — gravamos nome e preço CONGELADOS
  // no momento da compra. Se o admin alterar o produto depois, o pedido
  // antigo continua refletindo o que o cliente realmente comprou.
  const { error: itemsError } = await supabase.from('order_items').insert(
    itemsParaInserir.map((i) => ({ order_id: order.id, ...i })),
  )

  if (itemsError) {
    return { error: 'Erro ao registrar itens do pedido.' }
  }

  // 4. Registra primeira entrada no histórico de status (auditoria).
  // Falha aqui não bloqueia o pedido — o histórico é desejável mas não crítico.
  await supabase.from('order_status_history').insert({
    order_id: order.id,
    status: 'realizado',
  })

  return { orderId: order.id, orderNumber: order.numero }
}
