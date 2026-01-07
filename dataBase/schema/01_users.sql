-- USUÁRIOS DO SISTEMA (quem acessa o sistema)
-- Perfis: admin, producao, financeiro, representante, distribuidor

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (
        role IN ('admin', 'producao', 'financeiro', 'representante', 'distribuidor')
    ),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now()
);
