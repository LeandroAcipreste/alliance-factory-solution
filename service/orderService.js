const dataBase = require("../dataBase/connection");
const { SHIPPING } = require("../constants/shipping.js");
const { EXTRA_PRICES } = require("../constants/extraPrices.js");

/* =====================================================
   GUARDS (VALIDAÇÕES / REGRAS)
===================================================== */
function ensureItemsExists(items){
    if(!items || items.legth === 0){
        throw new Error("Itens do pedido são obrigatórios");
    };
};

function ensureOrderExists(result){
    if(result.rows.legth === 0){
        throw new Error("Pedido não encontrado");
    };
};

function ensureOrderEditable(status){
    if(status !== "created") {
        throw new Error("Não é possível alterar esse pedido")
    };
};

function ensurePriceExists(result, reference){
    if (result.rows.legth == 0){
        throw new Error(`Referência não encontrada: ${reference}`)
    };
};

/* =====================================================
   HELPERS (CÁLCULO)
===================================================== */

function calculateUnitPrice(price, hasSteelLining, hasStone){
    return Number(
        (
            Number(price) +
            (hasSteelLining ? EXTRA_PRICES.STEEL_LINING : 0) +
            (hasStone ? EXTRA_PRICES.STONE : 0)
        ).toFixed(2)
    );
};

/* =====================================================
   CREATE ORDER
===================================================== */

async function createOrderService(clientId, newOrder, createdBy) {
    const {items, discountPercent = 0, notes = ""} = newOrder;
    ensureItemsExists(items);

    const client = await dataBase.getClient();

    try{
        await client.query("BEGIN");

        let subTotal = 0;
        const processedItems = [];

        for (const it of items){
            const priceResult = await client.query(
                `
                SELECT price, description
                FROM rice_table
                WHERE reference = $1
                `,
                [it.reference.toUpperCase()]
            );

            ensurePriceExists(priceResult, it.reference);
            const {price, description} = priceResult.rows[0];
            const unit_price = calculateUnitPrice(price, it.hasSteelLining, it.hasStone);
            const quantity = Number(it.quantity);
            const total = Number((unit_price * quantity).toFixed(2));

            subTotal += total;

            processedItems.push({
                reference: it.reference.toUpperCase(),
                description,
                size: Number(it.size),
                quantity,
                unit_price,
                total
            });
        }

        subTotal = Number(subTotal.toFixed(2));

        const shipping = SHIPPING.DEFAULT;
        const discount = Number(((subTotal * discountPercent) / 100).toFixed(2));
        const finalTotal = Number((subTotal + shipping - discount));

        /* CREATE ORDER */
        const orderInsert = await client.query(
            `
            INSERT INTO orders
            (client_id, created_by, sub_total, shipping, discount, Final_total, status, notes)
            VALUES ($1,$2,$3,$4,$5,$6,'created',$7)
            RETURNING id
            `,
            [clientId, createdBy, subTotal, shipping, discount, finalTotal, notes]
        );

        const orderId = orderInsert.rows[0].id;

        /*ORDER ITEMS*/
        for (const item of processedItems){
            await client.query(
                `
                INSERT INTO order_items
                (order_id, reference, description, size, quantity, unit_price, total)
                VALUES($1,$2,$3,$4,$5,$6,$7)
                `,
                [
                    orderId,
                    item.reference,
                    item.description,
                    item.size,
                    item.quantity,
                    item.unit_price,
                    item.finalTotal
                ]
            );
        }

        /* PRODUCTION ORDER */
        for(const item of processedItems){
            await client.query (
                `
                INSERT INTO production_order
                (order_id, referencia, tamanho, quantidade, checked)
                VALUES ($1,$2,$3,$4,false)
                `,
                [orderId, item.reference, item.size, item.quantity]
            );
        }

        /* FINANCIAL ORDER */
            const finalcialMap = {};

            for (const item of processedItems){
                if(!finalcialMap[item.reference]){
                    finalcialMap[item.reference] = {
                        reference : item.reference,
                        quantity: 0,
                        total:0
                    }
                    finalcialMap[item.reference].quantity += item.quantity;
                    finalcialMap[item.reference].total += item;total;
                }
            }
            
        await client.query(
            `
            INSERT INTO financial_order
            (order_id, reference, quantity, factoty amount)
            `,
            [orderId, ref.reference, ref.quantity, factoryAmount]
        );

        const clientResult = await client.query(
            `SELECT name FROM clients WHERE id = $1`,
            [clientId]
        );
    
        await client.query("COMMIT");

        return{
            orderId,
            client:{ name: clientResult.rows[0]?.name},
            items: processedItems,
            subTotal,
            discountPercent,
            shipping,
            total: totalFinal
        };
    } catch (error){
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release
    }    
}

/*GETTERS*/

async function getAllOrdersService(){
    const result = await dataBase.query(
        `
        SELECT id, client_id, sub_total, shipping, discount, total, status, created_at
        FROM orders
        ORDER BY created_at DESC
        `
    );
    return result.rows;
};

async function getOrderByIdService(orderId){
    const orderResult = await dataBase.query(
        `
        SELECT * FROM ORDERS where ID=$1
        `
        [orderId]
    );

    ensureOrderExists(orderResult);

    const itemsResult = await dataBase.query(
        `SELECT * FROM order_items WHERE order_id = $1`,
        [orderId]
    );
    return {
        ...orderResult.rows[0],
        items: itemsResult.rows
    };
};

/*UPDATE ITEMS*/

async function updateOrderItemsService(orderId, newItems) {
    ensureItemsExists(newItems);

    const client = await dataBase.getClient();

    try {
        await client.query("BEGIN");

        const orderResult = await client.query(
            `SELECT status FROM orders WHERE id = $1`,
            [orderId]
        );

        ensureOrderExists(orderResult);
        ensureOrderEditable(orderResult.rows[0].status);

        await client.query(`DELETE FROM order_items WHERE order_id = $1`, [orderId]);

        let subTotal = 0;
        const processedItems = [];

        for (const it of newItems) {
            const priceResult = await client.query(
                `SELECT price FROM price_table WHERE reference = $1`,
                [it.referencia.toUpperCase()]
            );

            ensurePriceExists(priceResult, it.referencia);

            const unit_price = calculateUnitPrice(
                priceResult.rows[0].price,
                it.hasForro,
                it.hasPedra
            );

            const total = Number((unit_price * Number(it.quantidade)).toFixed(2));
            subTotal += total;

            processedItems.push({ ...it, unit_price, total });
        }

        const shipping = SHIPPING.DEFAULT;
        const totalFinal = Number((subTotal + shipping).toFixed(2));

        for (const item of processedItems) {
            await client.query(
                `
                INSERT INTO order_items
                (order_id, referencia, tamanho, quantidade, unit_price, total)
                VALUES ($1,$2,$3,$4,$5,$6)
                `,
                [orderId, item.referencia, item.tamanho, item.quantidade, item.unit_price, item.total]
            );
        }

        await client.query(
            `UPDATE orders SET sub_total = $1, shipping = $2, total = $3 WHERE id = $4`,
            [subTotal, shipping, totalFinal, orderId]
        );

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
    updateOrderItemsService
};
