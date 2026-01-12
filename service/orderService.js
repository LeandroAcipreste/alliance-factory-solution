const dataBase = require("../dataBase/connection");

async function createOrderService(clientId, newOrder) {
    const { items, discountPercent = 0, notes = "" } = newOrder;

    if (!items || items.length === 0) {
        throw new Error("Itens do pedido são obrigatórios.");
    }

    const client = await dataBase.getClient();

    try {
        await client.query("BEGIN");

        let subTotal = 0;
        const processedItems = [];

        for (const it of items) {
            const priceResult = await client.query(
                `
                SELECT price, steel_lining_price, stone_price
                FROM price_table
                WHERE reference = $1
                `,
                [it.referencia.toUpperCase()]
            );

            if (priceResult.rows.length === 0) {
                throw new Error(`Referência não encontrada: ${it.referencia}`);
            }

            const row = priceResult.rows[0];

            const unit_price = Number(
                (
                    Number(row.price) +
                    (it.hasForro ? Number(row.steel_lining_price) : 0) +
                    (it.hasPedra ? Number(row.stone_price) : 0)
                ).toFixed(2)
            );

            const quantidade = Number(it.quantidade);
            const total = Number((unit_price * quantidade).toFixed(2));

            subTotal += total;

            processedItems.push({
                referencia: it.referencia.toUpperCase(),
                tamanho: Number(it.tamanho),
                quantidade,
                unit_price,
                total
            });
        }

        const shipping = 74;
        const discount = Number(((subTotal * discountPercent) / 100).toFixed(2));
        const totalFinal = Number((subTotal + shipping - discount).toFixed(2));

        /* ===============================
           CRIA PEDIDO
        ============================== */
        const orderInsert = await client.query(
            `
            INSERT INTO orders
            (client_id, sub_total, shipping, discount, total, status, notes)
            VALUES ($1,$2,$3,$4,$5,'created',$6)
            RETURNING id
            `,
            [clientId, subTotal, shipping, discount, totalFinal, notes]
        );

        const orderId = orderInsert.rows[0].id;

        /* ===============================
           ITENS DO PEDIDO
        ============================== */
        for (const item of processedItems) {
            await client.query(
                `
                INSERT INTO order_items
                (order_id, referencia, tamanho, quantidade, unit_price, total)
                VALUES ($1,$2,$3,$4,$5,$6)
                `,
                [
                    orderId,
                    item.referencia,
                    item.tamanho,
                    item.quantidade,
                    item.unit_price,
                    item.total
                ]
            );
        }

        /* ===============================
           PRODUÇÃO (nasce aqui)
        ============================== */
        for (const item of processedItems) {
            await client.query(
                `
                INSERT INTO production_order
                (order_id, referencia, tamanho, quantidade, checked)
                VALUES ($1,$2,$3,$4,false)
                `,
                [
                    orderId,
                    item.referencia,
                    item.tamanho,
                    item.quantidade
                ]
            );
        }

        /* ===============================
           FINANCEIRO (POR REFERÊNCIA)
           fábrica recebe:
           (item - desconto proporcional) + frete proporcional
        ============================== */
        for (const item of processedItems) {
            const itemDiscount = Number(
                ((item.total / subTotal) * discount).toFixed(2)
            );

            const itemShipping = Number(
                ((item.total / subTotal) * shipping).toFixed(2)
            );

            const factoryAmount = Number(
                (item.total - itemDiscount + itemShipping).toFixed(2)
            );

            await client.query(
                `
                INSERT INTO financial_order
                (order_id, referencia, quantidade, factory_amount, status)
                VALUES ($1,$2,$3,$4,'pending')
                `,
                [
                    orderId,
                    item.referencia,
                    item.quantidade,
                    factoryAmount
                ]
            );
        }

        await client.query("COMMIT");

        return {
            orderId,
            subTotal,
            shipping,
            discount,
            total: totalFinal
        };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}


/* ===============================
   BUSCAR TODOS OS PEDIDOS
================================ */
async function getAllOrdersService() {
    const result = await dataBase.query(
        `
        SELECT id, client_id, sub_total, shipping, discount, total, status, created_at
        FROM orders
        ORDER BY created_at DESC
        `
    );
    return result.rows;
}

/* ===============================
   BUSCAR PEDIDO POR ID
================================ */
async function getOrderByIdService(orderId) {
    const orderResult = await dataBase.query(
        `SELECT * FROM orders WHERE id = $1`,
        [orderId]
    );

    if (orderResult.rows.length === 0) {
        throw new Error("Pedido não encontrado.");
    }

    const itemsResult = await dataBase.query(
        `SELECT * FROM order_items WHERE order_id = $1`,
        [orderId]
    );

    return {
        ...orderResult.rows[0],
        items: itemsResult.rows
    };
}

/* ===============================
   ATUALIZAR STATUS DO PEDIDO
================================ */
async function updateOrderStatusService(orderId, newStatus) {
    const client = await dataBase.getClient();
    try {
        await client.query("BEGIN");
        const orderResult = await client.query(`SELECT status FROM orders WHERE id = $1`, [orderId]);

        if (orderResult.rows.length === 0) throw new Error("Pedido não encontrado.");

        const currentStatus = orderResult.rows[0].status;
        const statusFlow = { created: "in_production", in_production: "ready", ready: "shipped", shipped: "delivered" };

        if (newStatus !== "canceled" && statusFlow[currentStatus] !== newStatus) {
            throw new Error(`Transição inválida: ${currentStatus} -> ${newStatus}`);
        }

        await client.query(`UPDATE orders SET status = $1 WHERE id = $2`, [newStatus, orderId]);
        await client.query("COMMIT");
        return { orderId, status: newStatus };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

/* ===============================
   ATUALIZAR ITENS DO PEDIDO
================================ */
async function updateOrderItemsService(orderId, newItems) {
    if (!newItems || newItems.length === 0) throw new Error("Itens obrigatórios.");
    const client = await dataBase.getClient();
    try {
        await client.query("BEGIN");
        const orderResult = await client.query(`SELECT status FROM orders WHERE id = $1`, [orderId]);
        if (orderResult.rows.length === 0 || orderResult.rows[0].status !== "created") {
            throw new Error("Não é possível alterar este pedido.");
        }

        await client.query(`DELETE FROM order_items WHERE order_id = $1`, [orderId]);

        let subTotal = 0;
        const processedItems = [];

        for (const it of newItems) {
            const priceResult = await client.query(
                `SELECT price, steel_lining_price, stone_price FROM price_table WHERE reference = $1`,
                [it.referencia.toUpperCase()]
            );
            if (priceResult.rows.length === 0) throw new Error(`Ref inválida: ${it.referencia}`);

            const row = priceResult.rows[0];
            const unit_price = Number((Number(row.price) + (it.hasForro ? Number(row.steel_lining_price) : 0) + (it.hasPedra ? Number(row.stone_price) : 0)).toFixed(2));
            const total = Number((unit_price * Number(it.quantidade)).toFixed(2));
            subTotal += total;

            processedItems.push({ ...it, unit_price, total });
        }

        const shipping = 74;
        const totalFinal = Number((subTotal + shipping).toFixed(2));

        for (const item of processedItems) {
            await client.query(
                `INSERT INTO order_items (order_id, referencia, tamanho, quantidade, unit_price, total, has_forro, has_pedra) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                [orderId, item.referencia, item.tamanho, item.quantidade, item.unit_price, item.total, item.hasForro, item.hasPedra]
            );
        }

        await client.query(`UPDATE orders SET sub_total = $1, shipping = $2, total = $3 WHERE id = $4`, [subTotal, shipping, totalFinal, orderId]);
        await client.query("COMMIT");
        return { orderId, subTotal, total: totalFinal, items: processedItems };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    createOrderService,
    getAllOrdersService,
    getOrderByIdService,
    updateOrderStatusService,
    updateOrderItemsService
};