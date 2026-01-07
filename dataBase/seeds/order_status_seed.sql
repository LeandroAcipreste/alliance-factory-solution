-- STATE MACHINE DO PEDIDO

CREATE TABLE order_status (
    code TEXT PRIMARY KEY,
    flow_order INT NOT NULL,
    description TEXT
);

INSERT INTO order_status (code, flow_order, description) VALUES
('created', 1, 'Pedido criado'),
('in_production', 2, 'Em produção'),
('ready', 3, 'Pronto'),
('shipped', 4, 'Enviado'),
('delivered', 5, 'Entregue'),
('paid', 6, 'Pago'),
('completed', 7, 'Finalizado'),
('canceled', 99, 'Cancelado'),
('returned', 100, 'Devolvido');
