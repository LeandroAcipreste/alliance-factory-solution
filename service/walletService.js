const db = require("../dataBase/connection");

async function createWallet(saller_id){
    const createSaller = await db.query(
        `INSERT INTO wallets (saller_id)
        VAUES ($1)
        RETURNING *`,
        [saller_id]
    );
    return createSaller.rows[0];
};

async function updateWalletBalance(){
    const updateWallet = await db.query(
        `UPDATE wallets
        SET balance = ballance + $1
        WHERE id = $2
        RETURNING *`,
        [value, wallet_id]
    );
    return updateWallet.rows[0];
};

module.exports = {
    createWallet,
    updateWalletBalance
}