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

        /* =====================================================
           BUSCAR PEDIDO (lock)
        ===================================================== */
        const orderResult = await client.query(
            `
            SELECT 
                id,
                status,
                created_by,
                sub_total,
                shipping
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

        /* =====================================================
           VALIDAR TRANSIÇÃO DE STATUS
        ===================================================== */
        const transitionResult = await client.query(
            `
            SELECT 1
            FROM order_status_flow
            WHERE from_status = $1
              AND to_status   = $2
            `,
            [order.status, newStatus]
        );

        if (transitionResult.rows.length === 0) {
            throw new Error(`Transição inválida: ${order.status} → ${newStatus}`);
        }

        /* =====================================================
           PRODUÇÃO → READY (todos os itens precisam estar checked)
        ===================================================== */
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

        /* =====================================================
           SHIPPED → IMPACTO FINANCEIRO
        ===================================================== */
        if (newStatus === "shipped") {

            /* 🔹 Buscar vendedor pelo created_by */
            const vendorResult = await client.query(
                `
                SELECT v.id, v.commission_percent
                FROM vendors v
                WHERE v.user_id = $1
                `,
                [order.created_by]
            );

            if (vendorResult.rows.length === 0) {
                throw new Error("Vendedor não encontrado para este pedido.");
            }

            const vendor = vendorResult.rows[0];

            /* 🔹 Somar o que a fábrica tem a receber */
            const factoryResult = await client.query(
                `
                SELECT COALESCE(SUM(factory_amount), 0) AS total_factory
                FROM financial_order
                WHERE order_id = $1
                `,
                [orderId]
            );

            const totalFactory = Number(factoryResult.rows[0].total_factory);

            /* 🔹 Comissão do vendedor */
            const commission =
                Number(order.sub_total) * (vendor.commission_percent / 100);

            /* 🔹 Atualizar carteira do vendedor */
            await client.query(
                `
                UPDATE wallets
                SET
                    debit_amount  = debit_amount  + $1,
                    credit_amount = credit_amount + $2
                WHERE vendor_id = $3
                `,
                [
                    totalFactory + Number(order.shipping),
                    commission,
                    vendor.id
                ]
            );

            /* 🔹 Atualizar carteira do financeiro */
            await client.query(
                `
                UPDATE wallets
                SET
                    credit_amount = credit_amount + $1
                WHERE role = 'financeiro'
                `,
                [totalFactory]
            );
        }

        /* =====================================================
           ATUALIZAR STATUS DO PEDIDO
        ===================================================== */
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
