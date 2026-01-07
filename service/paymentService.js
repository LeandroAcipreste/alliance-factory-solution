const db = require("../dataBase/connection");

async function payCashService(){
    const client = await db.getClient();
    try{
        await client.query("BEGIN");

        await client.query(
            `INSERT INTO payment_cash (wallet_id, amount)
            VALUES ($1,$2)`
            [wallet_id, amount]
        );

        await client.query(
            `UPDATE wallets
            SET balance = balance -$1
            WHERE id = $2`,
            [amount, wallet_id]
        );

        await client.query("COMMIT");
        return { success : true};
    } catch (error){
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release
    }
}

module.exports = {
    payCashService
}