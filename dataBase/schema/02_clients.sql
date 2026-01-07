-- CLIENTES (lojas)
-- NÃO acessam o sistema, mas geram pedidos e débitos

CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    debit_open NUMERIC(12,2),
    created_at TIMESTAMP DEFAULT now()
);

