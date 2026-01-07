-- ITENS DO PEDIDO
-- Cada item representa uma referência + tamanho

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    referencia TEXT NOT NULL,
    tamanho INT NOT NULL,
    quantidade INT NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    total NUMERIC(12,2) NOT NULL
);
