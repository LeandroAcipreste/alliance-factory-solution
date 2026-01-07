-- PRODUÇÃO POR ITEM
-- Controle real de chão de fábrica

CREATE TABLE order_item_production (
    id SERIAL PRIMARY KEY,
    order_item_id INT REFERENCES order_items(id),
    referencia TEXT NOT NULL,
    quantidade_produzida INT NOT NULL,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT now()
);

-- LOG GERAL DE PRODUÇÃO (com ou sem pedido)
CREATE TABLE production_logs (
    id SERIAL PRIMARY KEY,
    referencia TEXT NOT NULL,
    quantidade INT NOT NULL,
    origem TEXT CHECK (origem IN ('pedido', 'producao_livre')),
    created_at TIMESTAMP DEFAULT now()
);
