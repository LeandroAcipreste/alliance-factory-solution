const db = require("../dataBase/connection");

/*
====================================================
 ALTERAR STATUS DO PEDIDO
====================================================
*/
async function changeOrderStatusService(orderId, newStatus) {
    const client = await db.getClient();

    try {
        await client.query("BEGIN");

        /* 🔹 Buscar pedido */
        const orderResult = await client.query(
            `
            SELECT 
                id,
                status,
                total,
                discount,
                shipping,
                vendor_id
            FROM orders
            WHERE id = $1
            FOR UPDATE
            `,
            [orderId]
        );

        if (orderResult.rows.length === 0) {
            throw new Error("Pedido não encontrado.");
        }

        const order = orderResult.rows[0];

        /* 🔹 Validar transição de status */
        const transitionResult = await client.query(
            `
            SELECT 1
            FROM order_transitions
            WHERE from_status = $1
              AND to_status = $2
            `,
            [order.status, newStatus]
        );

        if (transitionResult.rows.length === 0) {
            throw new Error(`Transição inválida: ${order.status} → ${newStatus}`);
        }

        /* ======================================================
           PRODUÇÃO → SÓ MUDA PARA READY SE TUDO ESTIVER CHECKED
        ====================================================== */
        if (newStatus === "ready") {
            const pendingItems = await client.query(
                `
                SELECT 1
                FROM production_order
                WHERE order_id = $1
                  AND checked = false
                `,
                [orderId]
            );

            if (pendingItems.rows.length > 0) {
                throw new Error("Produção incompleta.");
            }
        }

        /* ======================================================
           STATUS = SHIPPED → FINANCEIRO + CARTEIRA
        ====================================================== */
        if (newStatus === "shipped") {
            /* 🔹 Buscar vendedor */
            const vendorResult = await client.query(
                `
                SELECT id, commission_percent
                FROM vendors
                WHERE id = $1
                `,
                [order.vendor_id]
            );

            if (vendorResult.rows.length === 0) {
                throw new Error("Vendedor não encontrado.");
            }

            const vendor = vendorResult.rows[0];

            const orderValue = Number(order.total);
            const discount = Number(order.discount);
            const shipping = Number(order.shipping);

            /* 🔹 Valor da fábrica */
            const factoryAmount =
                (orderValue - discount) + shipping;

            /* 🔹 Comissão do vendedor */
            const vendorCommission =
                (orderValue * vendor.commission_percent) / 100 - discount;

            /* 🔹 Registro financeiro (somente fábrica) */
            await client.query(
                `
                INSERT INTO financial_order
                (order_id, factory_amount, status)
                VALUES ($1, $2, 'pending')
                `,
                [orderId, factoryAmount]
            );

            /* 🔹 Atualizar carteira do vendedor */
            await client.query(
                `
                UPDATE wallets
                SET
                    debit = debit + $1,
                    credit = credit + $2
                WHERE vendor_id = $3
                `,
                [factoryAmount, vendorCommission, vendor.id]
            );
        }

        /* 🔹 Atualizar status do pedido */
        await client.query(
            `
            UPDATE orders
            SET status = $1
            WHERE id = $2
            `,
            [newStatus, orderId]
        );

        await client.query("COMMIT");

        return {
            orderId,
            previousStatus: order.status,
            newStatus
        };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    changeOrderStatusService
};
