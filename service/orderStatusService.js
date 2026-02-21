const db = require("../dataBase/connection");

/* =====================================================
   GUARD FUNCTIONS (VALIDAM E LANÇAM ERRO)
===================================================== */

function ensureOrderNotShipped(order) {
    if (order.status === "shipped") {
        throw new Error("Pedido já finalizado.");
    }
}

function ensureStatusTransitionAllowed(currentStatus, newStatus, client) {
    return client.query(
        `
        SELECT 1
        FROM order_status_flow
        WHERE from_status = $1
          AND to_status   = $2
        `,
        [currentStatus, newStatus]
    ).then(result => {
        if (result.rows.length === 0) {
            throw new Error(`Transição inválida: ${currentStatus} → ${newStatus}`);
        }
    });
}

function ensureRolePermission(newStatus, role) {
    if (newStatus === "shipped" && role !== "admin") {
        throw new Error("Apenas admin pode marcar pedido como shipped.");
    }

    if (
        role === "producao" &&
        !["in_production", "ready"].includes(newStatus)
    ) {
        throw new Error("Produção não pode executar esta transição.");
    }
}

async function ensureProductionCompleted(client, orderId, newStatus) {
    if (newStatus !== "ready") return;

    const result = await client.query(
        `
        SELECT 1
        FROM production_order
        WHERE order_id = $1
          AND checked = false
        `,
        [orderId]
    );

    if (result.rows.length > 0) {
        throw new Error("Produção incompleta.");
    }
}

/* =====================================================
   APLICA IMPACTO FINANCEIRO (EXECUTA, NÃO VALIDA)
===================================================== */

async function applyFinancialImpact(client, order) {
    const vendorResult = await client.query(
        `
        SELECT id, commission_percent
        FROM vendors
        WHERE user_id = $1
        `,
        [order.created_by]
    );

    if (vendorResult.rows.length === 0) {
        throw new Error("Vendedor não encontrado para este pedido.");
    }

    const vendor = vendorResult.rows[0];
    const commissionPercent = Number(vendor.commission_percent);

    if (Number.isNaN(commissionPercent)) {
        throw new Error("Percentual de comissão inválido.");
    }

    const vendorCommission =
        Number(order.sub_total) * (commissionPercent / 100);

    const factoryReceives =
        Number((order.sub_total) - vendorCommission) + Number(order.shipping);

    /* carteira do vendedor */
    await client.query(
        `
        UPDATE wallets
        SET
            debit_amount  = debit_amount  + $1,
            credit_amount = credit_amount + $2
        WHERE vendor_id = $3
        `,
        [
            factoryReceives,
            vendorCommission,
            vendor.id
        ]
    );

    /* carteira do financeiro */
    await client.query(
        `
        UPDATE wallets
        SET
            credit_amount = credit_amount + $1
        WHERE role = 'financeiro'
        `,
        [factoryReceives]
    );
}

/* =====================================================
   SERVICE PRINCIPAL (FLUXO LIMPO)
===================================================== */

async function changeOrderStatusService(orderId, newStatus, userRole) {
    const client = await db.getClient();

    try {
        await client.query("BEGIN");

        /* buscar pedido com lock */
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

        /* guards */
        ensureOrderNotShipped(order);
        ensureRolePermission(newStatus, userRole);
        await ensureStatusTransitionAllowed(order.status, newStatus, client);
        await ensureProductionCompleted(client, orderId, newStatus);

        /* impacto financeiro */
        if (newStatus === "shipped") {
            await applyFinancialImpact(client, order);
        }

        /* atualizar status */
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
