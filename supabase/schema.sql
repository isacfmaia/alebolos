-- =============================================================
-- Bolos da Alê — Schema
-- Execute no SQL Editor do painel Supabase (Settings → SQL Editor)
-- =============================================================

-- -------------------------------------------------------------
-- TABELAS
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS categories (
                                          id    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    nome  text        NOT NULL,
    ordem integer     NOT NULL DEFAULT 0
    );

CREATE TABLE IF NOT EXISTS produtos (
                                        id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    nome             text          NOT NULL,
    descricao        text,
    preco            numeric(10,2) NOT NULL CHECK (preco >= 0),
    foto_url         text,
    categoria_id     uuid          REFERENCES categories(id) ON DELETE SET NULL,
    ativo            boolean       NOT NULL DEFAULT true,
    pronta_entrega   boolean       NOT NULL DEFAULT true,
    prazo_quantidade integer,
    prazo_unidade    text          CHECK (prazo_unidade IN ('minuto','hora','dia','semana','mes')),
    created_at       timestamptz   NOT NULL DEFAULT now(),
    updated_at       timestamptz   NOT NULL DEFAULT now()
    );

-- Tabela singleton: deve ter exatamente uma linha.
CREATE TABLE IF NOT EXISTS settings (
                                        id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    whatsapp_number       text        NOT NULL,
    nome_loja             text        NOT NULL,
    mensagem_boas_vindas  text,
    formas_pagamento      jsonb       NOT NULL DEFAULT '[]'::jsonb
    );

-- -------------------------------------------------------------
-- TRIGGER: atualiza updated_at automaticamente
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS produtos_updated_at ON produtos;
CREATE TRIGGER produtos_updated_at
    BEFORE UPDATE ON produtos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- -------------------------------------------------------------
-- ROW LEVEL SECURITY
-- -------------------------------------------------------------

ALTER TABLE produtos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings    ENABLE ROW LEVEL SECURITY;

-- produtos: leitura pública (somente ativos)
CREATE POLICY "produtos_select_public"
  ON produtos
  FOR SELECT
                 USING (ativo = true);

-- produtos: CRUD completo para autenticados (inclui SELECT de inativos)
CREATE POLICY "produtos_all_authenticated"
  ON produtos
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- categories: leitura pública
CREATE POLICY "categories_select_public"
  ON categories
  FOR SELECT
                        USING (true);

-- categories: CRUD completo para autenticados
CREATE POLICY "categories_all_authenticated"
  ON categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- settings: CRUD completo apenas para autenticados
CREATE POLICY "settings_all_authenticated"
  ON settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- -------------------------------------------------------------
-- STORAGE: bucket product-images
-- -------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
    ON CONFLICT (id) DO NOTHING;

CREATE POLICY "product_images_select_public"
  ON storage.objects
  FOR SELECT
                 USING (bucket_id = 'product-images');

CREATE POLICY "product_images_insert_authenticated"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "product_images_update_authenticated"
  ON storage.objects
  FOR UPDATE
                        TO authenticated
                        USING (bucket_id = 'product-images');

CREATE POLICY "product_images_delete_authenticated"
  ON storage.objects
  FOR DELETE
TO authenticated
  USING (bucket_id = 'product-images');

-- -------------------------------------------------------------
-- DADOS INICIAIS (opcional — ajuste antes de executar)
-- -------------------------------------------------------------

INSERT INTO categories (nome, ordem) VALUES
                                         ('Fofo',     1),
                                         ('Mole',  2),
                                         ('Cobertura',    3),
                                         ('Recheados',  4)
    ON CONFLICT DO NOTHING;

INSERT INTO settings (whatsapp_number, nome_loja, mensagem_boas_vindas, formas_pagamento)
VALUES (
           '5511999999999',
           'Bolos da Alê',
           'Olá! Seja bem-vindo(a) ao cardápio da Bolos da Alê 🎂',
           '["PIX", "Dinheiro", "Cartão de crédito", "Cartão de débito"]'::jsonb
       )
    ON CONFLICT DO NOTHING;

-- =============================================================
-- PEDIDOS
-- =============================================================

-- Clientes: identificados pelo WhatsApp, criados automaticamente no checkout
CREATE TABLE IF NOT EXISTS customers (
                                         id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    whatsapp   text        NOT NULL UNIQUE,
    nome       text        NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
    );

-- Pedidos: numeração sequencial automática
CREATE TABLE IF NOT EXISTS orders (
                                      id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    numero          integer       GENERATED ALWAYS AS IDENTITY,
    customer_id     uuid          NOT NULL REFERENCES customers(id),
    status          text          NOT NULL DEFAULT 'realizado'
    CHECK (status IN (
           'realizado','pagamento_confirmado','em_producao',
           'aguardando_entrega','concluido','cancelado'
                     )),
    forma_pagamento text          NOT NULL,
    observacoes     text,
    total           numeric(10,2) NOT NULL,
    created_at      timestamptz   NOT NULL DEFAULT now(),
    updated_at      timestamptz   NOT NULL DEFAULT now()
    );

-- Itens do pedido: snapshot do produto no momento da compra
CREATE TABLE IF NOT EXISTS order_items (
                                           id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id         uuid          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    produto_id       uuid          REFERENCES produtos(id) ON DELETE SET NULL,
    nome             text          NOT NULL,
    preco            numeric(10,2) NOT NULL,
    quantidade       integer       NOT NULL CHECK (quantidade > 0),
    pronta_entrega   boolean       NOT NULL DEFAULT true,
    prazo_quantidade integer,
    prazo_unidade    text
    );

-- Histórico de status: auditoria de mudanças de estado
CREATE TABLE IF NOT EXISTS order_status_history (
                                                    id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id   uuid        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status     text        NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
    );

DROP TRIGGER IF EXISTS customers_updated_at ON customers;
CREATE TRIGGER customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE customers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_all_authenticated"            ON customers            FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "orders_all_authenticated"               ON orders               FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "order_items_all_authenticated"          ON order_items          FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "order_status_history_all_authenticated" ON order_status_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
