CREATE TABLE IF NOT EXISTS price_table (
    id SERIAL PRIMARY KEY,
    reference VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    steel_lining_price NUMERIC(10,2) DEFAULT 0,
    stone_price NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);