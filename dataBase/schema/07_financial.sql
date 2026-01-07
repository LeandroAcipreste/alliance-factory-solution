-- FORMAS DE PAGAMENTO
CREATE TABLE payment_methods (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);

-- PAGAMENTOS
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id),
    method_id INT REFERENCES payment_methods(id),
    amount NUMERIC(12,2) NOT NULL,
    status TEXT CHECK (
        status IN ('pending', 'sent', 'received', 'confirmed')
    ),
    tracking_code TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- RAZÃO FINANCEIRA (DÉBITO / CRÉDITO)
CREATE TABLE financial_ledger (
    id SERIAL PRIMARY KEY,
    client_id INT REFERENCES clients(id),
    order_id INT REFERENCES orders(id),
    type TEXT CHECK (type IN ('debit', 'credit')),
    amount NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- COMISSÕES
CREATE TABLE commissions (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id),
    user_id INT REFERENCES users(id),
    percentage NUMERIC(5,2),
    amount NUMERIC(12,2)
);
