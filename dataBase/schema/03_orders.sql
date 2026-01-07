-- PEDIDOS (macro)
-- Status controlado por state machine no banco

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    client_id INT NOT NULL REFERENCES clients(id),
    created_by INT NOT NULL REFERENCES users(id),
    sub_total NUMERIC(12,2) NOT NULL,
    shipping NUMERIC(12,2) NOT NULL,
    discount NUMERIC(12,2) NOT NULL,
    total NUMERIC(12,2) NOT NULL,
    status TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT now()
);

